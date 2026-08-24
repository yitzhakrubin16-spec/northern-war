const API_URL = 'http://localhost:3001';
const MAP_VERSION = '6';

const startScreen = document.querySelector('#start');
const gameScreen = document.querySelector('#game');
const startForm = document.querySelector('#start-form');
const mapElement = document.querySelector('#map');
const roundElement = document.querySelector('#round');
const phaseTitle = document.querySelector('#phase-title');
const message = document.querySelector('#message');
const selection = document.querySelector('#selection');
const attackForm = document.querySelector('#attack-form');
const soldiersInput = document.querySelector('#soldiers');
const soldiersLabel = document.querySelector('#soldiers-label');
const attackButton = document.querySelector('#attack-button');
const endTurnButton = document.querySelector('#end-turn');
const battleReport = document.querySelector('#battle-report');

let game;
let selectedFrom = null;
let selectedTo = null;
let waiting = false;

async function request(path, options) {
  const response = await fetch(`${API_URL}${path}`, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || data.message || 'השרת לא הצליח להשלים את הבקשה');
  return data;
}

function gameFromResponse(data) {
  const result = data?.game?.territories ? data.game : data;
  if (!Array.isArray(result?.territories)) {
    throw new Error('השרת לא החזיר מצב משחק תקין. יש להפעיל מחדש את השרת המעודכן.');
  }
  return result;
}

function territory(id) {
  return game.territories.find((item) => item.id === id);
}

function drawMap() {
  if (!Array.isArray(game?.territories)) return;
  mapElement.innerHTML = '';
  for (const item of game.territories) {
    const button = document.createElement('button');
    button.className = `territory ${item.owner}`;
    button.style.left = `${item.x}%`;
    button.style.top = `${item.y}%`;
    if (item.id === selectedFrom) button.classList.add('selected');
    if (selectedFrom && game.phase === 'attack' && territory(selectedFrom).neighbors.includes(item.id) && item.owner === 'computer') {
      button.classList.add('available');
    }
    if (selectedFrom && game.phase === 'move' && item.owner === 'player'
      && territory(selectedFrom).neighbors.includes(item.id)) {
      button.classList.add('available');
    }
    button.innerHTML = `${item.headquarters ? '<span class="hq">♜</span>' : ''}<span class="territory-name">${item.name}</span><span class="army">${item.soldiers}</span>`;
    button.disabled = waiting || game.status === 'finished';
    button.addEventListener('click', () => chooseTerritory(item));
    mapElement.append(button);
  }
}

function drawGame() {
  startScreen.hidden = true;
  gameScreen.hidden = false;
  roundElement.textContent = `סיבוב ${game.round}`;
  message.textContent = game.message;
  const phaseTitles = { reinforce: 'חיזוק הכוחות', attack: 'בחירת תקיפה', move: 'העברת כוחות' };
  phaseTitle.textContent = phaseTitles[game.phase];
  endTurnButton.hidden = game.phase === 'reinforce' || game.status === 'finished';
  endTurnButton.textContent = game.phase === 'attack' ? 'דלג על התקיפה' : 'דלג על ההעברה וסיים תור';

  if (game.status === 'finished') {
    phaseTitle.textContent = game.winner === 'player' ? 'ניצחת במערכה!' : 'המחשב כבש את המפקדה';
    selection.textContent = 'אפשר לפתוח משחק חדש מהתפריט העליון.';
    attackForm.hidden = true;
  } else if (game.phase === 'reinforce') {
    selection.textContent = 'לחץ על אחת הטריטוריות הכחולות כדי להוסיף לה 3 חיילים.';
    attackForm.hidden = true;
  } else if (game.phase === 'attack' && !selectedFrom) {
    selection.textContent = 'בחר טריטוריה כחולה שממנה תרצה לתקוף.';
    attackForm.hidden = true;
  } else if (game.phase === 'move' && !selectedFrom) {
    selection.textContent = 'בחר טריטוריית מקור כחולה. ניתן להעביר פעם אחת בכל תור.';
    attackForm.hidden = true;
  }
  drawMap();
}

async function action(path, body = {}) {
  waiting = true;
  drawMap();
  try {
    const data = await request(`/games/${game.id}/${path}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    game = gameFromResponse(data);
    showEvents(data.playerEvent, data.computerEvents);
    selectedFrom = null;
    selectedTo = null;
    attackForm.hidden = true;
    localStorage.setItem('conquestGameId', game.id);
  } catch (error) {
    alert(error.message);
  } finally {
    waiting = false;
    drawGame();
  }
}

function chooseTerritory(item) {
  if (game.phase === 'reinforce') {
    if (item.owner === 'player') action('reinforce', { territoryId: item.id });
    return;
  }

  if (game.phase === 'move') {
    if (item.owner !== 'player') return;
    if (!selectedFrom) {
      if (item.soldiers < 2) return;
      selectedFrom = item.id;
      selection.textContent = `מקור: ${item.name}. בחר טריטוריה כחולה שכנה.`;
      attackForm.hidden = true;
    } else if (item.id === selectedFrom) {
      selectedFrom = null;
      selectedTo = null;
      selection.textContent = 'בחר טריטוריית מקור כחולה.';
      attackForm.hidden = true;
    } else if (territory(selectedFrom).neighbors.includes(item.id)) {
      selectedTo = item.id;
      const max = territory(selectedFrom).soldiers - 1;
      soldiersInput.max = max;
      soldiersInput.value = max;
      soldiersLabel.textContent = 'כמה חיילים להעביר?';
      attackButton.textContent = 'העברת כוחות';
      selection.textContent = `${territory(selectedFrom).name} ← ${item.name}`;
      attackForm.hidden = false;
    }
  } else if (item.owner === 'player') {
    selectedFrom = item.id;
    selectedTo = null;
    selection.textContent = `מקור: ${item.name}. עכשיו בחר טריטוריה אדומה שכנה.`;
    attackForm.hidden = true;
  } else if (selectedFrom && territory(selectedFrom).neighbors.includes(item.id)) {
    selectedTo = item.id;
    const max = territory(selectedFrom).soldiers - 1;
    soldiersInput.max = max;
    soldiersInput.value = max;
    soldiersLabel.textContent = 'כמה חיילים לשלוח?';
    attackButton.textContent = 'תקיפה';
    selection.textContent = `${territory(selectedFrom).name} ← ${item.name}`;
    attackForm.hidden = false;
  }
  drawMap();
}

function eventText(event, computer = false) {
  if (!event) return '';
  if (event.type === 'reinforce') return `${computer ? 'המחשב' : 'אתה'} חיזק את ${territory(event.territoryId).name} ב־${event.soldiersAdded}.`;
  if (event.type === 'move') return `${computer ? 'המחשב' : 'אתה'} העביר ${event.soldiers} חיילים מ־${territory(event.fromId).name} אל ${territory(event.toId).name}.`;
  return `${computer ? 'המחשב' : 'אתה'} תקף את ${territory(event.toId).name} עם ${event.soldiers} חיילים — ${event.winner === (computer ? 'computer' : 'player') ? 'וניצח' : 'והפסיד'}.`;
}

function showEvents(playerEvent, computerEvents = []) {
  const lines = [eventText(playerEvent), ...computerEvents.map((event) => eventText(event, true))].filter(Boolean);
  battleReport.innerHTML = lines.map((line) => `<div>${line}</div>`).join('');
}

startForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const data = await request('/games', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerName: document.querySelector('#player-name').value }),
    });
    game = gameFromResponse(data);
    localStorage.setItem('conquestGameId', game.id);
    drawGame();
  } catch (error) { alert(error.message); }
});

attackButton.addEventListener('click', () => action(game.phase === 'move' ? 'move' : 'attack', {
  fromId: selectedFrom,
  toId: selectedTo,
  soldiers: Number(soldiersInput.value),
}));
endTurnButton.addEventListener('click', () => {
  if (game.phase === 'attack') action('attack', { skip: true });
  else action('end-turn');
});
document.querySelector('#new-game').addEventListener('click', () => {
  localStorage.removeItem('conquestGameId');
  location.reload();
});

async function loadGame() {
  if (localStorage.getItem('conquestMapVersion') !== MAP_VERSION) {
    localStorage.removeItem('conquestGameId');
    localStorage.setItem('conquestMapVersion', MAP_VERSION);
  }
  const id = localStorage.getItem('conquestGameId');
  if (!id) return;
  try {
    game = gameFromResponse(await request(`/games/${id}`));
    drawGame();
  } catch (error) {
    localStorage.removeItem('conquestGameId');
    alert(error.message);
  }
}

loadGame();
window.addEventListener('resize', () => {
  if (game) drawMap();
});