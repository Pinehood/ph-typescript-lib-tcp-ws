import { Connection, NetFormat, Packet } from "../../common";
import { PacketReader, PacketWriter } from "../packet";

export class Transformer {
  static writeData<T>(connection: Connection, opcode: number, data: T): void {
    return connection.send({
      opcode,
      payload: this.transformPacketPayloadForWrite(connection.format, data),
    });
  }

  static readData<T>(
    connection: Connection,
    packet: Packet,
    type?: new () => T
  ): T {
    const transformed = this.transformPacketPayloadForRead(
      connection.format,
      packet.payload
    );
    if (connection.format === "bytes") {
      const bytes = transformed as PacketReader;
      return bytes.read<T>(type!);
    }
    return transformed as T;
  }

  static transformPacketPayloadForRead<T>(
    format: NetFormat,
    payload: Buffer
  ): PacketReader | T {
    if (format === "bytes") {
      return new PacketReader(payload);
    }
    return JSON.parse(payload.toString()) as T;
  }

  static transformPacketPayloadForWrite<T>(
    format: NetFormat,
    payload: PacketWriter | Buffer | any
  ): Buffer {
    if (format === "bytes") {
      if (payload instanceof PacketWriter) {
        return Buffer.from(payload.write());
      }
      return Buffer.from(new PacketWriter(payload).write());
    }
    return Buffer.from(JSON.stringify(payload));
  }
}
