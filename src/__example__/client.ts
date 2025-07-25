import { NetType, NetFormat } from "../common";
import { NetClient } from "../net";
import { Loop } from "../services";
import { getSharedData } from "./shared";

const createClient = async (
  port = 9000,
  type: NetType = "tcp",
  format: NetFormat = "bytes"
) => {
  const { registry, encryption } = await getSharedData();
  return new NetClient(type, {
    host: "localhost",
    port,
    encryption,
    registry,
    format,
  });
};

const main = async () => {
  const client = await createClient();
  await client.connect();
  client.configure();

  const loop = new Loop(() => console.log("Hi from loop"), 10000, true);
  client.mngr.addUpdateLoop(loop);
  client.mngr.startUpdateLoops();
  client.send({
    opcode: 0x01,
    payload: Buffer.from([]),
  });
};

main();
