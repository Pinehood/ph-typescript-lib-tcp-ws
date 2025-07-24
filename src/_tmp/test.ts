import { NetClient } from "../net";
import { Encryption, PacketHandlerRegistry } from "../services";

const encryption = new Encryption(
  Buffer.from("12345678901234567890123456789012", "utf-8"),
  Buffer.from("1234567890123456", "utf-8")
);

const registry = new PacketHandlerRegistry();

async function tcpClient() {
  await registry.loadHandlersFrom(["./src/_tmp/handlers"]);
  const client = new NetClient("tcp", {
    host: "localhost",
    port: 9000,
    encryption,
    registry,
    format: "bytes",
  });
  await client.connect();
  client.configure();
  client.send({
    opcode: 0x01,
    payload: Buffer.from([]),
  });
}

async function wsClient() {
  await registry.loadHandlersFrom(["./src/_tmp/handlers"]);
  const client = new NetClient("ws", {
    host: "localhost",
    port: 9001,
    encryption,
    registry,
    format: "bytes",
  });
  await client.connect();
  client.configure();
  client.send({
    opcode: 0x01,
    payload: Buffer.from([]),
  });
}

async function main() {
  await tcpClient();
  await wsClient();
}

main();
