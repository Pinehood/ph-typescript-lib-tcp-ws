import { getClassMetadata } from "../../common";
import { Calculator } from "../data";

export class PacketWriter {
  private buffer: ArrayBuffer;
  private view: DataView;
  private offset = 0;

  constructor(private obj?: any) {
    const size = obj ? Calculator.calculateObjectSize(obj) : 2048;
    this.buffer = new ArrayBuffer(size);
    this.view = new DataView(this.buffer);
  }

  write(obj: any = this.obj): ArrayBuffer {
    if (!obj) throw new Error("No object provided to write");
    this.offset = 0;
    this.writeStruct(obj);
    return this.buffer.slice(0, this.offset);
  }

  private writeStruct(obj: any): void {
    const fields = getClassMetadata(obj, true);
    for (const field of fields) {
      const value = obj[field.key];
      switch (field.type) {
        case "bool":
          this.view.setUint8(this.offset++, value ? 1 : 0);
          break;
        case "uint8":
          this.view.setUint8(this.offset, value);
          this.offset += 1;
          break;
        case "uint16":
          this.view.setUint16(this.offset, value);
          this.offset += 2;
          break;
        case "uint32":
          this.view.setUint32(this.offset, value);
          this.offset += 4;
          break;
        case "int32":
          this.view.setInt32(this.offset, value);
          this.offset += 4;
          break;
        case "float32":
          this.view.setFloat32(this.offset, value);
          this.offset += 4;
          break;
        case "float64":
          this.view.setFloat64(this.offset, value);
          this.offset += 8;
          break;
        case "string": {
          const strBytes = new TextEncoder().encode(value);
          this.view.setUint16(this.offset, strBytes.length);
          this.offset += 2;
          new Uint8Array(this.buffer, this.offset, strBytes.length).set(
            strBytes
          );
          this.offset += strBytes.length;
          break;
        }
        case "enum":
          this.view.setUint8(this.offset++, value);
          break;
        case "struct":
          this.writeStruct(value);
          break;
        case "array":
          for (let i = 0; i < (field.arrayLength || 0); i++) {
            const item = value[i];
            if (typeof item === "object") {
              this.writeStruct(item);
            } else {
              this.writePrimitive(item, field.structType);
            }
          }
          break;
      }
    }
  }

  private writePrimitive(value: any, type: string): void {
    switch (type) {
      case "uint8":
        this.view.setUint8(this.offset++, value);
        break;
      case "uint16":
        this.view.setUint16(this.offset, value);
        this.offset += 2;
        break;
      case "uint32":
        this.view.setUint32(this.offset, value);
        this.offset += 4;
        break;
      case "int32":
        this.view.setInt32(this.offset, value);
        this.offset += 4;
        break;
      case "float32":
        this.view.setFloat32(this.offset, value);
        this.offset += 4;
        break;
      case "float64":
        this.view.setFloat64(this.offset, value);
        this.offset += 8;
        break;
      case "bool":
        this.view.setUint8(this.offset++, value ? 1 : 0);
        break;
      default:
        throw new Error(`Unsupported array item type: ${type}`);
    }
  }
}
