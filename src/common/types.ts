import { Connection, Packet } from "./interfaces";

export type Handler = (
  conn: Connection,
  packet: Packet
) => Promise<void> | void;

export type HandlerEntry = {
  opcode: number;
  handlerFn: Handler;
  payloadClass?: new () => any;
};

export type NetType = "tcp" | "ws";

export type Task<T> = {
  fn: () => T | Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: any) => void;
  priority: number;
  timeout?: number;
};

export type BasicType =
  | "uint8"
  | "uint16"
  | "uint32"
  | "int32"
  | "float32"
  | "float64"
  | "bool"
  | "string"
  | "enum"
  | "struct"
  | "array";

export type HandlerMeta = {
  opcode: number;
  methodName: string;
  targetClass: any;
};
