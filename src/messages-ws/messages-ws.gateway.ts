import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { MessagesWsService } from './messages-ws.service';
import { Server, Socket } from 'socket.io';
import { NewMessageDto } from './dtos/new-message.dto';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({ cors: true })
export class MessagesWsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() wss: Server;
  constructor(private readonly messagesWsService: MessagesWsService, private jwtService: JwtService) { }

  async handleConnection(client: Socket, ...args: any[]) {
    const token = client.handshake.headers.authentication as string;
    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(token);
      await this.messagesWsService.registerClient(client, payload.id);
    } catch (error) {
      client.disconnect();
      return
    }
    
    this.wss.emit('clients-updated', this.messagesWsService.getConnectedClients());

  }
  handleDisconnect(client: Socket) {
    this.messagesWsService.removeClient(client.id)
    this.wss.emit('clients-updated', this.messagesWsService.getConnectedClients());
  }

  @SubscribeMessage('message-from-client')
  handleMessageFromClient(client: Socket, payload: NewMessageDto) {
    console.log(client.id, payload)
    // Este metodo es para comunicar al usuario que envio el mensaje
    // client.emit('message-from-server', {
    //   fullName: 'Yo',
    //   message: payload.message
    // })

    // Este metodo es para enviar a todos menos al usuario que lo envia
    // client.broadcast.emit('message-from-server', {
    //     fullName: 'Yo',
    //     message: payload.message
    //   })

    // este metodo emite a todos incluyendo al emisor
    this.wss.emit('message-from-server', {
      fullName: 'Yo',
      message: payload.message
    })

  }

}
