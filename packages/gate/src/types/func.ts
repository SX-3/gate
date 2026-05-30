import { SchemaType } from '../schema';
import { createPrimitive } from './primitive';

export const func = createPrimitive<(...args: any[]) => any>(SchemaType.FUNCTION, 'function');
