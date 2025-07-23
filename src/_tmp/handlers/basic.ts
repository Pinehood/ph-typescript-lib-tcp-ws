import {
  Connection,
  Packet,
  transformPacketPayloadForRead,
  transformPacketPayloadForWrite,
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
    conn.send({
      opcode: 0x02,
      payload: transformPacketPayloadForWrite(conn.format, new Position(1, 2)),
    });
  }

  @PacketHandler(0x02)
  test2(conn: Connection, packet: Packet) {
    const transformed = transformPacketPayloadForRead(
      "bytes",
      packet.payload
    ) as PacketReader;
    const readPos = transformed.read<Position>(Position);
    console.log("Basic packet 2: ", readPos.x, readPos.y);
    conn.send({
      opcode: 0x01,
      payload: transformPacketPayloadForWrite(conn.format, new Position(2, 1)),
    });
  }
}

export default BasicHandlers;
