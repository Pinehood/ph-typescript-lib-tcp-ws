import { getRegisteredHandlers } from "../common/decorators";
import * as fs from "fs";
import * as path from "path";
import { Connection } from "../common/interfaces";
import { Handler, HandlerEntry } from "../common/types";

export class PacketHandlerRegistry {
  private handlers = new Map<number, HandlerEntry>();

  register(opcode: number, handler: Handler, payloadClass?: new () => any) {
    this.handlers.set(opcode, { opcode, handlerFn: handler, payloadClass });
  }

  async loadHandlersFrom(paths: string[]) {
    for (const p of paths) {
      const absPath = path.resolve(p);
      const stat = fs.statSync(absPath);
      const files = stat.isDirectory()
        ? fs.readdirSync(absPath).map((f) => path.join(absPath, f))
        : [absPath];
      for (const file of files) {
        if (!file.endsWith(".ts") && !file.endsWith(".js")) continue;
        await import(file);
      }
    }

    for (const { opcode, methodName, targetClass } of getRegisteredHandlers()) {
      const instance = new targetClass();
      const handlerFn: Handler = instance[methodName].bind(instance);
      const payloadClass = instance.constructor?.payloadClass;
      this.register(opcode, handlerFn, payloadClass);
    }
  }

  handle(conn: Connection, packet: { opcode: number; payload: any }) {
    const entry = this.handlers.get(packet.opcode);
    if (!entry) throw new Error(`No handler for opcode ${packet.opcode}`);
    return entry.handlerFn(conn, packet.payload);
  }

  getPayloadClass(opcode: number) {
    return this.handlers.get(opcode)?.payloadClass;
  }
}
