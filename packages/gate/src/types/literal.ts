import type { ErrorGetter } from '../error';
import type { Schema } from '../schema';
import { serialize } from '../compiler/utils';
import { getErrorMessage } from '../error';
import { createSchema, SchemaType } from '../schema';

export type Literal = string | number | boolean | null | undefined | bigint;

export function literal<Value extends Literal>(
  value: Value,
  message?: ErrorGetter,
): Schema<Value> {
  const errorMessage = getErrorMessage(message) ?? `Expected ${serialize(value)}`;
  return createSchema(SchemaType.LITERAL, {
    // Valid condition: name === value (true → valid, false → invalid)
    rules: name => [[`${name}===${serialize(value)}`, errorMessage]],
  });
}
