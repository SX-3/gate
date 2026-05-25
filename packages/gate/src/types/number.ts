import type { ErrorGetter } from '../error';
import type { Schema } from '../schema';
import { EQ } from '../compiler/platform';
import { getErrorMessage } from '../error';
import { createSchema, SchemaType, TYPE } from '../schema';
import { settings } from '../settings';

type NumberOptions = ErrorGetter | {
  message?: ErrorGetter;
  checkNaN?: boolean;
};

function create(options?: NumberOptions): Schema<number> {
  const errorMessage = getErrorMessage(options) ?? 'Expected number';
  return createSchema({
    [TYPE]: SchemaType.NUMBER,
    rules: (name) => {
      const checkNaN = typeof options === 'object' ? (options.checkNaN ?? settings().checkNaN) : settings().checkNaN;
      let rule = `typeof ${name} ${EQ} "number"`;
      if (checkNaN) rule += ` && ${name}${EQ}${name}`;
      return [[rule, errorMessage]];
    },
  });
}

export const number = Object.assign(create, create());
