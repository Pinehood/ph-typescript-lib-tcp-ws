import { Packet } from "../../common";

export class PacketEncoder {
  static encode(packet: Packet): Buffer {
    const header = Buffer.alloc(6);
    header.writeUInt16BE(packet.opcode, 0);
    header.writeUInt32BE(packet.payload.length, 2);
    return Buffer.concat([header, packet.payload]);
  }

  static decode(buffer: Buffer): Packet | null {
    if (buffer.length < 6) {
      return null;
    }
    const opcode = buffer.readUInt16BE(0);
    const length = buffer.readUInt32BE(2);
    if (buffer.length < 6 + length) {
      return null;
    }
    const payload = buffer.subarray(6, 6 + length);
    return { opcode, payload } as Packet;
  }
}
