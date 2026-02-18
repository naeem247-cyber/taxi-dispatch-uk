import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Job } from '../database/entities/job.entity';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/dispatch' })
export class JobsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket): void {
    const role = String(client.handshake.auth?.role ?? client.handshake.query?.role ?? '');
    const driverId = String(client.handshake.auth?.driverId ?? client.handshake.query?.driverId ?? '');

    if (role === 'operator') {
      client.join('operators');
    }

    if (driverId) {
      client.join(`driver:${driverId}`);
    }
  }

  @SubscribeMessage('join.operator')
  joinOperatorRoom(@ConnectedSocket() client: Socket): void {
    client.join('operators');
  }

  @SubscribeMessage('join.driver')
  joinDriverRoom(@ConnectedSocket() client: Socket, @MessageBody() body: { driverId: string }): void {
    if (body?.driverId) {
      client.join(`driver:${body.driverId}`);
    }
  }

  broadcastJobCreated(job: Job): void {
    this.server.to('operators').emit('job.updated', { event: 'job.created', job });
  }

  broadcastJobAssigned(job: Job, driverId: string): void {
    this.server.to('operators').emit('job.updated', { event: 'job.assigned', job });
    this.server.to(`driver:${driverId}`).emit('job.updated', { event: 'job.assigned', job });
  }

  broadcastJobStatusChanged(job: Job): void {
    this.server.to('operators').emit('job.updated', { event: 'job.status_changed', job });
    if (job.assignedDriverId) {
      this.server.to(`driver:${job.assignedDriverId}`).emit('job.updated', { event: 'job.status_changed', job });
    }
  }
}
