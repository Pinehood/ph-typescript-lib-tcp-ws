import { Field } from "../common";

export enum PacketOpcodes {
  INITIAL = 0x01,
  INITIAL_RESPONSE = 0x02,
  INITIAL_RETRIGGER = 0x03,
  FROM_UPDATE_LOOP = 0x04,
}

export class Position {
  @Field("float32")
  public x: number;

  @Field("float32")
  public y: number;

  constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
  }
}

export class Message {
  @Field("string")
  public content: string;

  constructor(content: string = "") {
    this.content = content;
  }
}
