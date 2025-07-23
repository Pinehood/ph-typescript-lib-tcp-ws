import { FieldMetadata } from "./interfaces";
import { BasicType, HandlerMeta } from "./types";

const classMetadata = new WeakMap<any, FieldMetadata[]>();
const handlerRegistry: HandlerMeta[] = [];

export function Field(
  type: BasicType,
  structTypeOrEnum?: any,
  options?: { length?: number }
): PropertyDecorator {
  return (target, propertyKey) => {
    const ctor = target.constructor;
    const meta: FieldMetadata[] = classMetadata.get(ctor) || [];
    meta.push({
      key: propertyKey as string,
      type,
      structType:
        type === "struct" || type === "array" ? structTypeOrEnum : undefined,
      enumMap: type === "enum" ? structTypeOrEnum : undefined,
      arrayLength: type === "array" ? options?.length : undefined,
    });
    classMetadata.set(ctor, meta);
    Object.defineProperty(ctor, "__packetFields", {
      value: meta,
      enumerable: false,
      configurable: true,
    });
  };
}

export function PacketHandler(opcode: number): MethodDecorator {
  return (target, propertyKey) => {
    handlerRegistry.push({
      opcode,
      methodName: propertyKey as string,
      targetClass: target.constructor,
    });
  };
}

export function getRegisteredHandlers(): HandlerMeta[] {
  return handlerRegistry;
}

export function getClassMetadata(
  target: any,
  isCtor: boolean
): FieldMetadata[] {
  const ctor = isCtor ? Object.getPrototypeOf(target).constructor : target;
  const fromMap = classMetadata.get(ctor);
  if (fromMap) return fromMap;
  return (ctor as any).__packetFields || [];
}
