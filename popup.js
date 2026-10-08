import { DEFAULTS, ORIGINS } from './lib.js';

const $ = id => document.getElementById(id);
const s = await chrome.storage.local.get(DEFAULTS);
chrome.storage.local.set({ unseen: 0 });
chrome.action.setBadgeText({ text: '' });

function render(eaten) {
  $('count').textContent = `먹은 탭 ${eaten.length}개`;
  $('empty').hidden = eaten.length > 0;
  $('list').replaceChildren(...eaten.map((e, i) => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.textContent = e.title || e.url;
    b.title = `${e.url}\n눌러서 되살리기`;
    b.onclick = async () => {
      // 비활성으로 먼저 열고 목록을 저장한 뒤 전환 → 팝업이 닫혀도 기록이 꼬이지 않는다
      const tab = await chrome.tabs.create({ url: e.url, active: false });
      eaten.splice(i, 1);
      await chrome.storage.local.set({ eaten });
      render(eaten);
      chrome.tabs.update(tab.id, { active: true });
    };
    li.append(b);
    return li;
  }));
}
render(s.eaten);

$('minutes').value = s.minutes;
$('minutes').onchange = e => {
  const m = Math.min(1440, Math.max(5, Math.round(+e.target.value) || DEFAULTS.minutes));
  e.target.value = m;
  chrome.storage.local.set({ minutes: m });
};

$('starve').checked = s.starve;
$('starve').onchange = e => chrome.storage.local.set({ starve: e.target.checked });

// 권한이 있으면 켜진 것 — 따로 저장하지 않는다
$('effect').checked = await chrome.permissions.contains(ORIGINS);
$('effect').onchange = async e => {
  if (!e.target.checked) return chrome.permissions.remove(ORIGINS);
  e.target.checked = await chrome.permissions.request(ORIGINS);
};
