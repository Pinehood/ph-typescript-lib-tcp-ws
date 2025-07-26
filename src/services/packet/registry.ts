import * as fs from "fs";
import * as path from "path";
import {
  Connection,
  Handler,
  HandlerEntry,
  LoggerService,
  Packet,
  getRegisteredHandlers,
} from "../../common";

export class PacketRegistry {
  private handlers = new Map<number, HandlerEntry>();

  register(
    opcode: number,
    handler: Handler,
    payloadClass?: new () => any
  ): void {
    this.handlers.set(opcode, { opcode, handlerFn: handler, payloadClass });
  }

  async loadHandlersFrom(
    sources: string | Array<new () => any>
  ): Promise<void> {
    for (const source of sources) {
      if (typeof source === "string") {
        const absPath = path.resolve(source);
        const stat = fs.statSync(absPath);
        const files = stat.isDirectory()
          ? fs.readdirSync(absPath).map((f) => path.join(absPath, f))
          : [absPath];
        for (const file of files) {
          if (!file.endsWith(".ts") && !file.endsWith(".js")) continue;
          await import(file);
        }
      } else if (typeof source === "function") {
        const instance = new source();
        for (const {
          opcode,
          methodName,
          targetClass,
        } of getRegisteredHandlers()) {
          if (targetClass === source) {
            const handlerFn: Handler = instance[methodName].bind(instance);
            const payloadClass = instance.constructor?.payloadClass;
            this.register(opcode, handlerFn, payloadClass);
          }
        }
      }
    }
    for (const { opcode, methodName, targetClass } of getRegisteredHandlers()) {
      if (!this.handlers.has(opcode)) {
        const instance = new targetClass();
        const handlerFn: Handler = instance[methodName].bind(instance);
        const payloadClass = instance.constructor?.payloadClass;
        this.register(opcode, handlerFn, payloadClass);
      }
    }
  }

  handle(
    conn: Connection,
    packet: Packet,
    logger: LoggerService
  ): void | Promise<void> {
    const entry = this.handlers.get(packet.opcode);
    if (!entry) throw new Error(`No handler for opcode ${packet.opcode}`);
    return entry.handlerFn(conn, packet, logger);
  }
}
