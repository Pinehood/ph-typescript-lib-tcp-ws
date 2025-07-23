import { PacketReader, PacketWriter } from "../services";
import { getClassMetadata } from "./decorators";

export function transformPacketPayloadForRead<T>(
  format: "json" | "bytes",
  payload: Buffer
) {
  if (format === "bytes") {
    return new PacketReader(payload);
  }
  return JSON.parse(payload.toString()) as T;
}

export function transformPacketPayloadForWrite<T>(
  format: "json" | "bytes",
  payload: PacketWriter | Buffer | any
) {
  if (format === "bytes") {
    if (payload instanceof PacketWriter) {
      return Buffer.from(payload.write());
    }
    return Buffer.from(new PacketWriter(payload).write());
  }
  return Buffer.from(JSON.stringify(payload));
}
export function calculateSize(obj: any): number {
  let size = 0;
  const fields = getClassMetadata(obj, true);
  for (const field of fields) {
    const value = obj[field.key];
    switch (field.type) {
      case "bool":
      case "uint8":
      case "enum":
        size += 1;
        break;
      case "uint16":
        size += 2;
        break;
      case "uint32":
      case "int32":
      case "float32":
        size += 4;
        break;
      case "float64":
        size += 8;
        break;
      case "string": {
        const strBytes = new TextEncoder().encode(value || "");
        size += 2 + strBytes.length;
        break;
      }
      case "struct":
        size += calculateSize(value);
        break;
      case "array": {
        const arr = value || [];
        for (let i = 0; i < (field.arrayLength || arr.length); i++) {
          const item = arr[i] ?? getDefault(field.structType);
          if (typeof item === "object") {
            size += calculateSize(item);
          } else {
            size += getPrimitiveSize(field.structType);
          }
        }
        break;
      }
    }
  }
  return size;
}

function getPrimitiveSize(type: string): number {
  switch (type) {
    case "bool":
    case "uint8":
      return 1;
    case "uint16":
      return 2;
    case "uint32":
    case "int32":
    case "float32":
      return 4;
    case "float64":
      return 8;
    default:
      throw new Error(`Unknown primitive type for size: ${type}`);
  }
}

function getDefault(type: any): any {
  if (typeof type === "string") {
    switch (type) {
      case "bool":
        return false;
      case "uint8":
      case "uint16":
      case "uint32":
      case "int32":
      case "float32":
      case "float64":
        return 0;
      default:
        return 0;
    }
  }
  return new type();
}
