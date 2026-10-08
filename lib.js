export const DEFAULTS = { minutes: 60, starve: false, eaten: [], unseen: 0 };
export const ORIGINS = { origins: ['<all_urls>'] };

// 각 창의 현재 탭은 절대 안 먹으므로 창이 비는 일은 없다.
// Chrome 시작 전 기록은 시작 시점으로 본다 → 재시작 직후 대량 섭취 방지.
export function pickPrey(tabs, now, start, minutes) {
  return tabs.filter(t => !t.active && !t.pinned && !t.audible && !t.incognito
    && now - Math.max(t.lastAccessed ?? now, start) >= minutes * 60000);
}
