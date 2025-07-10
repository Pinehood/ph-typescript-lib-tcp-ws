import { Connection, Packet } from "../common";

export class ConnectionPool {
  private readonly connections = new Map<string, Connection>();

  add(conn: Connection) {
    return this.connections.set(conn.id, conn);
  }

  remove(id: string) {
    return this.connections.delete(id);
  }

  get(id: string) {
    return this.connections.get(id);
  }

  broadcast(packet: Packet) {
    for (const conn of this.connections.values()) {
      conn.send(packet);
    }
  }

  list() {
    return [...this.connections.values()];
  }
}
