import { NetServer } from "../net";
import { PacketHandlerRegistry, Encryption, Loop } from "../services";

const registry = new PacketHandlerRegistry();
const encryption = new Encryption(
  Buffer.from("12345678901234567890123456789012", "utf-8"),
  Buffer.from("1234567890123456", "utf-8")
);

registry.register(0x01, (conn, packet) => {
  console.log(`Received packet with opcode 0x01 from connection ${conn.id}`);
  const json = packet.payload.toString();
  console.log(`Payload: ${json}`);
  conn.send({
    opcode: 0x02,
    payload: Buffer.from(JSON.stringify({ message: "Hello, client!" })),
  });
});

const tcpServer = new NetServer("tcp", {
  port: 9000,
  registry,
  encryption,
  handlers: {
    onConnect(connection) {
      console.log("TCP Connected", connection.id);
    },
    onError(connection, error) {
      console.error("TCP Error", connection.id, error);
    },
  },
});
tcpServer.manager.addUpdateLoop(new Loop(() => console.log("Hi TCP!")));
tcpServer.start();
tcpServer.manager.startUpdateLoops();

const wsServer = new NetServer("ws", {
  port: 9001,
  registry,
  encryption,
  handlers: {
    onConnect(connection) {
      console.log("WS Connected", connection.id);
    },
    onError(connection, error) {
      console.error("WS Error", connection.id, error);
    },
  },
});
wsServer.manager.addUpdateLoop(new Loop(() => console.log("Hi TCP!")));
wsServer.start();
wsServer.manager.startUpdateLoops();
