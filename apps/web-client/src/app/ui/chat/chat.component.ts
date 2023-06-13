import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, merge } from 'rxjs';
import { Action, ClientConnected, Data, Init, ValuePatched } from 'apps/web-client/src/app/core/actions';
import { map, scan } from 'rxjs/operators';
import { reducer, State } from 'apps/web-client/src/app/core/state';
import { ActionTypes, FormData } from '@realtime-form/data';
import { Socket } from 'ngx-socket-io';
import { FormBuilder } from '@angular/forms';
import { getFormChangesEffect, getPatchValueEffect, getValuePatchedEffect } from 'apps/web-client/src/app/core/effects';

@Component({
  selector: 'realtime-form-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit {

  private dispatcher = new BehaviorSubject<Action>(new Init());
  actions$ = this.dispatcher.asObservable();
  store$ = this.actions$.pipe(
    scan((state: State, action: Action) => reducer(state, action))
  );
  connectedClients$ = this.store$.pipe(
    map((state: State) => state.connectedClients)
  );
  data$ = this.store$.pipe(map((state: State) => state.data));
  title$ = this.data$.pipe(map((state: Partial<FormData>) => state.title));
  description$ = this.data$.pipe(
    map((state: Partial<FormData>) => state.description)
  );
  form = this.fb.group({
    title: [''],
    description: ['']
  });

  constructor(private socket: Socket, private fb: FormBuilder) {}

  ngOnInit() {
    this.socket.on(ActionTypes.ClientConnected, (payload: string[]) => {
      this.dispatcher.next(new ClientConnected(payload));
    });

    this.socket.on(ActionTypes.Data, (payload: Partial<FormData>) => {
      this.dispatcher.next(new Data(payload));
      console.log('');

    });

    this.socket.on(ActionTypes.ValuePatched, (payload: Partial<FormData>) => {
      this.dispatcher.next(new ValuePatched(payload));
    });

    merge(
      getPatchValueEffect(this.socket, this.actions$),
      getValuePatchedEffect(this.form, this.actions$),
      getFormChangesEffect(this.form, this.dispatcher)
    ).subscribe();
  }


}
