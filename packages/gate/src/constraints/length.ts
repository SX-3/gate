import type { ErrorGetter } from '../error';
import type { Schema } from '../schema';
import { getErrorMessage } from '../error';
import { extendSchema, isSchema } from '../schema';

type LengthMessage = ErrorGetter<{ n: number }>;

/**
 * Constrains the `.length` property to equal `n`.
 * Valid condition: `name.length === n` (true = valid).
 */
export function length<T extends { length: number }>(schema: Schema<T>, n: number, message?: LengthMessage): Schema<T>;
export function length(n: number, message?: LengthMessage): <T extends { length: number }>(schema: Schema<T>) => Schema<T>;
export function length<T extends { length: number }>(
  schemaOrN: Schema<T> | number,
  nOrMessage?: number | LengthMessage,
  maybeMessage?: LengthMessage,
): Schema<T> | ((schema: Schema<T>) => Schema<T>) {
  if (isSchema(schemaOrN)) {
    const n = nOrMessage as number;
    const errorMessage = getErrorMessage(maybeMessage, { n }) ?? `Length ${n}`;
    return extendSchema(schemaOrN, {
      rules: (name: string) => [
        [`${name}.length==${n}`, errorMessage],
      ],
    });
  }

  return schema => length(
    schema,
    schemaOrN,
    nOrMessage as LengthMessage | undefined,
  );
}
