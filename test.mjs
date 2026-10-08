import assert from 'node:assert';
import { pickPrey } from './lib.js';

const now = 100 * 3600_000, H = 3600_000;
const tab = (id, o) => ({ id, lastAccessed: now - 2 * H, ...o });
const tabs = [
  tab(1),
  tab(2, { active: true }),
  tab(3, { pinned: true }),
  tab(4, { audible: true }),
  tab(5, { incognito: true }),
  tab(6, { lastAccessed: now - 1000 }),
  tab(7, { lastAccessed: undefined }),
];
assert.deepEqual(pickPrey(tabs, now, 0, 60).map(t => t.id), [1]);
assert.deepEqual(pickPrey([tab(1)], now, now - 1000, 60), [], 'browser just started');
assert.deepEqual(pickPrey([tab(1)], now, 0, 180), [], 'not idle long enough');
console.log('ok');
