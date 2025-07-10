import { Connection, Packet } from "./interfaces";

export type Handler = (
  conn: Connection,
  packet: Packet
) => Promise<void> | void;

export type NetType = "tcp" | "ws";

export type Task<T> = {
  fn: () => T | Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: any) => void;
  priority: number;
  timeout?: number;
};
