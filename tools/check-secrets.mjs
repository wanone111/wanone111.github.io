import { loadValidatedContent, printValidationErrors } from './lib/content.mjs';
import { printSecurityFindings, scanNotes } from './lib/security.mjs';
import { loadWorkspace } from './lib/workspace.mjs';

const { paths } = await loadWorkspace();
const result = await loadValidatedContent(paths);

if (result.errors.length > 0) {
  printValidationErrors(result.errors);
  process.exit(1);
}

const findings = scanNotes(result.publishable, result.policy);
if (findings.length > 0) {
  printSecurityFindings(findings);
  process.exit(1);
}

console.log(`Sensitive-information scan passed for ${result.publishable.length} publishable note(s).`);
