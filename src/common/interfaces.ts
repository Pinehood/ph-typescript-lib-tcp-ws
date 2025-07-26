import { ConnectionPool, Encryption, PacketRegistry, Queue } from "../services";
import { Handler, NetFormat } from "./types";

export interface Packet {
  opcode: number;
  payload: Buffer;
}

export interface Connection {
  id: string;
  send(packet: Packet): void;
  format: NetFormat;
  metadata?: any;
}

export interface Client {
  get format(): NetFormat;
  connect(): void;
  configure(): void;
  disconnect(): void;
  reconnect(): void;
  send(packet: Packet): void;
  updateEventHandlers(handlers: Partial<InstanceEventHandlers>): void;
  addPacketHandler(opcode: number, handler: Handler): void;
}

export interface Server {
  get format(): NetFormat;
  start(): void;
  stop(): void;
  sendTo(conn: "all" | Connection | Array<Connection>, packet: Packet): void;
  updateEventHandlers(handlers: Partial<InstanceEventHandlers>): void;
  addPacketHandler(opcode: number, handler: Handler): void;
}

export interface InstanceEventHandlers {
  onConnect: (connection: Connection, logger: LoggerService) => void;
  onError: (
    connection: Connection,
    error: unknown,
    logger: LoggerService
  ) => void;
  onClose: (connection: Connection, logger: LoggerService) => void;
}

export interface BaseInstanceOptions {
  host?: string;
  port: number;
  registry: PacketRegistry;
  encryption: Encryption;
  format: "json" | "bytes";
  secure?: boolean;
  handlers?: Partial<InstanceEventHandlers>;
  timeout?: number;
}

export interface ServerInstance<T> extends BaseInstanceOptions {
  pool: ConnectionPool;
  queue: Queue;
  server?: T | null;
}

export interface LoggerService {
  info(message: string, ...optionalParams: Array<unknown>): void;
  warn(message: string, ...optionalParams: Array<unknown>): void;
  error(message: string, ...optionalParams: Array<unknown>): void;
  debug(message: string, ...optionalParams: Array<unknown>): void;
}
