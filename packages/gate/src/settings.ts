import type { Mode } from './compiler';

let store = {
  standardMode: 'parse' as Mode,
  strict: false,
  checkNaN: true,
};

export function settings(options?: Partial<typeof store>): Readonly<typeof store> {
  if (options) store = { ...store, ...options };
  return store;
}
