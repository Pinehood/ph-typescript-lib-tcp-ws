import { PacketRegistry, Encryption } from "../services";
import BasicHandlers from "./handlers";

export const getSharedData = async () => {
  const registry = new PacketRegistry();
  await registry.loadHandlersFrom([BasicHandlers]);
  const encryption = new Encryption(
    Buffer.from("12345678901234567890123456789012", "utf-8"),
    Buffer.from("1234567890123456", "utf-8")
  );
  return { registry, encryption };
};
