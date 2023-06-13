import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ChatService } from 'apps/web-client/src/app/core/service/chat.service';

@Component({
  selector: 'realtime-form-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  isAccepted: boolean = false

  constructor(
    private router: Router,
    private chatService: ChatService
  ) { }

  ngOnInit() {
  }

  onStartChat(){
    this.chatService.isAccepted = true
    this.router.navigateByUrl('chat')
  }


}
