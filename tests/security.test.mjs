import test from 'node:test';
import assert from 'node:assert/strict';
import { scanText } from '../tools/lib/security.mjs';

const policy = {
  allowedEmails: [],
  allowedPrivateIps: ['127.0.0.1'],
  allowedAbsolutePaths: [],
  allowedFindingFingerprints: [],
};

test('detects credentials and masks the preview', () => {
  const secret = 'password=super-secret-value';
  const findings = scanText(secret, 'note.md', policy);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].rule, 'credential-assignment');
  assert.equal(findings[0].preview.includes('super-secret-value'), false);
});

test('supports explicit safe-value allowlists', () => {
  assert.equal(scanText('Connect to 127.0.0.1.', 'note.md', policy).length, 0);
});

test('detects absolute local paths', () => {
  const findings = scanText('Open D:\\Users\\private-user\\file.txt', 'note.md', policy);
  assert.equal(findings[0].rule, 'windows-absolute-path');
  assert.equal(findings[0].preview, '[redacted absolute path]');
});
