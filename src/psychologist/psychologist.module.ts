import { Module } from "@nestjs/common";
import { PsychologistController } from "./psychologist.contoller";
import { PsychologistService } from "./psychologist.service";
import { PrismaService } from "src/prisma.service";

@Module({
    controllers: [PsychologistController],
    providers: [PsychologistService, PrismaService],
    exports: [PsychologistService]
})
export class PsychologistModule { }