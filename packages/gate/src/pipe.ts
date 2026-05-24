import type { Schema } from './schema';

/**
 * Left-to-right composition of schema transformations.
 *
 * @example
 * pipe(string(), min(3), max(10))
 * // equivalent to: max(min(string(), 3), 10)
 */
export function pipe<A, B>(
  base: Schema<A>,
  f1: (s: Schema<A>) => Schema<B>,
): Schema<B>;
export function pipe<A, B, C>(
  base: Schema<A>,
  f1: (s: Schema<A>) => Schema<B>,
  f2: (s: Schema<B>) => Schema<C>,
): Schema<C>;
export function pipe<A, B, C, D>(
  base: Schema<A>,
  f1: (s: Schema<A>) => Schema<B>,
  f2: (s: Schema<B>) => Schema<C>,
  f3: (s: Schema<C>) => Schema<D>,
): Schema<D>;
export function pipe<A, B, C, D, E>(
  base: Schema<A>,
  f1: (s: Schema<A>) => Schema<B>,
  f2: (s: Schema<B>) => Schema<C>,
  f3: (s: Schema<C>) => Schema<D>,
  f4: (s: Schema<D>) => Schema<E>,
): Schema<E>;
export function pipe<A, B, C, D, E, F>(
  base: Schema<A>,
  f1: (s: Schema<A>) => Schema<B>,
  f2: (s: Schema<B>) => Schema<C>,
  f3: (s: Schema<C>) => Schema<D>,
  f4: (s: Schema<D>) => Schema<E>,
  f5: (s: Schema<E>) => Schema<F>,
): Schema<F>;
export function pipe<A, B, C, D, E, F, G>(
  base: Schema<A>,
  f1: (s: Schema<A>) => Schema<B>,
  f2: (s: Schema<B>) => Schema<C>,
  f3: (s: Schema<C>) => Schema<D>,
  f4: (s: Schema<D>) => Schema<E>,
  f5: (s: Schema<E>) => Schema<F>,
  f6: (s: Schema<F>) => Schema<G>,
): Schema<G>;
export function pipe(
  base: Schema<any>,
  ...fns: Array<(s: Schema<any>) => Schema<any>>
): Schema<any> {
  return fns.reduce((s, fn) => fn(s), base);
}
