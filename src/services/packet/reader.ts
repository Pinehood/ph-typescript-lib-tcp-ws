import { getClassMetadata } from "../../common";

export class PacketReader {
  private view: DataView;
  private offset = 0;

  constructor(private buffer: Buffer | ArrayBuffer) {
    if (buffer instanceof ArrayBuffer) {
      this.buffer = buffer;
    } else if (Buffer.isBuffer(buffer)) {
      // @ts-ignore
      this.buffer = buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength
      );
    } else {
      throw new TypeError("PacketReader expects Buffer or ArrayBuffer");
    }
    // @ts-ignore
    this.view = new DataView(this.buffer);
  }

  read<T>(cls: new () => T): T {
    this.offset = 0;
    return this.readStruct(cls);
  }

  private readStruct<T>(cls: new () => T): T {
    const obj = new cls();
    const fields = getClassMetadata(cls, false);
    for (const field of fields) {
      const key = field.key as keyof T;
      switch (field.type) {
        case "bool":
          obj[key] = (this.view.getUint8(this.offset++) === 1) as T[keyof T];
          break;
        case "uint8":
          obj[key] = this.view.getUint8(this.offset) as any;
          this.offset += 1;
          break;
        case "uint16":
          obj[key] = this.view.getUint16(this.offset) as any;
          this.offset += 2;
          break;
        case "uint32":
          obj[key] = this.view.getUint32(this.offset) as any;
          this.offset += 4;
          break;
        case "int32":
          obj[key] = this.view.getInt32(this.offset) as any;
          this.offset += 4;
          break;
        case "float32":
          obj[key] = this.view.getFloat32(this.offset) as any;
          this.offset += 4;
          break;
        case "float64":
          obj[key] = this.view.getFloat64(this.offset) as any;
          this.offset += 8;
          break;
        case "string": {
          const len = this.view.getUint16(this.offset);
          this.offset += 2;
          // @ts-ignore
          const strBytes = new Uint8Array(this.buffer, this.offset, len);
          obj[key] = new TextDecoder().decode(strBytes) as any;
          this.offset += len;
          break;
        }
        case "enum":
          obj[key] = this.view.getUint8(this.offset++) as any;
          break;
        case "struct":
          obj[key] = this.readStruct(field.structType!) as any;
          break;
        case "array": {
          const arr: Array<any> = [];
          for (let i = 0; i < (field.arrayLength || 0); i++) {
            if (field.structType.prototype) {
              arr.push(this.readStruct(field.structType));
            } else {
              arr.push(this.readPrimitive(field.structType));
            }
          }
          obj[key] = arr as any;
          break;
        }
      }
    }
    return obj;
  }

  private readPrimitive(type: string): unknown {
    switch (type) {
      case "uint8":
        return this.view.getUint8(this.offset++);
      case "uint16":
        const u16 = this.view.getUint16(this.offset);
        this.offset += 2;
        return u16;
      case "uint32":
        const u32 = this.view.getUint32(this.offset);
        this.offset += 4;
        return u32;
      case "int32":
        const i32 = this.view.getInt32(this.offset);
        this.offset += 4;
        return i32;
      case "float32":
        const f32 = this.view.getFloat32(this.offset);
        this.offset += 4;
        return f32;
      case "float64":
        const f64 = this.view.getFloat64(this.offset);
        this.offset += 8;
        return f64;
      case "bool":
        return this.view.getUint8(this.offset++) === 1;
      default:
        throw new Error(`Unsupported array item type: ${type}`);
    }
  }
}
