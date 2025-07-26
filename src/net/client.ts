import net from "net";
import WebSocket from "ws";
import {
  BaseInstanceOptions,
  Client,
  Handler,
  InstanceEventHandlers,
  LoggerService,
  NetType,
  Packet,
  TcpNet,
  WsNet,
} from "../common";
import { Logger, Manager, PacketEncoder } from "../services";

export class NetClient implements Client {
  private tcp: TcpNet = {} as TcpNet;
  private ws: WsNet = {} as WsNet;
  private retryCount = 0;
  private reconnectDelay = 1000;
  public readonly mngr: Manager;
  public readonly logger: LoggerService;

  constructor(
    private readonly type: NetType,
    private readonly options: BaseInstanceOptions,
    logger?: LoggerService
  ) {
    this.mngr = new Manager();
    this.logger = logger ?? new Logger();
    if (this.type === "tcp") {
      this.tcp.socket = new net.Socket();
    } else if (this.type === "ws") {
      this.ws.socket = new WebSocket(
        `ws${this.options.secure ? "s" : ""}://${this.options.host}:${
          this.options.port
        }`
      );
    }
  }

  get format() {
    return this.options.format;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.type === "tcp" && this.tcp.socket) {
        this.tcp.socket.connect(this.options.port, this.options.host!, () => {
          this.retryCount = 0;
          this.tcp.connection = {
            id: `${this.options.host}:${this.options.port}`,
            format: this.options.format,
            send: (packet: Packet) => {
              this.send(packet);
            },
          };
          this.options.handlers?.onConnect?.(this.tcp.connection, this.logger);
          resolve();
        });
        this.tcp.socket.on("error", (err) => {
          this.options.handlers?.onError?.(
            this.tcp.connection!,
            err,
            this.logger
          );
          reject(err);
        });
        this.tcp.socket.setTimeout(this.options.timeout ?? 0);
      } else if (this.type === "ws" && this.ws.socket) {
        this.ws.socket.on("open", () => {
          this.retryCount = 0;
          this.ws.connection = {
            id: `${this.options.host}:${this.options.port}`,
            format: this.options.format,
            send: (packet: Packet) => {
              this.send(packet);
            },
          };
          this.options.handlers?.onConnect?.(this.ws.connection, this.logger);
          resolve();
        });
        this.ws.socket.on("error", (err) => reject(err));
        const sock = (this.ws.socket as any)._socket;
        sock.setTimeout(this.options.timeout ?? 0);
      }
    });
  }

  configure(): void {
    if (this.type === "tcp" && this.tcp.socket) {
      this.tcp.socket.on("error", (err) => {
        this.options.handlers?.onError?.(
          this.tcp.connection!,
          err,
          this.logger
        );
        this.reconnect();
      });
      this.tcp.socket.on("close", () => {
        this.options.handlers?.onClose?.(this.tcp.connection!, this.logger);
        this.reconnect();
      });
      this.tcp.socket.on("data", (dat) => this.handleData(dat));
    } else if (this.type === "ws" && this.ws.socket) {
      this.ws.socket.on("error", (err) => {
        this.options.handlers?.onError?.(this.ws.connection!, err, this.logger);
        this.reconnect();
      });
      this.ws.socket.on("close", () => {
        this.options.handlers?.onClose?.(this.ws.connection!, this.logger);
        this.reconnect();
      });
      this.ws.socket.on("message", (dat) => this.handleData(dat));
    }
  }

  disconnect(): void {
    try {
      if (this.type === "tcp" && this.tcp.socket) {
        this.tcp.socket.end();
        this.tcp.socket.destroy();
      } else if (this.type === "ws" && this.ws.socket) {
        this.ws.socket.close();
      }
    } finally {
    }
  }

  reconnect(): void {
    if (this.retryCount++ >= 5) {
      return;
    }
    setTimeout(() => this.connect(), this.reconnectDelay);
    this.reconnectDelay *= 2;
  }

  send(packet: Packet): void {
    const raw = PacketEncoder.encode(packet);
    const encrypted = this.options.encryption.encrypt(raw);
    if (this.type === "tcp" && this.tcp.socket) {
      this.tcp.socket.write(encrypted);
    } else if (this.type === "ws" && this.ws.socket) {
      this.ws.socket.send(encrypted);
    }
  }

  updateEventHandlers(handlers: Partial<InstanceEventHandlers>): void {
    this.options.handlers = {
      ...(this.options.handlers ?? {}),
      ...(handlers ?? {}),
    };
  }

  addPacketHandler(opcode: number, handler: Handler): void {
    this.options.registry.register(opcode, handler);
  }

  private handleData(data: Buffer | WebSocket.Data): void {
    const decrypted = this.options.encryption.decrypt(data as Buffer);
    const packet = PacketEncoder.decode(decrypted);
    if (packet) {
      if (this.type === "tcp" && this.tcp.connection) {
        this.options.registry.handle(this.tcp.connection, packet, this.logger);
      } else if (this.type === "ws" && this.ws.connection) {
        this.options.registry.handle(this.ws.connection, packet, this.logger);
      }
    }
  }
}
