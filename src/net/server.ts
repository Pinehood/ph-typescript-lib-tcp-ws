import net from "net";
import WebSocket from "ws";
import { v4 as uuidv4 } from "uuid";
import {
  BaseInstanceOptions,
  Connection,
  NetType,
  Packet,
  Server,
  ServerInstance,
} from "../common";
import { ConnectionPool, Manager, PacketUtils, Queue } from "../services";

export class NetServer implements Server {
  private tcpInstance?: ServerInstance<net.Server>;
  private wsInstance?: ServerInstance<WebSocket.Server>;
  public readonly manager: Manager;

  constructor(private readonly type: NetType, options: BaseInstanceOptions) {
    const pool = new ConnectionPool();
    const queue = new Queue();
    this.manager = new Manager();
    if (this.type === "tcp") {
      this.tcpInstance = {
        ...options,
        pool,
        queue,
      };
    } else if (this.type === "ws") {
      this.wsInstance = {
        ...options,
        pool,
        queue,
      };
    }
  }

  start() {
    if (this.type === "tcp" && this.tcpInstance) {
      this.tcpInstance.server = net.createServer((socket) => {
        const id = uuidv4();
        const conn: Connection = {
          id,
          format: this.tcpInstance?.format ?? "json",
          send: (packet) => this.handleSendTcp(socket, packet),
        };
        this.tcpInstance?.pool.add(conn);
        this.tcpInstance?.handlers?.onConnect?.(conn);
        let buffer = Buffer.alloc(0);
        socket.on("data", (dat) => this.handleReceiveTcp(buffer, dat, conn));
        socket.on("close", () => {
          this.tcpInstance?.pool.remove(id);
          this.tcpInstance?.handlers?.onClose?.(conn);
        });
        socket.on("error", (err) => {
          this.tcpInstance?.pool.remove(id);
          this.tcpInstance?.handlers?.onError?.(conn, err);
        });
      });
      this.tcpInstance.server.listen(this.tcpInstance.port);
    } else if (this.type === "ws" && this.wsInstance) {
      this.wsInstance.server = new WebSocket.Server({
        port: this.wsInstance.port,
      });
      this.wsInstance.server.on("connection", (socket) => {
        const id = uuidv4();
        const conn: Connection = {
          id,
          format: this.wsInstance?.format ?? "json",
          send: (packet: Packet) => this.handleSendWs(socket, packet),
        };
        this.wsInstance?.pool.add(conn);
        this.wsInstance?.handlers?.onClose?.(conn);
        socket.on("message", (dat) => this.handleReceiveWs(dat, conn));
        socket.on("close", () => {
          this.wsInstance?.pool.remove(id);
          this.wsInstance?.handlers?.onClose?.(conn);
        });
        socket.on("error", (err) => {
          this.wsInstance?.pool.remove(id);
          this.wsInstance?.handlers?.onError?.(conn, err);
        });
      });
    }
  }

  stop() {
    if (this.type === "tcp" && this.tcpInstance) {
      this.tcpInstance.server?.close();
      this.tcpInstance.server = null;
    } else if (this.type === "ws" && this.wsInstance) {
      this.wsInstance.server?.close();
      this.wsInstance.server = null;
    }
  }

  private handleSendTcp = (socket: net.Socket, packet: Packet) => {
    const encoded = PacketUtils.encode(packet);
    const encrypted = this.tcpInstance!.encryption.encrypt(encoded);
    this.tcpInstance!.queue.add(() => socket.write(encrypted));
  };

  private handleSendWs(socket: WebSocket, packet: Packet) {
    const encoded = PacketUtils.encode(packet);
    const encrypted = this.wsInstance!.encryption.encrypt(encoded);
    this.wsInstance!.queue.add(() => socket.send(encrypted));
  }

  private handleReceiveTcp = (
    buffer: Buffer,
    data: Buffer,
    conn: Connection
  ) => {
    buffer = Buffer.concat([buffer, data]);
    const decrypted = this.tcpInstance!.encryption.decrypt(buffer);
    const packet = PacketUtils.decode(decrypted);
    if (packet && this.tcpInstance) {
      this.tcpInstance.queue.add(() =>
        this.tcpInstance!.registry.handle(conn, packet)
      );
      buffer = Buffer.alloc(0);
    }
  };

  private handleReceiveWs(data: WebSocket.Data, conn: Connection) {
    const decrypted = this.wsInstance!.encryption.decrypt(
      Buffer.from(data as Buffer)
    );
    const packet = PacketUtils.decode(decrypted);
    if (packet && this.wsInstance) {
      this.wsInstance.queue.add(() =>
        this.wsInstance!.registry.handle(conn, packet)
      );
    }
  }
}
