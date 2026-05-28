import type { Context } from '../compiler/context';
import type { ErrorGetter } from '../error';
import type { Schema } from '../schema';
import { serialize } from '../compiler/utils';
import { getErrorMessage } from '../error';
import { isSchema, TYPE, WITH_LENGTH } from '../schema';

type AcceptValue = number | bigint | string | any[];
type MaxValue = number | bigint;
type MaxMessage = ErrorGetter<{ n: MaxValue; isCheckLength: boolean }>;

/**
 * Valid condition: `name.length <= n` or `name <= n` (true = valid).
 */
export function max<T extends Schema<AcceptValue>>(schema: T, n: MaxValue, message?: MaxMessage): T;
export function max(n: MaxValue, message?: MaxMessage): <T extends Schema<AcceptValue>>(schema: T) => T;
export function max<T extends Schema<AcceptValue>>(
  schemaOrN: T | MaxValue,
  nOrMessage?: MaxValue | MaxMessage,
  maybeMessage?: MaxMessage,
): T | ((schema: T) => T) {
  if (isSchema(schemaOrN)) {
    const n = serialize(nOrMessage);
    const isCheckLength = !!(schemaOrN[TYPE] & WITH_LENGTH);
    const message = getErrorMessage(maybeMessage, { n: nOrMessage as MaxValue, isCheckLength })
      ?? (isCheckLength ? `Max length is ${n}` : `Max value is ${n}`);

    return {
      ...schemaOrN,
      rules: (name: string, context: Context) => [
        ...schemaOrN.rules?.(name, context) ?? [],
        [isCheckLength ? `${name}.length<=${n}` : `${name}<=${n}`, message],
      ],
    };
  }

  return schema => max(schema, schemaOrN, nOrMessage as MaxMessage | undefined);
}
