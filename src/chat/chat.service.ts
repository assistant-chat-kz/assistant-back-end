import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma.service";
import { Message } from "./chat.dto";

@Injectable()
export class ChatService {
    constructor(private prisma: PrismaService) { }

    async createChat(chatId: string, messages: { title: string; text: string; position: string }[], members: string[]) {

        const chat = await this.prisma.chat.create({
            data: {
                chatId,
                members: members,
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

        return chat;
    }



    async getChat(chatId: string) {
        return this.prisma.chat.findUnique({
            where: { chatId },
            include: { messages: true }
        })
    }

    async getAllChats() {
        return this.prisma.chat.findMany({})
    }

    async updateChat(chatId: string, messages: Message[], members: string[]) {

        return this.prisma.chat.update({
            where: { chatId },
            data: {
                members,
                messages: {
                    createMany: {
                        data: messages,
                    },
                },
            },
        });
    }


    async deleteChat(chatId: string) {
        return this.prisma.chat.delete({
            where: { chatId }
        })
    }
}