import { NetFormat, NetType } from "../common";
import { NetServer } from "../net";
import { Loop, Transformer } from "../services";
import { Message, PacketOpcodes } from "./data";
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
      onConnect(connection, logger) {
        logger.info("Connected", connection.id);
      },
      onError(connection, error, logger) {
        logger.error("Error", connection.id, error);
      },
    },
  });
};

const createAndEnableUpdateLoop = (server: NetServer) => {
  const loop = new Loop(
    () => {
      const msg = "Hi from server loop";
      server.logger.info(msg);
      server.sendTo("all", {
        opcode: PacketOpcodes.FROM_UPDATE_LOOP,
        payload: Transformer.transformPacketPayloadForWrite(
          server.format,
          new Message(msg)
        ),
      });
    },
    10000,
    true
  );
  server.mngr.addUpdateLoop(loop);
  server.mngr.startUpdateLoops();
};

const dynamicHandlerUpdates = (server: NetServer) => {
  server.updateEventHandlers({
    onClose(connection, logger) {
      logger.warn("Closed", connection.id);
    },
  });
  server.addPacketHandler(
    PacketOpcodes.FROM_UPDATE_LOOP,
    (conn, packet, logger) => {
      const data = Transformer.readData<Message>(conn, packet, Message);
      logger.info("" + PacketOpcodes.FROM_UPDATE_LOOP, conn.id, data);
    }
  );
};

const main = async () => {
  const server = await createServer();
  server.start();
  createAndEnableUpdateLoop(server);
  dynamicHandlerUpdates(server);
};

main();
