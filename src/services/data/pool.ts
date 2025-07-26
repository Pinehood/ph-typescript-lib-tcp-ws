import { Connection, Packet } from "../../common";

export class ConnectionPool {
  private readonly connections = new Map<string, Connection>();

  add(conn: Connection): Map<string, Connection> {
    return this.connections.set(conn.id, conn);
  }

  remove(id: string): boolean {
    return this.connections.delete(id);
  }

  get(id: string): Connection | undefined {
    return this.connections.get(id);
  }

  broadcast(packet: Packet): void {
    for (const conn of this.connections.values()) {
      conn.send(packet);
    }
  }

  list(): Connection[] {
    return [...this.connections.values()];
  }
}
