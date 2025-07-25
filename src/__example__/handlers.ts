import { Connection, PacketHandler, Packet, LoggerService } from "../common";
import { Transformer } from "../services";
import { PacketOpcodes, Position } from "./data";

class BasicHandlers {
  @PacketHandler(PacketOpcodes.INITIAL)
  test1(conn: Connection, _: Packet, logger: LoggerService) {
    logger.info("Basic packet 1");
    Transformer.writeData(
      conn,
      PacketOpcodes.INITIAL_RESPONSE,
      new Position(1, 2)
    );
  }

  @PacketHandler(PacketOpcodes.INITIAL_RESPONSE)
  test2(conn: Connection, packet: Packet, logger: LoggerService) {
    const readPos = Transformer.readData<Position>(conn, packet, Position);
    logger.info("Basic packet 2: ", readPos.x, readPos.y);
    Transformer.writeData(
      conn,
      PacketOpcodes.INITIAL_RETRIGGER,
      new Position(2, 1)
    );
  }

  @PacketHandler(PacketOpcodes.INITIAL_RETRIGGER)
  test3(conn: Connection, packet: Packet, logger: LoggerService) {
    const readPos = Transformer.readData<Position>(conn, packet, Position);
    logger.info("Basic packet 3: ", readPos.x, readPos.y);
    Transformer.writeData(
      conn,
      PacketOpcodes.INITIAL_RESPONSE,
      new Position(3, 3)
    );
  }
}

export default BasicHandlers;
