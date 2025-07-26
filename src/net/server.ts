import net from "net";
import WebSocket from "ws";
import {
  BaseInstanceOptions,
  Connection,
  Handler,
  InstanceEventHandlers,
  LoggerService,
  NetType,
  Packet,
  Server,
  ServerInstance,
} from "../common";
import {
  ConnectionPool,
  Manager,
  PacketEncoder,
  Queue,
  Logger,
  Calculator,
} from "../services";

export class NetServer implements Server {
  private tcp?: ServerInstance<net.Server>;
  private ws?: ServerInstance<WebSocket.Server>;
  public readonly mngr: Manager;
  public readonly logger: LoggerService;

  constructor(
    private readonly type: NetType,
    private readonly options: BaseInstanceOptions,
    logger?: LoggerService
  ) {
    const pool = new ConnectionPool();
    const queue = new Queue();
    this.mngr = new Manager();
    this.logger = logger ?? new Logger();
    if (this.type === "tcp") {
      this.tcp = {
        ...options,
        pool,
        queue,
      };
    } else if (this.type === "ws") {
      this.ws = {
        ...options,
        pool,
        queue,
      };
    }
  }

  get format() {
    return this.options.format;
  }

  start(): void {
    if (this.type === "tcp" && this.tcp) {
      this.tcp.server = net.createServer((socket) => {
        socket.setTimeout(this.options.timeout ?? 0);
        const id = Calculator.calculateNewId();
        const conn: Connection = {
          id,
          format: this.options.format,
          send: (packet) => this.handleSendTcp(socket, packet),
        };
        this.tcp?.pool.add(conn);
        this.tcp?.handlers?.onConnect?.(conn, this.logger);
        let buffer = Buffer.alloc(0);
        socket.on("data", (dat) => this.handleReceiveTcp(buffer, dat, conn));
        socket.on("close", () => {
          this.tcp?.pool.remove(id);
          this.tcp?.handlers?.onClose?.(conn, this.logger);
        });
        socket.on("error", (err) => {
          this.tcp?.pool.remove(id);
          this.tcp?.handlers?.onError?.(conn, err, this.logger);
        });
      });
      this.tcp.server.listen(this.tcp.port);
    } else if (this.type === "ws" && this.ws) {
      this.ws.server = new WebSocket.Server({
        port: this.ws.port,
      });
      this.ws.server.on("connection", (socket) => {
        const sock = (socket as any)._socket;
        sock.setTimeout(this.options.timeout ?? 0);
        const id = Calculator.calculateNewId();
        const conn: Connection = {
          id,
          format: this.options.format,
          send: (packet: Packet) => this.handleSendWs(socket, packet),
        };
        this.ws?.pool.add(conn);
        this.ws?.handlers?.onClose?.(conn, this.logger);
        socket.on("message", (dat) => this.handleReceiveWs(dat, conn));
        socket.on("close", () => {
          this.ws?.pool.remove(id);
          this.ws?.handlers?.onClose?.(conn, this.logger);
        });
        socket.on("error", (err) => {
          this.ws?.pool.remove(id);
          this.ws?.handlers?.onError?.(conn, err, this.logger);
        });
      });
    }
  }

  stop(): void {
    if (this.type === "tcp" && this.tcp) {
      this.tcp.server?.close();
      this.tcp.server = null;
    } else if (this.type === "ws" && this.ws) {
      this.ws.server?.close();
      this.ws.server = null;
    }
  }

  sendTo(conn: "all" | Connection | Array<Connection>, packet: Packet): void {
    if (conn === "all") {
      this.tcp?.pool.broadcast(packet);
    } else if (Array.isArray(conn) && conn.length) {
      conn.forEach((c) => (!!c ? c.send(packet) : () => null));
    } else if (!Array.isArray(conn) && typeof conn === "object") {
      conn.send(packet);
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

  private handleSendTcp = (socket: net.Socket, packet: Packet): void => {
    const encoded = PacketEncoder.encode(packet);
    const encrypted = this.tcp!.encryption.encrypt(encoded);
    this.tcp!.queue.add(() => socket.write(encrypted));
  };

  private handleSendWs(socket: WebSocket, packet: Packet): void {
    const encoded = PacketEncoder.encode(packet);
    const encrypted = this.ws!.encryption.encrypt(encoded);
    this.ws!.queue.add(() => socket.send(encrypted));
  }

  private handleReceiveTcp = (
    buffer: Buffer,
    data: Buffer,
    conn: Connection
  ): void => {
    buffer = Buffer.concat([buffer, data]);
    const decrypted = this.tcp!.encryption.decrypt(buffer);
    const packet = PacketEncoder.decode(decrypted);
    if (packet && this.tcp) {
      this.tcp.queue.add(() =>
        this.tcp!.registry.handle(conn, packet, this.logger)
      );
      buffer = Buffer.alloc(0);
    }
  };

  private handleReceiveWs(data: WebSocket.Data, conn: Connection): void {
    const decrypted = this.ws!.encryption.decrypt(Buffer.from(data as Buffer));
    const packet = PacketEncoder.decode(decrypted);
    if (packet && this.ws) {
      this.ws.queue.add(() =>
        this.ws!.registry.handle(conn, packet, this.logger)
      );
    }
  }
}
