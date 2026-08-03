import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserController } from './user/user.controller';
import { UserService } from './user/user.service';
import { EmotionController } from './emotion/emotion.controller';
// import { ChatController } from './chat/chat.controller';
// import { ChatService } from './chat/chat.service';
import { PrismaService } from './prisma.service'
import { AdminController } from './admin/admin.controller';
import { AdminService } from './admin/admin.service';
import { PsychologistController } from './psychologist/psychologist.contoller';
import { PsychologistService } from './psychologist/psychologist.service';
import { ChatModule } from './chat/chat.module';
import { ConsultationController } from './consultation/consultation.controller';
import { ConsultationService } from './consultation/consultation.service';

import { ScheduleModule } from '@nestjs/schedule';
import { ChatMonitorService } from './chat.monitor.service';
// import { SpeechModule } from './whisper/speech.module';
import { SpeechModule } from './speech/speech.module';
import { GigaChatController } from './gigachat/gigachat.controller';
import { GigaChatService } from './gigachat/gigachat.service';

@Module({
  imports: [AuthModule, ChatModule, ScheduleModule.forRoot(), SpeechModule],
  controllers: [AppController, GigaChatController, UserController, AdminController, PsychologistController, ConsultationController, EmotionController],
  providers: [AppService, GigaChatService, UserService, AdminService, PrismaService, PsychologistService, ConsultationService, ChatMonitorService],
  exports: [GigaChatService]
})
export class AppModule { }
