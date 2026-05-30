import type { ErrorGetter } from '../error';
import type { Schema } from '../schema';
import { getErrorMessage } from '../error';
import { createSchema, SchemaType } from '../schema';
import { string } from './string';

/**  Validates a string against a regular expression. */
export function pattern(regex: RegExp, message?: ErrorGetter): Schema<string> {
  const errorMessage = getErrorMessage(message) ?? 'Pattern mismatch';
  return createSchema(SchemaType.STRING, {
    rules: (name, context) => {
      const key = context.embed(regex);
      return [
        ...string.rules!(name, context),
        [regex.global || regex.sticky
          ? `(${key}.lastIndex=0,${key}.test(${name}))`
          : `${key}.test(${name})`, errorMessage],
      ];
    },
  });
}
