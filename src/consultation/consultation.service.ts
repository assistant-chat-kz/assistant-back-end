import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma.service";
import { UserDto } from "src/user/user.dto";
import { Question } from "./consultation.dto";

@Injectable()
export class ConsultationService {
    constructor(
        private prisma: PrismaService
    ) { }

    async createConsultation(chatId: string, user: UserDto, answers: Record<string, string | null>, psyId?: string) {

        const questions: Question[] = Object.entries(answers).map(([question, answer]) => ({
            question,
            answer: String(answer),
        }));

        const consultation = await this.prisma.consultation.create({
            data: {
                chatId: chatId,
                user: {
                    connect: {
                        id: user.id
                    }
                },
                psyId: psyId,
                questions: {
                    create: questions.map((question) => ({
                        chatId: chatId,
                        userId: user.id,
                        question: question.question,
                        answer: question.answer,

                    }))
                }
            },
            include: {
                questions: true,
            }
        });

        await this.prisma.chat.update({
            where: { chatId: chatId },
            data: {
                members: []
            }
        })

        return consultation;
    }

    async createConsultationNoAuth(chatId: string, userNoAuthId: string, answers: Record<string, string | null>, psyId?: string) {

        const questions: Question[] = Object.entries(answers).map(([question, answer]) => ({
            question,
            answer: String(answer),
        }));

        const consultation = await this.prisma.consultation.create({
            data: {
                chatId: chatId,
                userNoAuthId: userNoAuthId,
                psyId: psyId,
                questions: {
                    create: questions.map((question) => ({
                        chatId: chatId,
                        userNoAuthId: userNoAuthId,
                        question: question.question,
                        answer: question.answer,

                    }))
                }
            },
            include: {
                questions: true,
            }
        });

        await this.prisma.chat.update({
            where: { chatId: chatId },
            data: {
                members: []
            }
        })

        return consultation;
    }


    async getConsulataionsById(chatId: string, userId: string) {
        return this.prisma.consultation.findMany({
            where: { chatId, userId },
            include: { questions: true }
        })
    }

    async getAllConsultations() {
        return this.prisma.consultation.findMany({
            include: {
                questions: true
            }
        })
    }

    async findByChatId(chatId: string) {
        return this.prisma.consultation.findFirst({
            where: { chatId },
            include: {
                questions: true
            }
        });
    }


}