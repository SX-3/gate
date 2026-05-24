import type { ErrorGetter } from '../error';
import type { Schema } from '../schema';
import { getErrorMessage } from '../error';
import { createSchema, SchemaType, TYPE } from '../schema';

type InstanceMessage = ErrorGetter<{ constructor: new (...args: any[]) => any }>;

/**
 * Validates that a value is an instance of the given constructor.
 */
export function instance<T>(constructor: new (...args: any[]) => T, message?: InstanceMessage): Schema<T> {
  const errorMessage = getErrorMessage(message, { constructor })
    ?? `Expected instance of ${constructor.name || 'anonymous'}`;

  return createSchema({
    [TYPE]: SchemaType.INSTANCE,
    rules: (name, context) => {
      const key = context.embed(constructor);
      return [[`${name} instanceof ${key}`, errorMessage]];
    },
  });
}
