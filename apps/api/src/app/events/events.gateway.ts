import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

import { ActionTypes, FormData } from '@realtime-form/data';
import { UserModel } from 'apps/api/src/app/model/user.model';
import { UserStatus } from 'libs/data/src/model/client.model';
import { ChatServiceServer } from 'apps/api/src/app/service/chat-service.server';
import { ChatMessage } from 'libs/data/src/model/chat.model';
import { ChatRoom } from 'apps/api/src/app/model/chats.model';

@WebSocketGateway()
export class EventsGateway {
  // waitingRoomList : UserModel[] = [];
  connectedClientList : string[] = [];
  // chatRoomList: Map<string, string> = new Map<string, string>()
  chatRoomList: ChatRoom[] = []
  data = {};
  @WebSocketServer()
  server: Server;
  private logger: Logger = new Logger('EventsGateway');

  waitingToJoin: string = null

  constructor(
    private chatService: ChatServiceServer
  ) {
  }

  handleConnection(client: Socket) {
    this.connectedClientList.push(client.id)
    this.logger.log(
      `Client connected: ${client.id} - ${this.connectedClientList.length} connected clients.`
    );

    this.connectToStranger(client)
    /*Notify all the clients*/
    // this.server.emit(ActionTypes.ClientConnected, this.waitingRoomList);

    /*Notify the current client*/
    // client.emit(ActionTypes.Data, this.data);
  }

  handleDisconnect(clientSock: Socket) {
    this.connectedClientList = this.connectedClientList.filter(
      connectedClient => connectedClient !== clientSock.id
    );

    if(this.waitingToJoin == clientSock.id)
      this.waitingToJoin  = null

    this.leaveRoomAndNotify(clientSock)

    this.logger.log(
      `Client disconnected: ${clientSock.id} - ${this.connectedClientList.length} connected clients.`
    );
    // this.server.emit(ActionTypes.ClientConnected, this.waitingRoomList);
  }

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
    if(!this.waitingToJoin){
      /*add the current use to the waiting list*/
      this.waitingToJoin = clientSock.id
      // this.waitingRoomList.push(new UserModel(clientSock.id, UserStatus.waiting))
      this.logger.log('Server : Room init roomId : '+clientSock.id)
      return
    }else{
      /*If use already in waiting list*/
      if(this.waitingToJoin == clientSock.id) return;
      /*Get the first user from waiting list to create room*/
      let newRoomId = this.waitingToJoin
      /*and Remove the user from waiting list*/
       this.waitingToJoin = null
      /*Send requested client he has joined a group/client*/
      clientSock.emit(ActionTypes.joined,newRoomId)
      /*Now notify the waiting list client the same*/
      clientSock.to(newRoomId).emit(ActionTypes.joined,newRoomId)
      /*Create room with waiting list client*/
      this.logger.log('Server : Room joined roomId : '+newRoomId)
      /*Create new room and push with both the members in roomList*/
      let newRoom = new ChatRoom(newRoomId,[newRoomId,clientSock.id])
      this.chatRoomList.push(newRoom)
      clientSock.join(newRoomId)
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
      /*Remove corresponding room*/
      this.chatRoomList = this.chatRoomList.filter(room => room.roomId != roomId)
      client.to(roomId).emit(ActionTypes.userLeftRoom);
    }catch(e){
      this.logger.error(ActionTypes.leaveRoom + ' : '+roomId)
      client.emit(ActionTypes.error,'couldnt perform requested action');
    }
  }

  @SubscribeMessage(ActionTypes.userIdle)
  usrIdl(clientSock: Socket){
    this.logger.log(ActionTypes.userIdle + ' : '+clientSock.id)
    /*If use already in waiting list*/
    if(this.waitingToJoin == clientSock.id)
      this.waitingToJoin = null
  }

  private leaveRoomAndNotify(clientSock: Socket){
    let roomToNotify: string = ''
    this.chatRoomList = this.chatRoomList.filter(room => {
      let isKeep = true
      for(let userId of room.users){
        if(userId == clientSock.id)
          isKeep = false
        else
          roomToNotify = userId
      }
      return isKeep
    })
    if(roomToNotify)
      clientSock.to(roomToNotify).emit(ActionTypes.userLeftRoom);

  }

}
