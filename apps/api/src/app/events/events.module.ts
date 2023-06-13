import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { ChatServiceServer } from 'apps/api/src/app/service/chat-service.server';

@Module({
  providers: [EventsGateway,ChatServiceServer]
})
export class EventsModule {}
