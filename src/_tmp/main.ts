import { NetServer } from "../net";
import { PacketHandlerRegistry, Encryption, Loop } from "../services";
import BasicHandlers from "./handlers/basic";

const registry = new PacketHandlerRegistry();
const encryption = new Encryption(
  Buffer.from("12345678901234567890123456789012", "utf-8"),
  Buffer.from("1234567890123456", "utf-8")
);

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
  server.mngr.addUpdateLoop(new Loop(() => console.log("Hi TCP!")));
  server.start();
  server.mngr.startUpdateLoops();
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
  server.mngr.addUpdateLoop(new Loop(() => console.log("Hi TCP!")));
  server.start();
  server.mngr.startUpdateLoops();
};

async function main() {
  await registry.loadHandlersFrom([BasicHandlers]);
  tcpServer();
  wsServer();
}

main();
