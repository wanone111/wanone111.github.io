import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLineEndings } from '../tools/lib/files.mjs';

test('normalizes generated text to LF across operating systems', () => {
  assert.equal(normalizeLineEndings('first\r\nsecond\rthird\n'), 'first\nsecond\nthird\n');
});
