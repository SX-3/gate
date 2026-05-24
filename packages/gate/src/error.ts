export interface ValidationError {
  path: string[];
  message: string;
}

export class GateError extends Error implements ValidationError {
  path: string[];

  constructor(message: string, path: string[]) {
    super(message);
    this.path = path;
  }
}

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
