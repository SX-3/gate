import type { Schema } from '../schema';
import type { ModifierSchema } from './modifier';
import { createSchema, SchemaType } from '../schema';
import { compileModifier } from './modifier';

/**
 * Value can be `null` OR pass the inner schema.
 * Guard: `name !== null` — if not null, check inner.
 */
export function nullable<T>(inner: Schema<T>): ModifierSchema<T | null> {
  return createSchema(SchemaType.MODIFIER, {
    guard: (name: string) => `${name} !== null`,
    compiler: compileModifier,
    inner,
  });
}
