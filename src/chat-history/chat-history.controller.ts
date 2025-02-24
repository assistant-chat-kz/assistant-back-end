import { Body, Controller, Get, Param, Post, Put } from "@nestjs/common";
import { ChatHistoryService } from "./chat-history.service";

@Controller('chat-history')
export class ChatHistoryController {
    constructor(private readonly chatHistoryService: ChatHistoryService) { }

    @Post()
    createChatHistory(@Body() body: { userId: string, messages: any[] }) {
        return this.chatHistoryService.createChatHistory(body.userId, body.messages)
    }

    @Get(':userId')
    getChatHistory(@Param('userId') userId: string) {
        return this.chatHistoryService.getChatHistory(userId)
    }

    @Put(':userId')
    updateChatHistory(@Param('userId') userId: string, @Body() body: { userId: string, messages: any[] }) {
        return this.chatHistoryService.updateChatHistory(userId, body.messages)
    }
} 
