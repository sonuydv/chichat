import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

import { ActionTypes, FormData } from '@realtime-form/data';
import { UserModel } from 'apps/api/src/app/model/user.model';
import { UserStatus } from 'libs/data/src/model/client.model';
import { ChatServiceServer } from 'apps/api/src/app/service/chat-service.server';
import { ChatMessage } from 'libs/data/src/model/chat.model';

@WebSocketGateway()
export class EventsGateway {
  // idleClients: UserModel[] = []
  waitingRoomList : UserModel[] = [];
  connectedClientList : string[] = [];
  // chattingClients: UserModel[] = []
  chatRoomList: Map<string, string> = new Map<string, string>()
  data = {};
  @WebSocketServer()
  server: Server;
  private logger: Logger = new Logger('EventsGateway');

  constructor(
    private chatService: ChatServiceServer
  ) {
  }

  handleConnection(client: Socket) {
    this.connectedClientList.push(client.id)
    this.connectToStranger(client)
    this.logger.log(
      `Client connected: ${client.id} - ${this.connectedClientList.length} connected clients.`
    );

    /*Notify all the clients*/
    // this.server.emit(ActionTypes.ClientConnected, this.waitingRoomList);

    /*Notify the current client*/
    // client.emit(ActionTypes.Data, this.data);
  }

  handleDisconnect(clientSock: Socket) {
    this.connectedClientList = this.connectedClientList.filter(
      connectedClient => connectedClient !== clientSock.id
    );
    this.waitingRoomList = this.waitingRoomList.filter(
      connectedClient => connectedClient.usrId !== clientSock.id
    );
    this.logger.log(
      `Client disconnected: ${clientSock.id} - ${this.connectedClientList.length} connected clients.`
    );
    // this.server.emit(ActionTypes.ClientConnected, this.waitingRoomList);
  }
  //
  // @SubscribeMessage(ActionTypes.PatchValue)
  // patchValue(client: Socket, payload: Partial<FormData>) {
  //   this.data = { ...this.data, ...payload };
  //   this.logger.log(`Patch value: ${JSON.stringify(payload)}.`);
  //   client.broadcast.emit(ActionTypes.ValuePatched, payload);
  // }


  /*Connect to new stranger*/
  @SubscribeMessage(ActionTypes.reJoinRoom)
  connectNew(clientSock: Socket){
   this.logger.log(
     ActionTypes.reJoinRoom + ' : ' + clientSock.id
   )
    this.connectToStranger(clientSock)

  }




  connectToStranger(clientSock: Socket){

    /*If there is no users in waiting list*/
    if(this.waitingRoomList.length < 1){
      /*add the current use to the waiting list*/
      this.waitingRoomList.push(new UserModel(clientSock.id, UserStatus.waiting))
      this.logger.log('Server : Room init roomId : '+clientSock.id)
      return
    }else{
      /*If use already in waiting list*/
      // let index = this.waitingRoomList.findIndex(value => value.usrId == clientSock.id)
      // if(index == -1) return
      /*Get the first user from waiting list to create room*/
      let newRoom = this.waitingRoomList[0].usrId
      /*and Remove the uses from waiting list*/
      this.waitingRoomList = this.waitingRoomList.filter((client)=>
        client.usrId !== newRoom
      )
      /*Send requested client he has joined a group/client*/
      clientSock.emit(ActionTypes.joined,newRoom)
      /*Now notify the waiting list client the same*/
      clientSock.to(newRoom).emit(ActionTypes.joined,newRoom)
      /*Create room with waiting list client*/
      this.logger.log('Server : Room joined roomId : '+newRoom)
      clientSock.join(newRoom)
    }
  }

  @SubscribeMessage(ActionTypes.sendRoomMsg)
  roomMessage(client: Socket, payload: ChatMessage){
    this.logger.log(
      ActionTypes.sendRoomMsg + ' : '+ 'groupId : '+payload.roomId + ' msg : '+payload.msg
    )
    client.to(payload.roomId).broadcast.emit(ActionTypes.roomMsgBroadcast,payload.msg)
  }


  @SubscribeMessage(ActionTypes.leaveRoom)
  leaveRoom(client: Socket, roomId: string){
    try{
      this.logger.log(ActionTypes.leaveRoom + ' : '+roomId)
      client.leave(roomId);
      client.to(roomId).emit(ActionTypes.userLeftRoom);
    }catch(e){
      this.logger.error(ActionTypes.leaveRoom + ' : '+roomId)
      client.emit(ActionTypes.error,'couldnt perform requested action');
    }
  }

  @SubscribeMessage(ActionTypes.userIdle)
  usrIdl(clientSock: Socket){
    /*If use already in waiting list*/
    let index = this.waitingRoomList.findIndex(value => value.usrId == clientSock.id)
    if(index == -1) return;

  }

}
