/* eslint-disable */
import { add, complete, cycle, suite } from 'benny';

suite(
  'equal',
  add('===', () => typeof 123 === 'number'),
  add('==', () =>  typeof 123 == 'number'),
  cycle(),
  complete()
);
