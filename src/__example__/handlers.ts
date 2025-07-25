import { Connection, PacketHandler, Packet, LoggerService } from "../common";
import { Transformer } from "../services";
import { Position } from "./data";

class BasicHandlers {
  @PacketHandler(0x01)
  test1(conn: Connection, _: Packet, logger: LoggerService) {
    logger.info("Basic packet 1");
    Transformer.writeData(conn, 0x02, new Position(1, 2));
  }

  @PacketHandler(0x02)
  test2(conn: Connection, packet: Packet, logger: LoggerService) {
    const readPos = Transformer.readData<Position>(conn, packet, Position);
    logger.info("Basic packet 2: ", readPos.x, readPos.y);
    Transformer.writeData(conn, 0x03, new Position(2, 1));
  }

  @PacketHandler(0x03)
  test3(conn: Connection, packet: Packet, logger: LoggerService) {
    const readPos = Transformer.readData<Position>(conn, packet, Position);
    logger.info("Basic packet 3: ", readPos.x, readPos.y);
    Transformer.writeData(conn, 0x02, new Position(3, 3));
  }
}

export default BasicHandlers;
