import { NetClient } from "../net";
import { Encryption, PacketHandlerRegistry } from "../services";

const encryption = new Encryption(
  Buffer.from("12345678901234567890123456789012", "utf-8"),
  Buffer.from("1234567890123456", "utf-8")
);

const registry = new PacketHandlerRegistry();

registry.register(0x02, (conn, payload) => {
  console.log(`Received packet with opcode 0x02 from server`);
  const json = payload.toString();
  console.log(`Payload: ${json}`);
  conn.send({
    opcode: 0x01,
    payload: Buffer.from(JSON.stringify({ message: "Hello, again!" })),
  });
});

async function tcpClient() {
  const client = new NetClient("tcp", {
    host: "localhost",
    port: 9000,
    encryption,
    registry,
    format: "json",
  });
  await client.connect();
  client.configure();
  client.send({
    opcode: 0x01,
    payload: Buffer.from(JSON.stringify({ message: "Hello, server!" })),
  });
}

async function wsClient() {
  const client = new NetClient("ws", {
    host: "localhost",
    port: 9001,
    encryption,
    registry,
    format: "json",
  });
  await client.connect();
  client.configure();
  client.send({
    opcode: 0x01,
    payload: Buffer.from(JSON.stringify({ message: "Hello, server!" })),
  });
}

async function main() {
  await tcpClient();
  await wsClient();
}

main();
