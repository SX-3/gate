export const IS_BUN = typeof Bun !== 'undefined';

// ===== OPERATORS =====
export const EQ = IS_BUN ? '==' : '===';
export const NEQ = IS_BUN ? '!=' : '!==';
