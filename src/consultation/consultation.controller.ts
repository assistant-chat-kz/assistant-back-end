import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ConsultationService } from "./consultation.service";
import { UserDto } from "src/user/user.dto";
// import { Question } from "./consultation.dto";

@Controller('consultation')
export class ConsultationController {
    constructor(private readonly consultationService: ConsultationService) { }

    @Post()
    createConsultation(@Body() body: { chatId: string, user: UserDto, answers: Record<string, string>; }) {
        return this.consultationService.createConsultation(body.chatId, body.user, body.answers)
    }

    @Get(':chatId')
    getConsultationsById(
        @Param('chatId') chatId: string,
        @Query('userId') userId: string
    ) {
        return this.consultationService.getConsulataionsById(chatId, userId);
    }


    @Get()
    getAllConsultations() {
        return this.consultationService.getAllConsultations()
    }

    // @Put(':chatId')
    // updateChat(@Param('chatId') chatId: string, @Body() body: { chatId: string, messages: any[], members: string[] }) {
    //     return this.chatService.updateChat(chatId, body.messages, body.members)
    // }
    // @Put(':chatId/call')
    // callPsyInChat(@Param('chatId') chatId: string, @Body() body: { call: boolean }) {
    //     return this.chatService.callPsyInChat(chatId, body.call)
    // }
} 
