import { getClassMetadata } from "../common";
import { NetServer } from "../net";
import { PacketHandlerRegistry, Encryption, Loop } from "../services";
import { Position } from "./handlers/basic";

const registry = new PacketHandlerRegistry();
const encryption = new Encryption(
  Buffer.from("12345678901234567890123456789012", "utf-8"),
  Buffer.from("1234567890123456", "utf-8")
);

// registry.register(0x01, (conn, packet) => {
//   console.log(`Received packet with opcode 0x01 from connection ${conn.id}`);
//   const json = packet.payload.toString();
//   console.log(`Payload: ${json}`);
//   conn.send({
//     opcode: 0x02,
//     payload: Buffer.from(JSON.stringify({ message: "Hello, client!" })),
//   });
// });

const tcpServer = () => {
  const server = new NetServer("tcp", {
    port: 9000,
    registry,
    encryption,
    format: "bytes",
    handlers: {
      onConnect(connection) {
        console.log("TCP Connected", connection.id);
      },
      onError(connection, error) {
        console.error("TCP Error", connection.id, error);
      },
    },
  });
  server.manager.addUpdateLoop(new Loop(() => console.log("Hi TCP!")));
  server.start();
  server.manager.startUpdateLoops();
};

const wsServer = () => {
  const server = new NetServer("ws", {
    port: 9001,
    registry,
    encryption,
    format: "bytes",
    handlers: {
      onConnect(connection) {
        console.log("WS Connected", connection.id);
      },
      onError(connection, error) {
        console.error("WS Error", connection.id, error);
      },
    },
  });
  server.manager.addUpdateLoop(new Loop(() => console.log("Hi TCP!")));
  server.start();
  server.manager.startUpdateLoops();
};

async function main() {
  await registry.loadHandlersFrom(["./src/_tmp/handlers"]);
  tcpServer();
  wsServer();
}

main();
