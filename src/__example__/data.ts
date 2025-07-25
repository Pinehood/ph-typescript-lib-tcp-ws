import { Field } from "../common";

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
