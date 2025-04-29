import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma.service";

@Injectable()
export class UserService {
    constructor(private prisma: PrismaService) { }

    async getAll() {
        return this.prisma.user.findMany({})
    }

    async getUserById(id: string) {
        return this.prisma.user.findUnique({
            where: { id },
        });
    }

    async verifyUser(id: string) {
        const user = this.prisma.user.findUnique({
            where: { id, verify: false }
        })

        if (!user) throw new Error('Пользователя такого нет')

        return this.prisma.user.update({
            where: { id },
            data: { verify: true }
        })
    }
}