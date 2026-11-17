import { readFileSync } from 'node:fs';

import { checkProductionPlan } from './railway-plan-policy';

const path = process.argv[2];
if (!path) {
  throw new Error('Usage: vpx scripts/check-infra-plan.ts <saved-plan.json>');
}
let plan: unknown;
try {
  plan = JSON.parse(readFileSync(path, 'utf8'));
} catch {
  // JSON parser errors can quote secret values from the saved plan.
  throw new Error('Cannot read production plan as JSON. Generate a new saved plan.');
}
const count = checkProductionPlan(plan);
console.log(`Approved production infrastructure plan (${count} changes).`);
