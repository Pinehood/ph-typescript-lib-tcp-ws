import { BasicType, HandlerMeta, FieldMeta } from "./types";

const classMetadata = new WeakMap<any, Array<FieldMeta>>();
const handlerRegistry: Array<HandlerMeta> = [];

export function Field(
  type: BasicType,
  structTypeOrEnum?: any,
  options?: { length?: number }
): PropertyDecorator {
  return (target, propertyKey) => {
    const ctor = target.constructor;
    const meta: Array<FieldMeta> = classMetadata.get(ctor) || [];
    meta.push({
      key: propertyKey as string,
      type,
      structType:
        type === "struct" || type === "array" ? structTypeOrEnum : undefined,
      enumMap: type === "enum" ? structTypeOrEnum : undefined,
      arrayLength: type === "array" ? options?.length : undefined,
    });
    classMetadata.set(ctor, meta);
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

export function getRegisteredHandlers(): Array<HandlerMeta> {
  return handlerRegistry;
}

export function getClassMetadata(
  target: any,
  isCtor: boolean
): Array<FieldMeta> {
  const ctor = isCtor ? Object.getPrototypeOf(target).constructor : target;
  const fromMap = classMetadata.get(ctor);
  if (fromMap) return fromMap;
  return [];
}
