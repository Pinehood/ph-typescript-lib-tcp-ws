import { NetFormat, NetType } from "../common";
import { NetServer } from "../net";
import { Loop } from "../services";
import { getSharedData } from "./shared";

const createServer = async (
  port = 9000,
  type: NetType = "tcp",
  format: NetFormat = "bytes"
) => {
  const { registry, encryption } = await getSharedData();
  return new NetServer(type, {
    port,
    registry,
    encryption,
    format,
    handlers: {
      onConnect(connection) {
        console.log("Connected", connection.id);
      },
      onError(connection, error) {
        console.error("Error", connection.id, error);
      },
    },
  });
};

const main = async () => {
  const server = await createServer();
  server.start();

  const loop = new Loop(() => console.log("Hi from loop"), 10000, true);
  server.mngr.addUpdateLoop(loop);
  server.mngr.startUpdateLoops();
};

main();
