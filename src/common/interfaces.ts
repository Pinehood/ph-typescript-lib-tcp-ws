import { ConnectionPool, Encryption, PacketRegistry, Queue } from "../services";
import { NetFormat } from "./types";

export interface Packet {
  opcode: number;
  payload: Buffer;
}

export interface Connection {
  id: string;
  send(packet: Packet): Promise<void> | void;
  format: NetFormat;
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
  registry: PacketRegistry;
  encryption: Encryption;
  format: "json" | "bytes";
  secure?: boolean;
  handlers?: Partial<{
    onConnect: (connection: Connection, logger: LoggerService) => void;
    onError: (
      connection: Connection,
      error: unknown,
      logger: LoggerService
    ) => void;
    onClose: (connection: Connection, logger: LoggerService) => void;
  }>;
}

export interface ServerInstance<T> extends BaseInstanceOptions {
  pool: ConnectionPool;
  queue: Queue;
  server?: T | null;
}

export interface LoggerService {
  info(message: string, ...optionalParams: unknown[]): void;
  warn(message: string, ...optionalParams: unknown[]): void;
  error(message: string, ...optionalParams: unknown[]): void;
  debug(message: string, ...optionalParams: unknown[]): void;
}
