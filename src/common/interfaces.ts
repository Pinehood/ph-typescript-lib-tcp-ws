import {
  ConnectionPool,
  Encryption,
  PacketHandlerRegistry,
  Queue,
} from "../services";

export interface Packet {
  opcode: number;
  payload: Buffer;
}

export interface Connection {
  id: string;
  send(packet: Packet): Promise<void> | void;
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
