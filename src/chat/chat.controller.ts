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
    getChat(@Param('chatId') chatId: string) {
        return this.chatService.getChat(chatId)
    }

    @Get()
    getAllChats() {
        return this.chatService.getAllChats()
    }

    @Put(':chatId')
    updateChat(@Param('chatId') chatId: string, @Body() body: { chatId: string, messages: any[], members: string[] }) {
        return this.chatService.updateChat(chatId, body.messages, body.members)
    }
    @Put(':chatId/call')
    callPsyInChat(@Param('chatId') chatId: string, @Body() body: { call: boolean }) {
        return this.chatService.callPsyInChat(chatId, body.call)
    }
    @Put(':chatId/psyInChat')
    insertPsyInChat(@Param('chatId') chatId: string, @Body() body: { psyId: string }) {
        return this.chatService.insertPsyInChat(chatId, body.psyId)
    }
} 
