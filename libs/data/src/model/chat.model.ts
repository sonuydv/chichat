/**Client Message Model*/
export class ChatMessage{
  constructor(
    public roomId: string,
    public msg: string
  ) {
  }
}
