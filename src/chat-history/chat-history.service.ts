import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma.service";
import { Message } from "./chat-history.dto";

@Injectable()
export class ChatHistoryService {
    constructor(private prisma: PrismaService) { }

    async createChatHistory(userId: string, messages: Message[]) {
        return this.prisma.chatHistory.create({
            data: {
                userId: userId,
                messages: {
                    create: messages.map(message => ({
                        position: message.position,
                        title: message.title,
                        text: message.text,
                    })),
                },
            },
        });
    }

    async getChatHistory(userId: string) {
        return this.prisma.chatHistory.findUnique({
            where: { userId },
            include: { messages: true }
        })
    }

    async updateChatHistory(userId: string, messages: Message[]) {
        return this.prisma.chatHistory.update({
            where: {
                userId: userId,
            },
            data: {
                messages: {
                    create: messages,
                },
            },
        });
    }

    async deleteChatHistory(userId: string) {
        return this.prisma.chatHistory.delete({
            where: { userId }
        })
    }
}