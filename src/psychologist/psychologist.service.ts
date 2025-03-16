import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma.service";

@Injectable()
export class PsychologistService {
    constructor(private prisma: PrismaService) { }

    async getAll() {
        return this.prisma.psychologist.findMany({})
    }

    async getPsychologistById(id: string) {
        return this.prisma.psychologist.findUnique({
            where: { id }
        })
    }
}