import { Inject, forwardRef, Injectable } from "@nestjs/common";
import {
    WebSocketGateway,
    SubscribeMessage,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    MessageBody,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { ChatService } from "./chat/chat.service";

@WebSocketGateway({ cors: true })
@Injectable()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private users = new Map<string, string>()
    private userRooms: Map<string, Set<string>> = new Map();

    constructor(@Inject(forwardRef(() => ChatService)) private readonly chatService: ChatService) {
        console.log("ChatGateway создан!");
    }


    handleConnection(client: Socket) {
        const userId = client.handshake.query.userId as string;

        if (!userId) {
            client.disconnect();
            console.log(`❌ Отключен клиент без userId: ${client.id}`);
            return;
        }

        this.users.set(userId, client.id);
        console.log(`✅ Пользователь ${userId} подключился (socket: ${client.id})`);

        this.server.emit("userConnected", { userId });
    }

    async handleDisconnect(client: Socket) {
        const userId = [...this.users.entries()].find(([_, id]) => id === client.id)?.[0];

        if (userId) {
            console.log(`🔴 Пользователь ${userId} отключился (socket: ${client.id})`);

            const chatIds = this.userRooms.get(userId) || new Set();
            for (const chatId of chatIds) {
                try {
                    const updatedChat = await this.chatService.leaveChat(chatId, userId);
                    this.server.to(chatId).emit("userLeave", {
                        userId,
                        chatId,
                        members: updatedChat.members,
                        psy: updatedChat.psy,
                    });
                } catch (error: any) {
                    console.error(`❌ Ошибка выхода из чата ${chatId}:`, error.message);
                }
            }

            this.users.delete(userId);
            this.userRooms.delete(userId);

            this.server.emit("userDisconnected", { userId });
        }
    }



    @SubscribeMessage("joinChat")
    async handleJoinChat(client: Socket, chatId: string) {
        try {
            if (!chatId) throw new Error("chatId отсутствует");

            const userId = [...this.users.entries()].find(([_, socketId]) => socketId === client.id)?.[0];
            if (!userId) throw new Error("userId не найден");

            client.join(chatId);

            if (!this.userRooms.has(userId)) {
                this.userRooms.set(userId, new Set());
            }
            this.userRooms.get(userId)!.add(chatId);

            const updatedChat = await this.chatService.joinChat(chatId, userId);

            console.log(`📌 Пользователь ${userId} вошел в чат ${chatId}`);

            this.server.to(chatId).emit("userJoined", { userId, chatId, members: updatedChat.members });
        } catch (error) {
            console.error("❌ Ошибка в joinChat:", error.message);
        }
    }

    @SubscribeMessage("leaveChat")
    async handleLeaveChat(client: Socket, chatId: string) {
        try {
            if (!chatId) throw new Error("chatId отсутствует");

            const userId = [...this.users.entries()].find(([_, socketId]) => socketId === client.id)?.[0];
            if (!userId) throw new Error("userId не найден");

            if (!this.userRooms.has(userId)) {
                this.userRooms.set(userId, new Set());
            }
            this.userRooms.get(userId)!.delete(chatId);

            const updatedChat = await this.chatService.leaveChat(chatId, userId);
            client.leave(chatId);

            console.log(`📌🔴 Пользователь ${userId} вышел из чата ${chatId}`);

            this.server.to(chatId).emit("userLeave", {
                userId,
                chatId,
                members: updatedChat.members,
                psy: updatedChat.psy,
            });
        } catch (error) {
            console.error("❌ Ошибка в leaveChat:", error.message);
        }
    }



    @SubscribeMessage("sendMessage")
    async handleSendMessage(@MessageBody() data: { chatId: string; message: any }) {
        console.log("📩 Сервер получил сообщение:", data);

        const clientsInRoom = this.server.sockets.adapter.rooms.get(data.chatId);
        console.log(`👥 Клиенты в комнате ${data.chatId}:`, clientsInRoom ? Array.from(clientsInRoom) : "никого нет!");

        // await this.chatService.sendMessage(data.chatId, data.message)
        this.server.to(data.chatId).emit("newMessage", data.message);
    }

    sendSurvey(chatId: string) {
        this.server.to(chatId).emit("send-survey", {
            chatId,
            message: "Прошло 5 минут без активности. Пожалуйста, пройдите опрос.",
        });
        // console.log(`📋 Опросник отправлен в чат ${chatId}`);
    }
}
