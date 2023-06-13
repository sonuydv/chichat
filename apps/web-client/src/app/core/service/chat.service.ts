import { Injectable } from '@angular/core';
import { environment } from 'apps/web-client/src/environments/environment';
import { Socket } from 'ngx-socket-io';
import { ActionTypes } from '@realtime-form/data';

@Injectable()
export class ChatService extends Socket{

  isAccepted: boolean = false

  constructor() {
    super({url: environment.SOCKET_ENDPOINT, options : { autoConnect: false}})
  }


  initConnection(){
    this.connect()
  }




  leaveRoom(roomId: string){
    this.emit(ActionTypes.leaveRoom,roomId)
  }


}
