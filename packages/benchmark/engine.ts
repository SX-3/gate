/* eslint-disable */
import { add, complete, cycle, suite } from 'benny';

suite(
  'NaN check',
  add('Number.isNaN', () => Number.isNaN(123)),
  add('NaN === NaN', () => (Number.NaN == Number.NaN)),
  cycle(),
  complete()
);
