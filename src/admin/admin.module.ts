import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { PrismaService } from "src/prisma.service";

@Module({
    controllers: [AdminController],
    providers: [AdminService, PrismaService],
    exports: [AdminService]
})

export class AdminModule { }