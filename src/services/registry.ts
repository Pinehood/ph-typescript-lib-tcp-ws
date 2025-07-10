import { Handler, Connection, Packet } from "../common";

export class PacketHandlerRegistry {
  private readonly handlers = new Map<number, Handler>();

  register(opcode: number, handler: Handler) {
    this.handlers.set(opcode, handler);
  }

  handle(conn: Connection, packet: Packet) {
    if (this.handlers.has(packet.opcode)) {
      const handler = this.handlers.get(packet.opcode);
      handler!(conn, packet);
    }
  }
}
