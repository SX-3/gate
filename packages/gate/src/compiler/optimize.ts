function minify(code: string): string {
  return code
    .replace(/\/\*[\s\S]*?\*\/|([^:]|^)\/\/.*$/gm, '$1')
    .replace(/^\s+|\s+$/gm, '')
    .replace(/\n/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s*([{}()[\]+\-=:,;])\s*/g, '$1');
}

export function optimize(code: string): string {
  return minify(code);
}
