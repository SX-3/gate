import type { ErrorGetter } from '../error';
import type { Rules, Schema } from '../schema';
import { EQ } from '../compiler/platform';
import { clamp } from '../constraints/clamp';
import { getErrorMessage } from '../error';
import { createSchema, SchemaType, TYPE } from '../schema';

const INT_RANGES = {
  int8: [-128, 127],
  int16: [-32768, 32767],
  int32: [-2147483648, 2147483647],
  int64: [-9223372036854775808n, 9223372036854775807n],
  uint8: [0, 255],
  uint16: [0, 65535],
  uint32: [0, 4294967295],
  uint64: [0n, 18446744073709551615n],
} as const satisfies Record<string, [number | bigint, number | bigint]>;

type IntSize = keyof typeof INT_RANGES;
type IntMessage = ErrorGetter<{ size?: IntSize }>;

export function createInteger<T extends number | bigint>(size?: IntSize): Schema<T> & ((message?: IntMessage) => Schema<T>) {
  const isBigInt = !!size?.endsWith('64');
  const type = isBigInt ? SchemaType.BIGINT : SchemaType.INTEGER;

  const create = (message?: IntMessage): Schema<T> => {
    const errorMessage = getErrorMessage(message, { size })
      ?? `Expected ${size ?? 'integer'}`;

    const rules: Rules = name => [[isBigInt
      ? `typeof ${name} ${EQ} "bigint"`
      : `Number.isInteger(${name})`, errorMessage]];

    const schema = createSchema({ [TYPE]: type, rules });

    // If size is specified, use the range from INT_RANGES
    if (size) {
      const [min, max] = INT_RANGES[size];
      return clamp(
        schema,
        min,
        max,
        errorMessage,
      );
    }

    return schema;
  };

  return Object.assign(create, create());
}

export const int = createInteger<number>();
export const int8 = createInteger<number>('int8');
export const int16 = createInteger<number>('int16');
export const int32 = createInteger<number>('int32');
export const int64 = createInteger<bigint>('int64');
export const uint8 = createInteger<number>('uint8');
export const uint16 = createInteger<number>('uint16');
export const uint32 = createInteger<number>('uint32');
export const uint64 = createInteger<bigint>('uint64');
