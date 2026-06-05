import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Logger } from "@nestjs/common";

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGINS?.split(",") ?? ["http://localhost:3000"],
    credentials: true,
  },
  namespace: "/realtime",
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage("join-queue")
  handleJoinQueue(
    @MessageBody() data: { tenantId: string; date: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `queue:${data.tenantId}:${data.date}`;
    client.join(room);
    return { event: "joined", room };
  }

  // Emit queue update to all clients watching the day's queue
  emitQueueUpdate(tenantId: string, date: string, payload: unknown) {
    const room = `queue:${tenantId}:${date}`;
    this.server.to(room).emit("queue-updated", payload);
  }

  // Emit notification to a specific user
  emitNotification(
    userId: string,
    notification: { type: string; message: string; data?: unknown },
  ) {
    this.server.to(`user:${userId}`).emit("notification", notification);
  }

  @SubscribeMessage("join-user-room")
  handleJoinUserRoom(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`user:${data.userId}`);
    return { event: "joined", room: `user:${data.userId}` };
  }
}
