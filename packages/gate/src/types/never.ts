import type { ErrorGetter } from '../error';
import type { Schema } from '../schema';
import { getErrorMessage } from '../error';
import { createSchema, SchemaType, TYPE } from '../schema';

function create(message?: ErrorGetter): Schema<never> {
  const errorMessage = getErrorMessage(message) ?? 'Expected never';
  return createSchema({
    [TYPE]: SchemaType.NEVER,
    rules: () => [['false', errorMessage]],
  });
}

export const never = Object.assign(create, create());
