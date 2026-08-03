import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AudienceSource, UserNoAuth } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { UserDto } from './user.dto';

const safeUserSelect = {
    id: true,
    name: true,
    surname: true,
    email: true,
    createdAt: true,
    verify: true,
    visits: true,
    source: true,
    lastSeenAt: true,
} as const;

const safeGuestSelect = {
    id: true,
    name: true,
    visits: true,
    source: true,
    lastSeenAt: true,
} as const;

@Injectable()
export class UserService {
    constructor(private prisma: PrismaService) { }

    async getAll() {
        return this.prisma.user.findMany({ select: safeUserSelect });
    }

    async getAllUsersNoAuth() {
        return this.prisma.userNoAuth.findMany({ select: safeGuestSelect });
    }

    async updateUser(id: string, updateData: Partial<UserDto> | Partial<UserNoAuth>) {
        const user = await this.prisma.user.findUnique({ where: { id } });

        if (user) {
            return this.prisma.user.update({
                where: { id },
                data: {
                    name: typeof updateData.name === 'string' ? updateData.name.trim() : undefined,
                    surname:
                        'surname' in updateData && typeof updateData.surname === 'string'
                            ? updateData.surname.trim()
                            : undefined,
                },
                select: safeUserSelect,
            });
        }

        const userNoAuth = await this.prisma.userNoAuth.findUnique({ where: { id } });

        if (userNoAuth) {
            return this.prisma.userNoAuth.update({
                where: { id },
                data: {
                    name: typeof updateData.name === 'string' ? updateData.name.trim() : undefined,
                },
                select: safeGuestSelect,
            });
        }

        throw new NotFoundException(`Пользователь с id=${id} не найден`);
    }

    async getUserById(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: safeUserSelect,
        });
        const userNoAuth = await this.prisma.userNoAuth.findUnique({
            where: { id },
            select: safeGuestSelect,
        });

        return user ?? userNoAuth;
    }

    async verifyUser(id: string) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) throw new NotFoundException(`Пользователь с id=${id} не найден`);

        return this.prisma.user.update({
            where: { id },
            data: { verify: true },
            select: safeUserSelect,
        });
    }

    async visitUser(id: string, sessionId: string) {
        if (!sessionId?.trim()) {
            throw new BadRequestException('sessionId is required');
        }

        const user = await this.prisma.user.findUnique({
            where: { id },
            select: { id: true, source: true, visits: true, lastSeenAt: true },
        });
        const guest = user
            ? null
            : await this.prisma.userNoAuth.findUnique({
                where: { id },
                select: { id: true, source: true, visits: true, lastSeenAt: true },
            });
        const visitor = user ?? guest;

        if (!visitor) {
            throw new NotFoundException(`Пользователь с id=${id} не найден`);
        }

        try {
            const result = await this.prisma.$transaction(async (transaction) => {
                const existingSession = await transaction.visitSession.findUnique({
                    where: {
                        visitorId_sessionId: {
                            visitorId: id,
                            sessionId,
                        },
                    },
                });

                if (existingSession) {
                    return { recorded: false, ...visitor };
                }

                await transaction.visitSession.create({
                    data: {
                        visitorId: id,
                        sessionId,
                        source: visitor.source,
                    },
                });

                const data = {
                    visits: { increment: 1 },
                    lastSeenAt: new Date(),
                };
                const updatedVisitor = user
                    ? await transaction.user.update({
                        where: { id },
                        data,
                        select: { id: true, visits: true, source: true, lastSeenAt: true },
                    })
                    : await transaction.userNoAuth.update({
                        where: { id },
                        data,
                        select: { id: true, visits: true, source: true, lastSeenAt: true },
                    });

                return { recorded: true, ...updatedVisitor };
            });

            return result;
        } catch (error: any) {
            if (error?.code === 'P2002') {
                return { recorded: false, ...visitor };
            }
            throw error;
        }
    }

    async getAnalytics() {
        const [users, guests, chats, consultations, visitSessions] = await Promise.all([
            this.prisma.user.findMany({ select: safeUserSelect }),
            this.prisma.userNoAuth.findMany({ select: safeGuestSelect }),
            this.prisma.chat.findMany({
                select: {
                    chatId: true,
                    members: true,
                    messages: {
                        select: {
                            title: true,
                            position: true,
                            createdAt: true,
                        },
                    },
                },
            }),
            this.prisma.consultation.findMany({
                select: {
                    userId: true,
                    userNoAuthId: true,
                    questions: { select: { answer: true } },
                },
            }),
            this.prisma.visitSession.findMany({
                select: { visitorId: true, createdAt: true },
            }),
        ]);

        const visitors = [
            ...users.map((user) => ({ ...user, kind: 'registered' as const })),
            ...guests.map((guest) => ({
                ...guest,
                surname: '',
                email: '',
                createdAt: null,
                verify: true,
                kind: 'guest' as const,
            })),
        ];

        const rows = visitors.map((visitor) => {
            const visitorChats = chats.filter((chat) => chat.members.includes(visitor.id));
            const messages = visitorChats.flatMap((chat) => chat.messages);
            const userMessages = messages.filter(
                (message) =>
                    message.position.toLowerCase() === 'right' &&
                    message.title.toLowerCase() !== 'assistant',
            ).length;
            const assistantMessages = messages.filter(
                (message) => message.title.toLowerCase() === 'assistant',
            ).length;
            const visitorConsultations = consultations.filter(
                (consultation) =>
                    consultation.userId === visitor.id ||
                    consultation.userNoAuthId === visitor.id,
            );
            const surveyScores = visitorConsultations.flatMap((consultation) =>
                consultation.questions
                    .map((question) => Number(question.answer))
                    .filter((answer) => Number.isFinite(answer) && answer >= 1 && answer <= 10),
            );
            const averageRating = surveyScores.length
                ? Number(
                    (
                        surveyScores.reduce((total, score) => total + score, 0) /
                        surveyScores.length
                    ).toFixed(1),
                )
                : null;
            const lastMessageAt = messages.reduce<Date | null>((latest, message) => {
                if (!latest || message.createdAt > latest) return message.createdAt;
                return latest;
            }, null);
            const sessions = visitSessions.filter(
                (session) => session.visitorId === visitor.id,
            );
            const lastSessionAt = sessions.reduce<Date | null>((latest, session) => {
                if (!latest || session.createdAt > latest) return session.createdAt;
                return latest;
            }, null);

            return {
                id: visitor.id,
                name: visitor.name || 'Гость',
                surname: visitor.surname,
                email: visitor.email,
                kind: visitor.kind,
                source: visitor.source,
                sessions: sessions.length,
                returns: Math.max(sessions.length - 1, 0),
                userMessages,
                assistantMessages,
                totalMessages: messages.length,
                consultationCount: visitorConsultations.length,
                averageRating,
                lastSeenAt: lastSessionAt ?? visitor.lastSeenAt ?? lastMessageAt,
                createdAt: visitor.createdAt,
            };
        });

        return {
            summary: {
                users: rows.length,
                kazakhtelecom: rows.filter(
                    (row) => row.source === AudienceSource.KAZAKHTELECOM,
                ).length,
                other: rows.filter((row) => row.source === AudienceSource.OTHER).length,
                userMessages: rows.reduce((total, row) => total + row.userMessages, 0),
                returns: rows.reduce((total, row) => total + row.returns, 0),
                consultations: rows.reduce(
                    (total, row) => total + row.consultationCount,
                    0,
                ),
                averageRating: (() => {
                    const ratings = rows
                        .map((row) => row.averageRating)
                        .filter((rating): rating is number => rating !== null);
                    return ratings.length
                        ? Number(
                            (
                                ratings.reduce((total, rating) => total + rating, 0) /
                                ratings.length
                            ).toFixed(1),
                        )
                        : null;
                })(),
            },
            users: rows.sort((a, b) => {
                const first = a.lastSeenAt?.getTime() ?? 0;
                const second = b.lastSeenAt?.getTime() ?? 0;
                return second - first;
            }),
        };
    }
}
