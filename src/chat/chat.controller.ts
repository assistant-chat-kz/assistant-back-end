import { Body, Controller, Get, Param, Post, Put } from "@nestjs/common";
import { ChatService } from "./chat.service";

@Controller('chat')
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    @Post()
    createChat(@Body() body: { chatId: string, messages: any[], members: string[] }) {
        return this.chatService.createChat(body.chatId, body.messages, body.members)
    }

    @Get(':chatId')
    getChat(@Param('userId') userId: string) {
        return this.chatService.getChat(userId)
    }

    @Put(':chatId')
    updateChat(@Param('userId') userId: string, @Body() body: { userId: string, messages: any[], members: string[] }) {
        return this.chatService.updateChat(userId, body.messages, body.members)
    }
} 
