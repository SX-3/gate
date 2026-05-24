import type { ErrorGetter } from '../error';
import type { Schema } from '../schema';
import { serialize } from '../compiler/utils';
import { getErrorMessage } from '../error';
import { isSchema, TYPE, WITH_LENGTH } from '../schema';

type AcceptValue = number | bigint | string | any[];
type MinValue = number | bigint;
type MinMessage = ErrorGetter<{ n: MinValue; isCheckLength: boolean }>;

/**
 * Valid condition: `name.length >= n` or `name >= n` (true = valid).
 */
export function min<T extends Schema<AcceptValue>>(schema: T, n: MinValue, message?: MinMessage): T;
export function min(n: MinValue, message?: MinMessage): <T extends Schema<AcceptValue>>(schema: T) => T;
export function min<T extends Schema<AcceptValue>>(
  schemaOrN: T | MinValue,
  nOrMessage?: MinValue | MinMessage,
  maybeMessage?: MinMessage,
): T | ((schema: T) => T) {
  if (isSchema(schemaOrN)) {
    const n = serialize(nOrMessage);
    const isCheckLength = !!(schemaOrN[TYPE] & WITH_LENGTH);
    const message = getErrorMessage(maybeMessage, { n: nOrMessage as MinValue, isCheckLength })
      ?? (isCheckLength ? `Min length is ${n}` : `Min value is ${n}`);

    return {
      ...schemaOrN,
      rules: (name, context) => [
        ...schemaOrN.rules?.(name, context) ?? [],
        [isCheckLength ? `${name}.length>=${n}` : `${name}>=${n}`, message],
      ],
    };
  }

  return schema => min(schema, schemaOrN, nOrMessage as MinMessage | undefined);
}
