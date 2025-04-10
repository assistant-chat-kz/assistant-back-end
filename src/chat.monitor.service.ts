import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ChatService } from './chat/chat.service';
import { ChatGateway } from './chat.gateway';

@Injectable()
export class ChatMonitorService {
    constructor(
        private readonly chatService: ChatService,
        private readonly chatGateway: ChatGateway,
    ) { }

    @Cron('* * * * *')
    async checkInactiveChats() {
        const chats = await this.chatService.getAllChats();
        const now = new Date();

        for (const chat of chats) {
            const lastMessage = await this.chatService.getLastMessage(chat.chatId);

            if (!lastMessage) {
                this.chatGateway.sendSurvey(chat.chatId);
                continue;
            }

            const lastMessageTime = new Date(lastMessage.createdAt);

            const diffMilliseconds = now.getTime() - lastMessageTime.getTime();
            const diffMinutes = diffMilliseconds / 1000 / 60;

            console.log(`Last message time: ${lastMessageTime}`);
            console.log(`Current time: ${now}`);
            console.log(`Difference in milliseconds: ${diffMilliseconds}`);
            console.log(`Difference in minutes: ${diffMinutes}`);

            if (diffMinutes >= 5) {
                this.chatGateway.sendSurvey(chat.chatId);
            }
        }
    }


}
