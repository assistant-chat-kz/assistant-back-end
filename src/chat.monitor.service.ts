import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ChatService } from './chat/chat.service';
import { ChatGateway } from './chat.gateway';
import { ConsultationService } from './consultation/consultation.service';

@Injectable()
export class ChatMonitorService {
    constructor(
        private readonly chatService: ChatService,
        private readonly consultationService: ConsultationService,
        private readonly chatGateway: ChatGateway,
    ) { }

    @Cron('* * * * *')
    async checkInactiveChats() {
        const chats = await this.chatService.getAllChats();
        const now = new Date();


        for (const chat of chats) {
            const lastMessage = await this.chatService.getLastMessage(chat.chatId);

            // const existingConsultation = await this.consultationService.findByChatId(chat.chatId);

            // if (existingConsultation) {
            //     continue;
            // }

            if (!lastMessage) {
                this.chatGateway.sendSurvey(chat.chatId);
                continue;
            }

            const lastMessageTime = new Date(lastMessage.createdAt);
            const diffMilliseconds = now.getTime() - lastMessageTime.getTime();
            const diffMinutes = diffMilliseconds / 1000 / 60;

            // if (diffMinutes >= 5) {
            //     this.chatGateway.sendSurvey(chat.chatId);
            // }
            this.chatGateway.sendSurvey(chat.chatId);
        }
    }



}
