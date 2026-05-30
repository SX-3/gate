import { SchemaType } from '../schema';
import { createPrimitive } from './primitive';

export const symbol = createPrimitive<symbol>(SchemaType.SYMBOL, 'symbol');
