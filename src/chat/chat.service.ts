import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma.service";
import { Message } from "./chat.dto";
import { ChatGateway } from "../chat.gateway";

@Injectable()
export class ChatService {
    constructor(
        private prisma: PrismaService,
        @Inject(forwardRef(() => ChatGateway)) private chatGateway: ChatGateway
    ) { }


    async createChat(chatId: string, messages: { title: string; text: string; position: string }[], members: string[]) {
        const chat = await this.prisma.chat.create({
            data: {
                chatId,
                members: { set: members },
                messages: {
                    create: messages.map((msg) => ({
                        title: msg.title,
                        text: msg.text,
                        position: msg.position,
                    })),
                },
            },
            include: { messages: true },
        });

        this.chatGateway.server.emit("chatCreated", chat);

        return chat;
    }

    async sendMessage(chatId: string, message: Message) {
        try {
            const newMessage = await this.prisma.message.create({
                data: {
                    chatId,
                    title: message.title,
                    text: message.text,
                    position: message.position,
                },
                select: {
                    id: true,
                    chatId: true,
                    title: true,
                    text: true,
                    position: true
                }
            });



            console.log("Сообщение успешно сохранено:", JSON.stringify(newMessage, null, 2));
            this.chatGateway.server.to(chatId).emit("newMessage", newMessage);

            return newMessage;
        } catch (error) {
            console.error("Ошибка при сохранении сообщения:", error);
            throw new Error("Ошибка при отправке сообщения");
        }
    }

    async updateChat(chatId: string, messages: Message[], members?: string[]) {
        const updatedChat = await this.prisma.chat.update({
            where: { chatId },
            data: {
                members: members ? { set: members } : undefined,
                messages: {
                    create: messages,
                },
            },
            include: { messages: true },
        });
        // this.chatGateway.server.to(chatId).emit("chatUpdated", updatedChat);

        return updatedChat;
    }

    async joinChat(chatId: string, userId: string) {
        try {
            const chat = await this.prisma.chat.findUnique({
                where: { chatId },
                select: { members: true },
            });

            if (!chat) throw new Error("Чат не найден");


            const updatedMembers = new Set(chat.members);
            updatedMembers.add(userId);

            const updatedChat = await this.prisma.chat.update({
                where: { chatId },
                data: {
                    members: { set: Array.from(updatedMembers) },
                },
                include: { messages: true },
            });

            console.log(`👤 Пользователь ${userId} добавлен в чат ${chatId}`);

            return updatedChat;
        } catch (error) {
            console.error("❌ Ошибка в joinChat:", error.message);
            throw error;
        }
    }

    async leaveChat(chatId: string, userId: string) {
        try {
            const chat = await this.prisma.chat.findUnique({
                where: { chatId },
                select: { members: true, psy: true },
            });

            if (!chat) throw new Error("Чат не найден");


            const updatedMembers = new Set(chat.members);
            updatedMembers.delete(userId);
            const psychologistIsLeaving = chat.psy === userId;

            const updatedChat = await this.prisma.chat.update({
                where: { chatId },
                data: {
                    members: { set: Array.from(updatedMembers) },
                    psy: psychologistIsLeaving ? null : undefined,
                    call: psychologistIsLeaving ? false : undefined,
                    consultationEndedAt: psychologistIsLeaving ? new Date() : undefined,
                },
                include: { messages: true },
            });

            console.log(`👤🔴 Пользователь ${userId} вышел из чата ${chatId}`);

            return updatedChat;
        } catch (error) {
            console.error("❌ Ошибка в leaveChat:", error.message);
            throw error;
        }
    }

    async callPsyInChat(chatId: string, call: boolean) {
        try {
            const chat = await this.prisma.chat.findUnique({
                where: { chatId: chatId }
            });

            if (!chat) throw new Error("Чат не найден");


            const updatedChat = await this.prisma.chat.update({
                where: { chatId: chatId },
                data: { call: call },
            });


            return updatedChat
        } catch (error) {
            console.error("❌ Ошибка в callPsyInChat:", error.message);
            throw error;
        }
    }


    async getAllChats() {
        return this.prisma.chat.findMany({})
    }

    async getChat(chatId: string) {
        return this.prisma.chat.findUnique({
            where: { chatId },
            include: { messages: true }
        })
    }

    async getLastMessage(chatId: string) {
        const chat = await this.prisma.chat.findUnique({
            where: { chatId },
            select: {
                messages: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                }
            }
        });

        return chat?.messages?.[0] || null;
    }

    async insertPsyInChat(chatId: string, psyId: string) {
        const chat = await this.prisma.chat.findUnique({
            where: { chatId }
        })

        if (!chat) throw new Error("Чат не найден");

        if (chat.psy === psyId && chat.consultationStartedAt) {
            return chat;
        }

        const updateChat = await this.prisma.chat.update({
            where: { chatId },
            data: {
                psy: psyId,
                call: false,
                consultationPsychologistId: psyId,
                consultationStartedAt: new Date(),
                consultationEndedAt: null,
                surveyRequestedAt: null,
                surveyCompletedAt: null,
            }
        })

        return updateChat

    }

    async markSurveyRequested(chatId: string) {
        return this.prisma.chat.updateMany({
            where: {
                chatId,
                psy: null,
                consultationStartedAt: { not: null },
                consultationEndedAt: { not: null },
                surveyRequestedAt: null,
                surveyCompletedAt: null,
            },
            data: { surveyRequestedAt: new Date() },
        });
    }
}
