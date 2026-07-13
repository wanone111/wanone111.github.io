import { createHash } from 'node:crypto';
import { lineNumberAt } from './files.mjs';

const RULES = [
  { id: 'private-key', pattern: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g },
  { id: 'github-token', pattern: /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/g },
  { id: 'aws-access-key', pattern: /\bAKIA[0-9A-Z]{16}\b/g },
  { id: 'credential-assignment', pattern: /\b(?:api[_-]?key|access[_-]?token|secret|password|passwd|pwd)\s*[:=]\s*["']?[^\s"'`]{8,}/gi },
  { id: 'windows-absolute-path', pattern: /\b[A-Za-z]:\\[^\r\n`"']+/g },
  { id: 'linux-home-path', pattern: /\/home\/[a-zA-Z0-9._-]+(?:\/[^\s`"']*)?/g },
  { id: 'email-address', pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi },
  { id: 'private-ip', pattern: /\b(?:10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2}|127\.0\.0\.1)\b/g },
];

function fingerprint(rule, value) {
  return createHash('sha256').update(`${rule}\0${value}`).digest('hex').slice(0, 16);
}

function allowed(rule, value, policy, hash) {
  if (policy.allowedFindingFingerprints.includes(hash)) return true;
  if (rule === 'email-address' && policy.allowedEmails.includes(value.toLowerCase())) return true;
  if (rule === 'private-ip' && policy.allowedPrivateIps.includes(value)) return true;
  if ((rule === 'windows-absolute-path' || rule === 'linux-home-path') && policy.allowedAbsolutePaths.includes(value)) return true;
  return false;
}

function masked(rule, value) {
  if (rule.includes('path')) return '[redacted absolute path]';
  if (rule === 'email-address') return value.replace(/^(.).+(@.+)$/, '$1***$2');
  if (rule === 'private-ip') return value.replace(/\.\d+$/, '.***');
  if (value.length <= 8) return '[redacted]';
  return `${value.slice(0, 3)}…${value.slice(-2)}`;
}

export function scanText(text, file, policy) {
  const findings = [];
  for (const rule of RULES) {
    rule.pattern.lastIndex = 0;
    for (const match of text.matchAll(rule.pattern)) {
      const value = match[0];
      const hash = fingerprint(rule.id, value);
      if (allowed(rule.id, value, policy, hash)) continue;
      findings.push({
        file,
        line: lineNumberAt(text, match.index ?? 0),
        rule: rule.id,
        preview: masked(rule.id, value),
        fingerprint: hash,
      });
    }
  }
  return findings;
}

export function scanNotes(notes, policy) {
  return notes.flatMap((note) => scanText(note.raw, note.relativePath, policy));
}

export function printSecurityFindings(findings) {
  console.error(`Sensitive-information scan blocked publishing (${findings.length}):`);
  for (const item of findings) {
    console.error(`- ${item.file}:${item.line} [${item.rule}] ${item.preview} (allowlist fingerprint: ${item.fingerprint})`);
  }
}
