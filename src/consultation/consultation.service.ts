import { BadRequestException, Injectable } from "@nestjs/common";
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
        const chat = await this.prisma.chat.findUnique({ where: { chatId } });
        if (!chat?.consultationStartedAt) {
            throw new BadRequestException("Для этого чата нет завершённой консультации");
        }

        const existing = await this.prisma.consultation.findUnique({
            where: {
                chatId_sessionStartedAt: {
                    chatId,
                    sessionStartedAt: chat.consultationStartedAt,
                },
            },
            include: { questions: true },
        });
        if (existing) return existing;

        if (!chat.surveyRequestedAt || chat.surveyCompletedAt) {
            throw new BadRequestException("Оценка для этой консультации недоступна");
        }

        const effectivePsyId = chat.consultationPsychologistId || psyId;

        return this.prisma.$transaction(async (transaction) => {
            const consultation = await transaction.consultation.create({
                data: {
                    chatId,
                    sessionStartedAt: chat.consultationStartedAt,
                    user: { connect: { id: user.id } },
                    psyId: effectivePsyId,
                    questions: {
                        create: questions.map((question) => ({
                            chatId,
                            userId: user.id,
                            psyId: effectivePsyId,
                            question: question.question,
                            answer: question.answer,
                        })),
                    },
                },
                include: { questions: true },
            });

            await transaction.chat.update({
                where: { chatId },
                data: {
                    members: { set: ["Assistant", user.id] },
                    call: false,
                    psy: null,
                    surveyCompletedAt: new Date(),
                },
            });

            return consultation;
        });
    }

    async createConsultationNoAuth(chatId: string, userNoAuthId: string, answers: Record<string, string | null>, psyId?: string) {
        const questions: Question[] = Object.entries(answers).map(([question, answer]) => ({
            question,
            answer: String(answer),
        }));
        const chat = await this.prisma.chat.findUnique({ where: { chatId } });
        if (!chat?.consultationStartedAt) {
            throw new BadRequestException("Для этого чата нет завершённой консультации");
        }

        const existing = await this.prisma.consultation.findUnique({
            where: {
                chatId_sessionStartedAt: {
                    chatId,
                    sessionStartedAt: chat.consultationStartedAt,
                },
            },
            include: { questions: true },
        });
        if (existing) return existing;

        if (!chat.surveyRequestedAt || chat.surveyCompletedAt) {
            throw new BadRequestException("Оценка для этой консультации недоступна");
        }

        const effectivePsyId = chat.consultationPsychologistId || psyId;

        return this.prisma.$transaction(async (transaction) => {
            const consultation = await transaction.consultation.create({
                data: {
                    chatId,
                    sessionStartedAt: chat.consultationStartedAt,
                    userNoAuthId,
                    psyId: effectivePsyId,
                    questions: {
                        create: questions.map((question) => ({
                            chatId,
                            userNoAuthId,
                            psyId: effectivePsyId,
                            question: question.question,
                            answer: question.answer,
                        })),
                    },
                },
                include: { questions: true },
            });

            await transaction.chat.update({
                where: { chatId },
                data: {
                    members: { set: ["Assistant", userNoAuthId] },
                    call: false,
                    psy: null,
                    surveyCompletedAt: new Date(),
                },
            });

            return consultation;
        });
    }


    async getConsulataionsById(chatId: string, userId: string) {
        return this.prisma.consultation.findMany({
            where: {
                chatId,
                OR: [{ userId }, { userNoAuthId: userId }],
            },
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
