import {
  ConnectionPool,
  Encryption,
  PacketHandlerRegistry,
  Queue,
} from "../services";
import { BasicType } from "./types";

export interface Packet {
  opcode: number;
  payload: Buffer;
}

export interface Connection {
  id: string;
  send(packet: Packet): Promise<void> | void;
  format: "json" | "bytes";
  metadata?: any;
}

export interface Client {
  connect(): Promise<void> | void;
  configure(): Promise<void> | void;
  disconnect(): Promise<void> | void;
  reconnect(): Promise<void> | void;
  send(packet: Packet): Promise<void> | void;
}

export interface Server {
  start(): Promise<void> | void;
  stop(): Promise<void> | void;
}

export interface BaseInstanceOptions {
  host?: string;
  port: number;
  registry: PacketHandlerRegistry;
  encryption: Encryption;
  format: "json" | "bytes";
  secure?: boolean;
  handlers?: Partial<{
    onConnect: (connection: Connection) => void;
    onError: (connection: Connection, error: unknown) => void;
    onClose: (connection: Connection) => void;
  }>;
}

export interface ServerInstance<T> extends BaseInstanceOptions {
  pool: ConnectionPool;
  queue: Queue;
  server?: T | null;
}

export interface FieldMetadata {
  key: string;
  type: BasicType;
  structType?: any;
  enumMap?: any;
  arrayLength?: number;
}
