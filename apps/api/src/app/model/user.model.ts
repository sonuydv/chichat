import { UserStatus } from 'libs/data/src/model/client.model';

export class UserModel{
  constructor(
    public usrId: string,
    public status: UserStatus,
    public queueIndex: number = 0,
    public groupId: string = ''
  ) {
  }
}
