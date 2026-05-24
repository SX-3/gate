import { describe, expect, it } from 'bun:test';
import { parse } from '../../src/compiler';
import { cuid, datetime, email, port, trim, url, uuid } from '../../src/constraints/formats';
import { GateError } from '../../src/error';
import { string } from '../../src/types/string';

describe('formats', () => {
  describe('email', () => {
    it('accepts valid email', () => {
      const p = parse(email(string()));
      expect(p('user@example.com')).toBe('user@example.com');
      expect(p('a@b.co')).toBe('a@b.co');
    });

    it('rejects invalid email', () => {
      const p = parse(email(string()));
      expect(() => p('not-email')).toThrow(GateError);
      expect(() => p('')).toThrow(GateError);
    });
  });

  describe('uuid', () => {
    it('accepts valid UUID', () => {
      const p = parse(uuid(string()));
      expect(p('123e4567-e89b-12d3-a456-426614174000')).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('rejects invalid UUID', () => {
      const p = parse(uuid(string()));
      expect(() => p('not-uuid')).toThrow(GateError);
    });
  });

  describe('url', () => {
    it('accepts valid URL', () => {
      const p = parse(url(string()));
      expect(p('https://example.com')).toBe('https://example.com');
      expect(p('http://a.b')).toBe('http://a.b');
    });

    it('rejects invalid URL', () => {
      const p = parse(url(string()));
      expect(() => p('not-url')).toThrow(GateError);
    });
  });

  describe('cuid', () => {
    it('accepts valid CUID', () => {
      const p = parse(cuid(string()));
      expect(p('ckopqwoqj000001l8h2l9a0v2')).toBe('ckopqwoqj000001l8h2l9a0v2');
    });

    it('rejects invalid CUID', () => {
      const p = parse(cuid(string()));
      expect(() => p('bad')).toThrow(GateError);
    });
  });

  describe('datetime', () => {
    it('accepts valid UTC datetime', () => {
      const p = parse(datetime(string));
      expect(p('2024-01-01T00:00:00Z')).toBe('2024-01-01T00:00:00Z');
      expect(p('2024-12-31T23:59:59.999Z')).toBe('2024-12-31T23:59:59.999Z');
    });

    it('rejects invalid datetime', () => {
      const p = parse(datetime(string()));
      expect(() => p('2024-01-01')).toThrow(GateError);
      expect(() => p('not-date')).toThrow(GateError);
    });
  });

  describe('trim', () => {
    const p = parse(trim(string));
    it('trims leading and trailing whitespace', () => {
      expect(p('  hello  ')).toBe('hello');
      expect(p('\t\n world \r')).toBe('world');
    });

    it('leaves strings without whitespace unchanged', () => {
      expect(p('hello')).toBe('hello');
    });
  });

  describe('port', () => {
    const p = parse(port);
    it('accepts valid port numbers', () => {
      expect(p(0)).toBe(0);
      expect(p(80)).toBe(80);
      expect(p(443)).toBe(443);
      expect(p(8080)).toBe(8080);
      expect(p(65535)).toBe(65535);
    });

    it('rejects non-integers', () => {
      expect(() => p(80.5)).toThrow(GateError);
    });

    it('rejects out-of-range numbers', () => {
      expect(() => p(-1)).toThrow(GateError);
      expect(() => p(65536)).toThrow(GateError);
    });
  });
});
