import net from "net";
import WebSocket from "ws";
import {
  BaseInstanceOptions,
  Client,
  Connection,
  NetType,
  Packet,
} from "../common";
import { Manager, PacketUtils } from "../services";

export class NetClient implements Client {
  private tcpSocket?: net.Socket;
  private wsSocket?: WebSocket;
  private tcpConnection?: Connection;
  private wsConnection?: Connection;
  private retryCount = 0;
  private reconnectDelay = 1000;
  public readonly manager: Manager;

  constructor(
    private readonly type: NetType,
    private readonly options: BaseInstanceOptions
  ) {
    this.manager = new Manager();
    if (this.type === "tcp") {
      this.tcpSocket = new net.Socket();
    } else if (this.type === "ws") {
      this.wsSocket = new WebSocket(
        `ws${this.options.secure ? "s" : ""}://${this.options.host}:${
          this.options.port
        }`
      );
    }
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.type === "tcp" && this.tcpSocket) {
        this.tcpSocket.connect(this.options.port, this.options.host!, () => {
          this.retryCount = 0;
          this.tcpConnection = {
            id: `${this.options.host}:${this.options.port}`,
            format: this.options.format,
            send: (packet: Packet) => {
              this.send(packet);
            },
          };
          this.options.handlers?.onConnect?.(this.tcpConnection);
          resolve();
        });
        this.tcpSocket.on("error", (err) => {
          this.options.handlers?.onError?.(this.tcpConnection!, err);
          reject(err);
        });
      } else if (this.type === "ws" && this.wsSocket) {
        this.wsSocket.on("open", () => {
          this.retryCount = 0;
          this.wsConnection = {
            id: `${this.options.host}:${this.options.port}`,
            format: this.options.format,
            send: (packet: Packet) => {
              this.send(packet);
            },
          };
          this.options.handlers?.onConnect?.(this.wsConnection);
          resolve();
        });
        this.wsSocket.on("error", (err) => reject(err));
      }
    });
  }

  configure() {
    if (this.type === "tcp" && this.tcpSocket) {
      this.tcpSocket.on("error", (err) => {
        this.options.handlers?.onError?.(this.tcpConnection!, err);
        this.reconnect();
      });
      this.tcpSocket.on("close", () => {
        this.options.handlers?.onClose?.(this.tcpConnection!);
        this.reconnect();
      });
      this.tcpSocket.on("data", (dat) => this.handleData(dat));
    } else if (this.type === "ws" && this.wsSocket) {
      this.wsSocket.on("error", (err) => {
        this.options.handlers?.onError?.(this.wsConnection!, err);
        this.reconnect();
      });
      this.wsSocket.on("close", () => {
        this.options.handlers?.onClose?.(this.wsConnection!);
        this.reconnect();
      });
      this.wsSocket.on("message", (dat) => this.handleData(dat));
    }
  }

  disconnect() {
    try {
      if (this.type === "tcp" && this.tcpSocket) {
        this.tcpSocket.end();
        this.tcpSocket.destroy();
      } else if (this.type === "ws" && this.wsSocket) {
        this.wsSocket.close();
      }
    } finally {
    }
  }

  reconnect() {
    if (this.retryCount++ >= 5) {
      return;
    }
    setTimeout(() => this.connect(), this.reconnectDelay);
    this.reconnectDelay *= 2;
  }

  send(packet: Packet) {
    const raw = PacketUtils.encode(packet);
    const encrypted = this.options.encryption.encrypt(raw);
    if (this.type === "tcp" && this.tcpSocket) {
      this.tcpSocket.write(encrypted);
    } else if (this.type === "ws" && this.wsSocket) {
      this.wsSocket.send(encrypted);
    }
  }

  private handleData(data: Buffer | WebSocket.Data) {
    const decrypted = this.options.encryption.decrypt(data as Buffer);
    const packet = PacketUtils.decode(decrypted);
    if (packet) {
      if (this.type === "tcp" && this.tcpConnection) {
        this.options.registry.handle(this.tcpConnection, packet);
      } else if (this.type === "ws" && this.wsConnection) {
        this.options.registry.handle(this.wsConnection, packet);
      }
    }
  }
}
