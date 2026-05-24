import { SchemaType } from '../schema';
import { createPrimitive } from './primitive';

export const bigint = createPrimitive<bigint>(SchemaType.BIGINT, 'bigint');
