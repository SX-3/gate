import type { Schema } from '../schema';
import type { ModifierSchema } from './modifier';
import { createSchema, SchemaType, TYPE } from '../schema';
import { compileModifier } from './modifier';

/**
 * Value can be `null` or `undefined` OR pass the inner schema.
 * Guard: `name != null` — if not nullish, check inner.
 */
export function nullish<T>(inner: Schema<T>): ModifierSchema<T | null | undefined> {
  return createSchema({
    [TYPE]: SchemaType.MODIFIER,
    guard: name => `${name} != null`,
    compiler: compileModifier,
    inner,
  });
}
