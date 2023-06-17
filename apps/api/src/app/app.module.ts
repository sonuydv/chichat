import { Module } from '@nestjs/common';
import { EventsModule } from './events/events.module';

/**Server MOdule*/
@Module({
  imports: [EventsModule]
})
export class AppModule {}
