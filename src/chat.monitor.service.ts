import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
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
            if (
                chat.psy ||
                !chat.consultationStartedAt ||
                !chat.consultationEndedAt ||
                chat.surveyRequestedAt ||
                chat.surveyCompletedAt
            ) {
                continue;
            }

            const diffMilliseconds = now.getTime() - chat.consultationEndedAt.getTime();
            const diffMinutes = diffMilliseconds / 1000 / 60;

            if (diffMinutes >= 5) {
                const marked = await this.chatService.markSurveyRequested(chat.chatId);
                if (marked.count === 1) {
                    this.chatGateway.sendSurvey(chat.chatId);
                }
            }
        }
    }
}
