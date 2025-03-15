import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma.service";

@Injectable()
export class AdminService {
    constructor(private prisma: PrismaService) { }

    async getAdminById(id: string) {
        return this.prisma.admin.findUnique({
            where: { id }
        })
    }
}