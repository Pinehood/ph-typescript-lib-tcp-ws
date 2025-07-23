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
    const metadata = classMetadata.get(target.constructor) || [];
    metadata.push({
      key: propertyKey as string,
      type,
      structType:
        type === "struct" || type === "array" ? structTypeOrEnum : undefined,
      enumMap: type === "enum" ? structTypeOrEnum : undefined,
      arrayLength: type === "array" ? options?.length : undefined,
    });
    classMetadata.set(target.constructor, metadata);
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

export function getClassMetadata(target: any): FieldMetadata[] {
  return classMetadata.get(target.constructor || target) || [];
}
