import { Connection, Field, PacketHandler, Packet } from "../../common";
import { Transformer } from "../../services";

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

class BasicHandlers {
  @PacketHandler(0x01)
  test1(conn: Connection, packet: Packet) {
    console.log("Basic packet 1");
    Transformer.writeData(conn, 0x02, new Position(1, 2));
  }

  @PacketHandler(0x02)
  test2(conn: Connection, packet: Packet) {
    const readPos = Transformer.readData<Position>(conn, packet, Position);
    console.log("Basic packet 2: ", readPos.x, readPos.y);
    Transformer.writeData(conn, 0x01, new Position(2, 1));
  }
}

export default BasicHandlers;
