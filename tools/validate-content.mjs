import { loadValidatedContent, printValidationErrors } from './lib/content.mjs';
import { loadWorkspace } from './lib/workspace.mjs';

const { paths } = await loadWorkspace();
const result = await loadValidatedContent(paths);

if (result.errors.length > 0) {
  printValidationErrors(result.errors);
  process.exit(1);
}

console.log(`Validated ${result.notes.length} source note(s); ${result.publishable.length} eligible for publishing.`);
