import type { ErrorGetter } from '../error';
import type { Schema, SchemaType } from '../schema';
import { EQ } from '../compiler/platform';
import { getErrorMessage } from '../error';
import { createSchema, TYPE } from '../schema';

type TypeOf = 'string' | 'number' | 'boolean' | 'bigint' | 'symbol' | 'object' | 'function';

/**
 * Factory for primitive types.
 * Rules use VALID conditions: `typeof name === "string"` (true = valid).
 */
export function createPrimitive<Type>(type: SchemaType, typeofRule: TypeOf): Schema<Type> & ((message?: ErrorGetter) => Schema<Type>) {
  const create = (message?: ErrorGetter): Schema<Type> => {
    const errorMessage = getErrorMessage(message) ?? `Expected ${typeofRule}`;
    return createSchema({
      [TYPE]: type,
      rules: name => [[`typeof ${name} ${EQ} "${typeofRule}"`, errorMessage]],
    });
  };

  return Object.assign(create, create());
}
