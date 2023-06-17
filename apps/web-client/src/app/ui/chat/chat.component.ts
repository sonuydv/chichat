import {
  AfterViewChecked,
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef, OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { ActionTypes } from '@realtime-form/data';
import { FormBuilder } from '@angular/forms';
import { ChatService } from 'apps/web-client/src/app/core/service/chat.service';
import { Router } from '@angular/router';
import { UserStatus } from 'libs/data/src/model/client.model';
import { ChatMessage } from 'libs/data/src/model/chat.model';

@Component({
  selector: 'realtime-form-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit,AfterViewInit, AfterViewChecked,OnDestroy{

  @ViewChild('msgHistoryContainer',{static: false}) private msgHistoryContainer: ElementRef

  clientStatus: UserStatus = UserStatus.waiting
  ClientStatus = UserStatus


  chatMessages: ChatModel[] = []
  clientMsg: string = ''

  roomId: string = ''


  constructor(
    private chatService: ChatService,
    private fb: FormBuilder,
    private router: Router,
    private cdf: ChangeDetectorRef
  ) {
  }

  ngOnInit() {

    if(!this.chatService.isAccepted){
     this.router.navigateByUrl('')
      return
    }

    setTimeout(()=>{
      this.chatService.initConnection()
    },1500)

    this.chatService.on('connect_error',()=>{
      this.clientStatus = this.ClientStatus.connect_error
    })

    this.chatService.on('disconnect',()=>{
      this.clientStatus = this.ClientStatus.disconnect
    })


    this.chatService.on('connect',()=>{
      this.chatMessages = []
      if(this.clientStatus == this.ClientStatus.connect_error ||
      this.clientStatus == this.ClientStatus.disconnect){
        this.clientStatus = this.ClientStatus.connected
      }
    })


    this.chatService.on(ActionTypes.joined, (roomId) => {
      this.chatMessages = []
      console.log('group id : '+roomId);

      this.clientStatus = UserStatus.chatting
      this.roomId = roomId

    })

    this.chatService.on(ActionTypes.roomMsgBroadcast, (msg)=>{
      if(msg){
        this.chatMessages.push(new ChatModel(UserLabel.stranger, msg))
        this.scrollToBottom()
      }
    })

    this.chatService.on(ActionTypes.userLeftRoom, ()=>{
      this.clientStatus = UserStatus.strangerLeft
    })


  }

  ngAfterViewInit() {

  }

  ngAfterViewChecked() {
    this.scrollToBottom()
  }

  ngOnDestroy() {
    this.chatService.disconnect()
  }


  public connectToStranger() {
    switch (this.clientStatus) {
      case UserStatus.idle:
        /*Send a request to connect to another*/
        this.clientStatus = UserStatus.waiting
        this.chatService.emit(ActionTypes.reJoinRoom)
        break;
      case UserStatus.waiting:
        /*block the request*/
        this.clientStatus = UserStatus.idle
        this.chatService.emit(ActionTypes.userIdle)
        break;
      case UserStatus.chatting:
        /*Stop the to idle status*/
        this.chatService.leaveRoom(this.roomId)
        this.clientStatus = UserStatus.idle
        break;
      default:
        this.chatService.emit(ActionTypes.reJoinRoom)
        this.clientStatus = UserStatus.waiting
        break;

    }
  }

  public sendMessage(){
    if(!this.clientMsg) return
    this.chatMessages.push(new ChatModel(UserLabel.me, this.clientMsg))
    this.chatService.emit(ActionTypes.sendRoomMsg,new ChatMessage(this.roomId,
      this.clientMsg))
    this.clientMsg = ''
  }


  private scrollToBottom(): void {
    if(!this.msgHistoryContainer) return
    this.msgHistoryContainer.nativeElement.scrollTop = this.msgHistoryContainer.nativeElement.scrollHeight;
    this.cdf.detectChanges()
  }

}


export class ChatModel {
  constructor(
    public usrLabel: UserLabel,
    public msg: string
  ) {
  }
}

export class MessageModel{
  constructor(
    public isError: boolean,
    public msg: string
  ) {
  }
}

export enum UserLabel {
  me = 'Me',
  stranger = 'Stranger'
}
