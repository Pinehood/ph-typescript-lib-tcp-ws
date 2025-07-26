import { getClassMetadata } from "../../common";

export class Calculator {
  static calculateNewId(length: number = 16): string {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      const randIndex = Math.floor(Math.random() * chars.length);
      result += chars[randIndex];
    }
    return result;
  }

  static calculateObjectSize(obj: any): number {
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
          size += this.calculateObjectSize(value);
          break;
        case "array": {
          const arr = value || [];
          for (let i = 0; i < (field.arrayLength || arr.length); i++) {
            const item = arr[i] ?? this.getDefaultValue(field.structType);
            if (typeof item === "object") {
              size += this.calculateObjectSize(item);
            } else {
              size += this.calculatePrimitiveSize(field.structType);
            }
          }
          break;
        }
      }
    }
    return size;
  }

  private static calculatePrimitiveSize(type: string): number {
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

  private static getDefaultValue(type: any): unknown {
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
}
