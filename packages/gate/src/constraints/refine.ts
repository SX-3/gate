import type { ErrorGetter } from '../error';
import type { Schema } from '../schema';
import { getErrorMessage } from '../error';
import { extendSchema, isSchema } from '../schema';

type Refine<T> = (value: T) => boolean;

export function refine<T>(schema: Schema<T>, condition: string | Refine<T>, message?: ErrorGetter): Schema<T>;
export function refine<T>(condition: string | Refine<T>, message?: ErrorGetter): (schema: Schema<T>) => Schema<T>;
export function refine<T>(
  schemaOrCondition: Schema<T> | string | Refine<T>,
  conditionOrMessage?: string | Refine<T> | ErrorGetter,
  maybeMessage?: ErrorGetter,
): Schema<T> | ((schema: Schema<T>) => Schema<T>) {
  if (isSchema(schemaOrCondition)) {
    const schema = schemaOrCondition;
    const condition = conditionOrMessage;
    const message = getErrorMessage(maybeMessage) ?? 'Invalid value';

    // ── String-based: just add a rule ──
    if (typeof condition === 'string') {
      return extendSchema(schema, {
        rules: name => [
          [condition.replace(/\$/g, name), message],
        ],
      });
    }

    return extendSchema(schema, {
      rules: (name, context) => [[`${context.embed(condition)}(${name})`, message]],
    });
  }

  return schema => refine(
    schema,
    schemaOrCondition,
    conditionOrMessage as ErrorGetter | undefined,
  );
}
