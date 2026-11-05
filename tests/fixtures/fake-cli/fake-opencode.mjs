// Stands in for `opencode` in tests: answers --version, and for `run` logs what it was given (arguments,
// prompt) to $FAKE_LOG, then prints the JSONL events a real run would: the last text part is the answer,
// and every event carries the OpenCode session id a follow-up would resume. A prompt containing
// "SIGNED-OUT" fails the way OpenCode does when nobody is signed in.
import fs from 'node:fs';

const args = process.argv.slice(2);
if (args[0] === '--version') { console.log('opencode 0.0.0-test'); process.exit(0); }
let input = '';
process.stdin.on('data', (d) => { input += d; });
process.stdin.on('end', () => {
  fs.appendFileSync(process.env.FAKE_LOG, JSON.stringify({ args, input: input || args[args.length - 1] }) + '\n');
  const out = (ev) => console.log(JSON.stringify(ev));
  const message = args[args.length - 1] || '';
  if (message.includes('SIGNED-OUT')) {
    console.error('You are not signed in. Run `opencode auth login`.');
    process.exit(1);
  }
  out({ type: 'step_start', part: { type: 'step-start' }, sessionID: 'ses_test' });
  out({ type: 'tool_use', part: { type: 'tool', tool: 'bash', state: { input: { command: 'node floorplan/query.mjs find "refund"' } } }, sessionID: 'ses_test' });
  out({ type: 'text', part: { type: 'text', text: 'Let me check the refund route.' }, sessionID: 'ses_test' });
  out({ type: 'text', part: { type: 'text', text: JSON.stringify({
    title: 'Refunds', answer: 'Refunds go through [[f:shop-api/routes/orders.js]].',
    items: [{ id: 'f:shop-api/routes/orders.js', note: 'Holds the refund endpoint.' }], steps: [], followups: ['Who can ask for one?'],
  }) }, sessionID: 'ses_test' });
});
