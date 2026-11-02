import fc from 'fast-check';
import { expect, test } from 'vitest';
import { safeNextPath } from './safe-next-path';

test('어떤 값이 와도 같은 사이트 안의 경로만 돌려준다', () => {
  fc.assert(
    fc.property(fc.oneof(fc.string(), fc.webUrl(), fc.constant(null)), (next) => {
      const path = safeNextPath(next);
      expect(path.startsWith('/')).toBe(true);
      expect(path.startsWith('//')).toBe(false);
      expect(path).not.toContain(':');
      expect(path).not.toContain('\\');
    }),
  );
});

test.each([
  ['/subscribe', '/subscribe'],
  ['/billing?demo=past_due', '/billing?demo=past_due'],
  ['https://evil.example/steal', '/billing'],
  ['//evil.example', '/billing'],
  ['/\\evil.example', '/billing'],
  ['javascript:alert(1)', '/billing'],
  [null, '/billing'],
])('복귀 주소 %s는 %s로 이동한다', (next, expected) => {
  expect(safeNextPath(next)).toBe(expected);
});
