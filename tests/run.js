// Command-line test runner.
//   macOS (no installs needed):  /System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc -m tests/run.js
//   Node 18+:                    node tests/run.js
import { run } from './harness.js';
import './chem.test.js';
import './chem2.test.js';
import './state.test.js';
import './quiz.test.js';
import './content.test.js';
import './app.test.js';

const result = await run();
if (result.fail) {
  if (typeof process !== 'undefined') process.exit(1);
  else throw new Error(`${result.fail} test(s) failed`);
}
