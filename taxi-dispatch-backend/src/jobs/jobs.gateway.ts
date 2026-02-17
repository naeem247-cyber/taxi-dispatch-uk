import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/dispatch' })
export class JobsGateway {
  @WebSocketServer()
  server: Server;

  broadcastJobUpdate(payload: unknown) {
    this.server.emit('job.updated', payload);
  }
}
