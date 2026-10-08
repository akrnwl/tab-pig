import { DEFAULTS, ORIGINS, pickPrey } from './lib.js';

const MAX_EATEN = 50;
const icon = f => ({ 16: `art/png/${f}-16.png`, 32: `art/png/${f}-32.png` });
const cut = t => ((t ||= '이름 없는').length > 15 ? t.slice(0, 15) + '…' : t);

async function setup() {
  chrome.alarms.create('hunt', { periodInMinutes: 1 });
  chrome.action.setBadgeBackgroundColor({ color: '#B5546E' });
  const { unseen } = await chrome.storage.local.get(DEFAULTS);
  chrome.action.setBadgeText({ text: unseen ? String(unseen) : '' });
}
chrome.runtime.onInstalled.addListener(setup);
chrome.runtime.onStartup.addListener(setup);
chrome.alarms.onAlarm.addListener(hunt);

// storage.session은 브라우저를 껐다 켜면 비워진다 → 처음 읽는 순간이 곧 시작 시각
async function browserStart() {
  let { start } = await chrome.storage.session.get('start');
  if (!start) await chrome.storage.session.set({ start: (start = Date.now()) });
  return start;
}

async function hunt() {
  const s = await chrome.storage.local.get(DEFAULTS);
  if (s.starve) return;
  const prey = pickPrey(await chrome.tabs.query({}), Date.now(), await browserStart(), s.minutes);
  if (!prey.length) return;

  // 닫기 전에 먼저 저장 → 도중에 실패해도 되살릴 수 있다
  const eaten = [...prey.map(t => ({ url: t.url, title: t.title })), ...s.eaten].slice(0, MAX_EATEN);
  const unseen = s.unseen + prey.length;
  await chrome.storage.local.set({ eaten, unseen });
  await chrome.tabs.remove(prey.map(t => t.id)).catch(() => {}); // 그 사이 사용자가 직접 닫은 탭

  chrome.action.setBadgeText({ text: String(unseen) });
  ['chew1', 'chew2', 'chew1', 'chew2', 'chew1', 'chew2', 'idle']
    .forEach((f, i) => setTimeout(() => chrome.action.setIcon({ path: icon(f) }), i * 300));
  showOnPage(prey);
}

async function showOnPage(prey) {
  if (!(await chrome.permissions.contains(ORIGINS))) return;
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!tab) return;
  const text = prey.length > 1 ? `탭 ${prey.length}개 냠냠했어요` : `${cut(prey[0].title)} 탭 맛있게 먹었어요`;
  const frames = ['chew1', 'chew2'].map(f => chrome.runtime.getURL(`art/png/${f}-96.png`));
  chrome.scripting.executeScript({ target: { tabId: tab.id }, func: pigPopup, args: [text, frames] })
    .catch(() => {}); // chrome:// 같은 페이지는 주입 불가 → 아이콘 연출만
}

// 페이지 안에서 실행된다. 페이지 CSS와 섞이지 않게 shadow DOM, 클릭은 통과.
function pigPopup(text, frames) {
  const host = document.createElement('div');
  host.style.cssText = 'all:initial;position:fixed;top:16px;right:16px;z-index:2147483647;pointer-events:none';
  const root = host.attachShadow({ mode: 'closed' });
  root.innerHTML = `<style>
    div{display:flex;align-items:flex-start;gap:4px;font:14px/1.4 system-ui,sans-serif}
    p{margin:16px 0 0;padding:8px 12px;background:#fff;color:#3A2830;border:2px solid #B5546E;border-radius:12px;max-width:220px}
    img{image-rendering:pixelated}
  </style><div><p></p><img width="96" height="96" alt=""></div>`;
  root.querySelector('p').textContent = text; // 탭 제목은 신뢰할 수 없는 값 → textContent
  const img = root.querySelector('img');
  img.src = frames[0];
  let i = 0;
  const tick = matchMedia('(prefers-reduced-motion: reduce)').matches
    ? 0 : setInterval(() => (img.src = frames[++i % 2]), 250);
  document.documentElement.append(host);
  setTimeout(() => { clearInterval(tick); host.remove(); }, 3000);
}
