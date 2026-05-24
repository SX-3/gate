import type { ErrorGetter } from '../error';
import type { Schema } from '../schema';
import { EQ } from '../compiler/platform';
import { getErrorMessage } from '../error';
import { createSchema, SchemaType, TYPE } from '../schema';
import { settings } from '../settings';

interface NumberErrorOptions { checkNaN: boolean }
type NumberOptions = ErrorGetter<NumberErrorOptions> | {
  message?: ErrorGetter<NumberErrorOptions>;
  checkNaN?: boolean;
};

function create(options?: NumberOptions): Schema<number> {
  const checkNaN = typeof options === 'object' ? options.checkNaN ?? settings().checkNaN : true;
  const errorMessage = getErrorMessage(options, { checkNaN }) ?? 'Expected number';
  return createSchema({
    [TYPE]: SchemaType.NUMBER,
    rules: (name) => {
      let rule = `typeof ${name} ${EQ} "number" && !Number.isNaN(${name})`;
      if (checkNaN) rule += ` && !Number.isNaN(${name})`;
      return [[rule, errorMessage]];
    },
  });
}

export const number = Object.assign(create, create());
