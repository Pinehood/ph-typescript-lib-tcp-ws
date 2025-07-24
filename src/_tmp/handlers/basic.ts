import {
  Connection,
  Packet,
  readData,
  transformPacketPayloadForRead,
  transformPacketPayloadForWrite,
  writeData,
} from "../../common";
import { PacketReader, PacketWriter } from "../../services";
import { Field, PacketHandler } from "../../common/decorators";

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
    writeData(conn, 0x02, new Position(1, 2));
  }

  @PacketHandler(0x02)
  test2(conn: Connection, packet: Packet) {
    const transformed = transformPacketPayloadForRead(
      "bytes",
      packet.payload
    ) as PacketReader;
    const readPos = readData<Position>(conn, packet, Position);
    console.log("Basic packet 2: ", readPos.x, readPos.y);
    writeData(conn, 0x01, new Position(2, 1));
  }
}

export default BasicHandlers;
