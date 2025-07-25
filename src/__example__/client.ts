import { NetType, NetFormat } from "../common";
import { NetClient } from "../net";
import { Loop, Transformer } from "../services";
import { Message, PacketOpcodes } from "./data";
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

const createAndEnableUpdateLoop = (client: NetClient) => {
  const loop = new Loop(
    () => {
      const msg = "Hi from client loop";
      client.logger.info(msg);
      client.send({
        opcode: PacketOpcodes.FROM_UPDATE_LOOP,
        payload: Transformer.transformPacketPayloadForWrite(
          client.format,
          new Message(msg)
        ),
      });
    },
    10000,
    true
  );
  client.mngr.addUpdateLoop(loop);
  client.mngr.startUpdateLoops();
};

const dynamicHandlerUpdates = (client: NetClient) => {
  client.updateEventHandlers({
    onClose(connection, logger) {
      logger.warn("Closed", connection.id);
    },
  });
  client.addPacketHandler(
    PacketOpcodes.FROM_UPDATE_LOOP,
    (conn, packet, logger) => {
      const data = Transformer.readData<Message>(conn, packet, Message);
      logger.info("" + PacketOpcodes.FROM_UPDATE_LOOP, conn.id, data);
    }
  );
};

const main = async () => {
  const client = await createClient();
  await client.connect();
  client.configure();
  createAndEnableUpdateLoop(client);
  client.send({
    opcode: PacketOpcodes.INITIAL,
    payload: Buffer.from([]),
  });
  dynamicHandlerUpdates(client);
};

main();
