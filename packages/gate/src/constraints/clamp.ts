import type { Context } from '../compiler';
import type { ErrorGetter } from '../error';
import type { Schema } from '../schema';
import { serialize } from '../compiler/utils';
import { getErrorMessage } from '../error';
import { isSchema, TYPE, WITH_LENGTH } from '../schema';

type ClampValue = number | bigint;
type AcceptValue = number | bigint | string | any[];
type ClampMessage = ErrorGetter<{
  min: ClampValue;
  max: ClampValue;
  isCheckLength: boolean;
}>;

export function clamp<T extends Schema<AcceptValue>>(
  schema: T,
  min: ClampValue,
  max: ClampValue,
  message?: ClampMessage,
): T;

export function clamp(
  min: ClampValue,
  max: ClampValue,
  message?: ClampMessage,
): <T extends Schema<AcceptValue>>(schema: T) => T;

export function clamp<T extends Schema<AcceptValue>>(
  schemaOrMin: T | ClampValue,
  minOrMax: ClampValue,
  maxOrOptions?: ClampValue | ClampMessage,
  maybeMessage?: ClampMessage,
): T | ((schema: T) => T) {
  if (isSchema(schemaOrMin)) {
    const min = serialize(minOrMax);
    const max = serialize(maxOrOptions);
    const isCheckLength = !!(schemaOrMin[TYPE] & WITH_LENGTH);
    const message = getErrorMessage(maybeMessage, { min: minOrMax, max: maxOrOptions as ClampValue, isCheckLength })
      ?? (isCheckLength ? `Clamp length is ${min}..${max}` : `Clamp value is ${min}..${max}`);

    return {
      ...schemaOrMin,
      rules: (name: string, context: Context) => [
        ...schemaOrMin.rules?.(name, context) ?? [],
        [`${isCheckLength ? `${name}.length` : name}>=${min}`, message],
        [`${isCheckLength ? `${name}.length` : name}<=${max}`, message],
      ],
    };
  }

  return schema => clamp(
    schema,
    schemaOrMin,
    minOrMax,
    maxOrOptions as ClampMessage | undefined,
  );
}
