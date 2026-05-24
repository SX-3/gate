import type { Schema } from '../schema';
import type { ModifierSchema } from './modifier';
import { createSchema, SchemaType, TYPE } from '../schema';
import { compileModifier } from './modifier';

/**
 * Value can be `undefined` OR pass the inner schema.
 * Guard: `name !== void 0` — if not undefined, check inner.
 */
export function optional<T>(inner: Schema<T>): ModifierSchema<T | undefined> {
  return createSchema({
    [TYPE]: SchemaType.MODIFIER,
    guard: name => `${name} !== void 0`,
    compiler: compileModifier,
    inner,
  });
}
