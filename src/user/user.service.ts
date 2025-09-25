import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma.service";
import { UserDto } from "./user.dto";
import { UserNoAuth } from "@prisma/client";

@Injectable()
export class UserService {
    constructor(private prisma: PrismaService) { }

    async getAll() {
        return this.prisma.user.findMany({})
    }

    async getAllUsersNoAuth() {
        return this.prisma.userNoAuth.findMany({})
    }

    async updateUser(id: string, updateData: Partial<UserDto> | Partial<UserNoAuth>) {
        const user = await this.prisma.user.findUnique({ where: { id } });

        if (user) {
            return this.prisma.user.update({
                where: { id },
                data: updateData,
            });
        }

        const userNoAuth = await this.prisma.userNoAuth.findUnique({ where: { id } });

        if (userNoAuth) {
            return this.prisma.userNoAuth.update({
                where: { id },
                data: updateData,
            });
        }

        throw new Error(`Пользователь с id=${id} не найден ни в user, ни в userNoAuth`);
    }

    async getUserById(id: string) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        const userNoAuth = await this.prisma.userNoAuth.findUnique({ where: { id } });

        return user ? user : userNoAuth
    }

    async visitUser(id: string) {
        try {

            return await this.prisma.user.update({
                where: { id },
                data: { visits: { increment: 1 } },
            });
        } catch (err) {

            return await this.prisma.userNoAuth.update({
                where: { id },
                data: { visits: { increment: 1 } },
            });
        }
    }


    // async verifyUser(id: string) {
    //     const user = this.prisma.user.findUnique({
    //         where: { id, verify: false }
    //     })

    //     if (!user) throw new Error('Пользователя такого нет')

    //     return this.prisma.user.update({
    //         where: { id },
    //         data: { verify: true }
    //     })
    // }
}