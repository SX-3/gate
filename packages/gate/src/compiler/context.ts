export class Context {
  protected sequence: number = 0;
  readonly embedEntries: Map<unknown, string> = new Map();

  /** Get unique id */
  get id(): number {
    return this.sequence++;
  }

  embed(value: unknown): string {
    const existed = this.embedEntries.get(value);
    if (existed) return existed;
    const key = `e${this.id}`;
    this.embedEntries.set(value, key);
    return key;
  };

  build(): { inline: string; params: string; values: unknown[] } {
    const inline: string[] = [];
    const params: string[] = [];
    const values: unknown[] = [];

    for (const [value, key] of this.embedEntries.entries()) {
      if (typeof value === 'string') {
        inline.push(`${key}=${value}`);
        continue;
      }

      params.push(key);
      values.push(value);
    }

    return {
      inline: inline.length ? ` const ${inline.join(',')};` : '',
      params: params.join(','),
      values,
    };
  }
}
