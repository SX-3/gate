export class GateError implements Error {
  message: string;
  path: string[];
  declare name: string;

  constructor(message: string, path: string[]) {
    this.message = message;
    this.path = path;
  }
}

// `extends Error` makes V8 capture a stack trace inside `super()` on every
// construction, which is pure overhead for validation errors. Linking the
// prototype manually keeps `instanceof Error` (and `instanceof GateError`)
// working while never calling the `Error` constructor, so no stack is captured.
Object.setPrototypeOf(GateError.prototype, Error.prototype);

export type ErrorGetter<T = undefined> = (T extends undefined ? () => string : (options: T) => string) | string;
interface OptionsWithGetter<T> {
  message?: ErrorGetter<T>;
}

export function getErrorMessage(from: ErrorGetter | OptionsWithGetter<undefined> | undefined): string | null;
export function getErrorMessage<T>(from: ErrorGetter<T> | OptionsWithGetter<T> | undefined, options: T): string | null;
export function getErrorMessage<T>(from: ErrorGetter<T> | OptionsWithGetter<T> | undefined, options?: T): string | null {
  const getter = typeof from === 'object' ? from.message : from;
  const message = typeof getter === 'function' ? getter(options as T) : getter;
  return message ?? null;
}
