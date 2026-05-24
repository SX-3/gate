import type { Schema } from '../schema';
import { createSchema, SchemaType, TYPE } from '../schema';

const create = (): Schema<unknown> => createSchema({ [TYPE]: SchemaType.UNKNOWN });

export const unknown = Object.assign(create, create());
