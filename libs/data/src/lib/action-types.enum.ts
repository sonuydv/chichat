
/**Action which are used by both server and client to
 * exchange information via message passing
 * */
export enum ActionTypes {
  Data = '[Socket] Data',
  ClientConnected = '[Socket] Client Connected',
  ValuePatched = '[Socket] Value Patched',
  // PatchValue = '[Form] Patch Value',
  // Init = '[Init] Init',


  joined = '[Joined] new Room',
  sendRoomMsg = '[SendRoomMsg] room message',
  roomMsgBroadcast = '[RoomMsg] room message broadcast',
  leaveRoom = '[LeaveRoom] client request to leave room',
  userLeftRoom = '[UserLeftRoom] user left the room',
  error = "[Error], couldn't perform request action",

  reJoinRoom = '[ReJoinRoomRequest] re-join room request',
  userIdle = '[UserIdle] stop search request '

}
