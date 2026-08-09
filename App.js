/* ===== BUG NINJA - MAIN APP ===== */

// ===== STATE =====
const state = {
    player: '',
    screen: 'login',
    calibration: { active: false, capturing: false, samples: [], profile: null, captureStart: 0 },
    game: { active: false, mode: 'free', score: 0, bugs: 0, combo: 0, maxCombo: 0, lives: 3, startTime: null, endTime: null, lastZapTime: 0, comboTimer: null, timerInterval: null, bugTypes: {}, zaps: [], misses: 0, micActive: true, voiceListening: false },
    settings: { sensitivity: 5, sfx: true, haptic: true, voice: true, animIntensity: 'medium' },
    audio: { context: null, analyser: null, microphone: null, dataArray: null, bufferLength: 0, source: null, vizCanvas: null, vizCtx: null, calCanvas: null, calCtx: null },
    recognition: null,
    particles: [],
    slashes: [],
    screenShake: 0,
    animFrame: null
};

// ===== CONSTANTS =====
const COMBO_TIMEOUT = 2000;
const ZAP_DEBOUNCE = 350;
const CALIBRATION_SAMPLES = 5;
const SAMPLE_DURATION = 400;
const FREQUENCY_BINS = 64;

const RANKS = [
    { score: 0, title: 'Novice Hunter', color: '#888' },
    { score: 50, title: 'Bug Hunter', color: '#00ffaa' },
    { score: 150, title: 'Exterminator', color: '#00ccff' },
    { score: 300, title: 'Slayer', color: '#ff66ff' },
    { score: 500, title: 'Ninja', color: '#ffcc00' },
    { score: 1000, title: 'Bug Shinobi', color: '#ff0055' },
    { score: 2000, title: 'Legend', color: '#ff6600' }
];

const COMBO_ANNOUNCEMENTS = {
    2: 'Double Kill!', 3: 'Triple Kill!', 4: 'Quadra Kill!', 5: 'Rampage!',
    6: 'Dominating!', 8: 'Unstoppable!', 10: 'GODLIKE!', 15: 'BEYOND GODLIKE!'
};

const BUG_TYPES = {
    mosquito: { emoji: '🦟', points: 1, name: 'Mosquito' },
    fly: { emoji: '🪰', points: 2, name: 'Fly' },
    gnat: { emoji: '🦟', points: 1, name: 'Gnat' },
    moth: { emoji: '🦋', points: 3, name: 'Moth' },
    beetle: { emoji: '🪲', points: 4, name: 'Beetle' },
    wasp: { emoji: '🐝', points: 5, name: 'Wasp' },
    bug: { emoji: '🐛', points: 2, name: 'Bug' }
};

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    initUI();
    initAudioViz();
    initCalViz();
    requestAnimationFrame(gameLoop);
});

function loadData() {
    const saved = localStorage.getItem('bugNinjaData');
    if (saved) {
        const data = JSON.parse(saved);
        state.player = data.player || '';
        state.settings = { ...state.settings, ...data.settings };
        state.leaderboard = data.leaderboard || [];
        state.calibration.profile = data.calibrationProfile || null;
    }
    if (state.player) document.getElementById('player-name').value = state.player;
}

function saveData() {
    localStorage.setItem('bugNinjaData', JSON.stringify({
        player: state.player,
        settings: state.settings,
        leaderboard: state.leaderboard,
        calibrationProfile: state.calibration.profile
    }));
}

// ===== UI INIT =====
function initUI() {
    document.getElementById('start-btn').addEventListener('click', onLogin);
    document.getElementById('player-name').addEventListener('keypress', (e) => { if (e.key === 'Enter') onLogin(); });
    document.getElementById('cal-start-btn').addEventListener('click', startCalibration);
    document.getElementById('cal-done-btn').addEventListener('click', finishCalibration);
    document.getElementById('cal-skip-btn').addEventListener('click', skipCalibration);
    document.querySelectorAll('.mode-card').forEach(card => card.addEventListener('click', () => startGame(card.dataset.mode)));
    document.getElementById('recalibrate-btn').addEventListener('click', () => showScreen('calibration'));
    document.getElementById('leaderboard-btn').addEventListener('click', showLeaderboard);
    document.getElementById('settings-btn').addEventListener('click', () => showScreen('settings'));
    document.getElementById('mic-toggle').addEventListener('click', toggleMic);
    document.getElementById('voice-btn').addEventListener('click', toggleVoice);
    document.getElementById('end-game-btn').addEventListener('click', endGame);
    document.getElementById('play-again-btn').addEventListener('click', () => startGame(state.game.mode));
    document.getElementById('menu-return-btn').addEventListener('click', () => showScreen('menu'));
    document.querySelectorAll('.lb-tab').forEach(tab => tab.addEventListener('click', () => {
        document.querySelectorAll('.lb-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderLeaderboard(tab.dataset.tab);
    }));
    document.getElementById('sensitivity').addEventListener('input', (e) => {
        state.settings.sensitivity = parseInt(e.target.value);
        document.getElementById('sensitivity-val').textContent = e.target.value;
        saveData();
    });
    document.getElementById('sfx-toggle').addEventListener('click', () => toggleSetting('sfx', 'sfx-toggle'));
    document.getElementById('haptic-toggle').addEventListener('click', () => toggleSetting('haptic', 'haptic-toggle'));
    document.getElementById('voice-toggle').addEventListener('click', () => toggleSetting('voice', 'voice-toggle'));
    document.getElementById('anim-intensity').addEventListener('change', (e) => { state.settings.animIntensity = e.target.value; saveData(); });
    document.getElementById('clear-data-btn').addEventListener('click', clearAllData);
    document.querySelectorAll('.back-btn').forEach(btn => btn.addEventListener('click', () => showScreen(btn.dataset.target)));
    document.getElementById('sensitivity').value = state.settings.sensitivity;
    document.getElementById('sensitivity-val').textContent = state.settings.sensitivity;
    document.getElementById('anim-intensity').value = state.settings.animIntensity;
    updateToggleUI('sfx-toggle', state.settings.sfx);
    updateToggleUI('haptic-toggle', state.settings.haptic);
    updateToggleUI('voice-toggle', state.settings.voice);
}

function onLogin() {
    const name = document.getElementById('player-name').value.trim();
    if (!name) { shakeElement(document.getElementById('player-name')); return; }
    state.player = name;
    saveData();
    if (state.calibration.profile) showScreen('menu');
    else showScreen('calibration');
}

function showScreen(screenName) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenName + '-screen').classList.add('active');
    state.screen = screenName;
    if (screenName === 'menu') document.getElementById('menu-player-name').textContent = state.player;
}

function toggleSetting(key, id) { state.settings[key] = !state.settings[key]; updateToggleUI(id, state.settings[key]); saveData(); }
function updateToggleUI(id, active) { const btn = document.getElementById(id); if (active) btn.classList.add('active'); else btn.classList.remove('active'); }
function clearAllData() { if (confirm('Clear ALL data?')) { localStorage.removeItem('bugNinjaData'); location.reload(); } }
function shakeElement(el) { el.style.animation = 'none'; el.offsetHeight; el.style.animation = 'shake 0.4s ease'; setTimeout(() => el.style.animation = '', 400); }

// ===== AUDIO ENGINE =====
async function initAudio() {
    if (state.audio.context) return;
    try {
        state.audio.context = new (window.AudioContext || window.webkitAudioContext)();
        const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
        state.audio.microphone = stream;
        state.audio.source = state.audio.context.createMediaStreamSource(stream);
        state.audio.analyser = state.audio.context.createAnalyser();
        state.audio.analyser.fftSize = 2048;
        state.audio.analyser.smoothingTimeConstant = 0.3;
        state.audio.bufferLength = state.audio.analyser.frequencyBinCount;
        state.audio.dataArray = new Uint8Array(state.audio.bufferLength);
        state.audio.source.connect(state.audio.analyser);
    } catch (err) { alert('Microphone access required!'); }
}

function getAudioData() { if (!state.audio.analyser) return null; state.audio.analyser.getByteFrequencyData(state.audio.dataArray); return state.audio.dataArray; }
function getTimeDomainData() { if (!state.audio.analyser) return null; const arr = new Uint8Array(state.audio.bufferLength); state.audio.analyser.getByteTimeDomainData(arr); return arr; }

// ===== AUDIO VISUALIZATION =====
function initAudioViz() { const canvas = document.getElementById('audio-viz-canvas'); if (!canvas) return; state.audio.vizCanvas = canvas; state.audio.vizCtx = canvas.getContext('2d'); resizeCanvas(canvas); }
function initCalViz() { const canvas = document.getElementById('cal-waveform'); if (!canvas) return; state.audio.calCanvas = canvas; state.audio.calCtx = canvas.getContext('2d'); resizeCanvas(canvas); }
function resizeCanvas(canvas) { const rect = canvas.parentElement.getBoundingClientRect(); canvas.width = rect.width * window.devicePixelRatio; canvas.height = rect.height * window.devicePixelRatio; }

function drawAudioViz() {
    const canvas = state.audio.vizCanvas, ctx = state.audio.vizCtx;
    if (!canvas || !ctx || !state.audio.analyser) return;
    const data = getAudioData(); if (!data) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const barWidth = canvas.width / FREQUENCY_BINS, step = Math.floor(data.length / FREQUENCY_BINS);
    for (let i = 0; i < FREQUENCY_BINS; i++) {
        const value = data[i * step], percent = value / 255, barHeight = percent * canvas.height, x = i * barWidth, y = canvas.height - barHeight;
        const hue = 120 + (percent * 120);
        ctx.fillStyle = `hsla(${hue}, 100%, 50%, ${0.3 + percent * 0.7})`;
        ctx.fillRect(x, y, barWidth - 1, barHeight);
    }
}

function drawCalViz() {
    const canvas = state.audio.calCanvas, ctx = state.audio.calCtx;
    if (!canvas || !ctx || !state.audio.analyser) return;
    const data = getTimeDomainData(); if (!data) return;
    ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2; ctx.strokeStyle = state.calibration.capturing ? '#ff0055' : '#00ffaa'; ctx.beginPath();
    const sliceWidth = canvas.width / data.length; let x = 0;
    for (let i = 0; i < data.length; i++) { const v = data[i] / 128.0, y = v * canvas.height / 2; if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); x += sliceWidth; }
    ctx.stroke();
}

// ===== CALIBRATION =====
async function startCalibration() {
    await initAudio();
    state.calibration.active = true;
    state.calibration.samples = [];
    state.calibration.capturing = true;
    document.getElementById('cal-start-btn').classList.add('hidden');
    document.getElementById('cal-done-btn').classList.remove('hidden');
    document.getElementById('cal-status').textContent = 'LISTENING... ZAP NOW!';
    document.getElementById('cal-status').style.color = '#ff0055';
    document.querySelectorAll('.sample-slot').forEach(s => s.classList.remove('captured'));
    calibrateLoop();
}

function calibrateLoop() {
    if (!state.calibration.active || !state.calibration.capturing) return;
    const data = getAudioData();
    if (!data) { requestAnimationFrame(calibrateLoop); return; }
    const profile = analyzeAudio(data);
    const isZap = detectZapLike(data, profile);
    if (isZap && state.calibration.samples.length < CALIBRATION_SAMPLES) {
        const sample = captureSample(data);
        state.calibration.samples.push(sample);
        const slot = document.querySelector(`.sample-slot[data-index="${state.calibration.samples.length - 1}"]`);
        if (slot) slot.classList.add('captured');
        document.getElementById('cal-count').textContent = `${state.calibration.samples.length}/${CALIBRATION_SAMPLES}`;
        if (state.settings.haptic && navigator.vibrate) navigator.vibrate(50);
        if (state.calibration.samples.length >= CALIBRATION_SAMPLES) {
            state.calibration.capturing = false;
            buildCalibrationProfile();
            document.getElementById('cal-status').textContent = 'PROFILE BUILT!';
            document.getElementById('cal-status').style.color = '#00ffaa';
            document.getElementById('cal-count').textContent = 'READY';
        }
    }
    requestAnimationFrame(calibrateLoop);
}

function analyzeAudio(data) { let sum = 0, max = 0, maxIndex = 0; for (let i = 0; i < data.length; i++) { sum += data[i]; if (data[i] > max) { max = data[i]; maxIndex = i; } } return { avg: sum / data.length, max, maxIndex }; }
function detectZapLike(data, profile) { const threshold = 30 + (10 - state.settings.sensitivity) * 3; return profile.max > threshold && profile.avg > 10; }
function captureSample(data) { const bins = 32, step = Math.floor(data.length / bins), sample = []; for (let i = 0; i < bins; i++) sample.push(data[i * step]); return { fingerprint: sample, max: Math.max(...sample), avg: sample.reduce((a, b) => a + b, 0) / sample.length }; }

function buildCalibrationProfile() {
    const samples = state.calibration.samples, bins = 32, avgFingerprint = new Array(bins).fill(0);
    for (const sample of samples) for (let i = 0; i < bins; i++) avgFingerprint[i] += sample.fingerprint[i];
    for (let i = 0; i < bins; i++) avgFingerprint[i] /= samples.length;
    const maxVal = Math.max(...avgFingerprint), avgVal = avgFingerprint.reduce((a, b) => a + b, 0) / bins;
    state.calibration.profile = { fingerprint: avgFingerprint, max: maxVal, avg: avgVal, threshold: maxVal * 0.6, tolerance: 0.4 };
    saveData();
    const profileEl = document.getElementById('cal-profile');
    profileEl.innerHTML = `<div>Signature captured!</div><div>Peak: ${maxVal.toFixed(1)} | Avg: ${avgVal.toFixed(1)}</div>`;
    profileEl.classList.add('active');
}

function finishCalibration() { state.calibration.active = false; state.calibration.capturing = false; showScreen('menu'); }
function skipCalibration() { state.calibration.active = false; state.calibration.capturing = false; state.calibration.profile = { fingerprint: new Array(32).fill(50), max: 100, avg: 30, threshold: 60, tolerance: 0.5 }; saveData(); showScreen('menu'); }

// ===== ZAP DETECTION =====
function isZapDetected() {
    if (!state.audio.analyser || !state.calibration.profile || !state.game.micActive) return false;
    const data = getAudioData(); if (!data) return false;
    const now = Date.now(); if (now - state.game.lastZapTime < ZAP_DEBOUNCE) return false;
    const profile = state.calibration.profile, bins = 32, step = Math.floor(data.length / bins);
    let matchScore = 0, totalWeight = 0, currentMax = 0;
    for (let i = 0; i < bins; i++) {
        const val = data[i * step], expected = profile.fingerprint[i], weight = expected / profile.max;
        totalWeight += weight; matchScore += (1 - Math.abs(val - expected) / 255) * weight;
        if (val > currentMax) currentMax = val;
    }
    const normalizedScore = totalWeight > 0 ? matchScore / totalWeight : 0, sensitivityMultiplier = state.settings.sensitivity / 5, threshold = 0.35 / sensitivityMultiplier;
    const rawProfile = analyzeAudio(data), amplitudeThreshold = 25 + (10 - state.settings.sensitivity) * 2, amplitudeMatch = rawProfile.max > amplitudeThreshold && rawProfile.avg > 8;
    return (normalizedScore > threshold || amplitudeMatch) && currentMax > 20;
}

// ===== GAME =====
async function startGame(mode) {
    await initAudio();
    state.game = { active: true, mode: mode, score: 0, bugs: 0, combo: 0, maxCombo: 0, lives: mode === 'endurance' ? 3 : 99, startTime: Date.now(), endTime: null, lastZapTime: 0, comboTimer: null, timerInterval: null, bugTypes: {}, zaps: [], misses: 0, micActive: true, voiceListening: false };
    showScreen('game');
    updateHUD();
    document.getElementById('mode-badge').textContent = mode.toUpperCase().replace('-', ' ');
    if (mode === 'time') {
        state.game.endTime = state.game.startTime + 60000;
        state.game.timerInterval = setInterval(() => {
            const remaining = Math.max(0, state.game.endTime - Date.now());
            const secs = Math.floor(remaining / 1000), ms = Math.floor((remaining % 1000) / 10);
            document.getElementById('timer-display').textContent = `${secs.toString().padStart(2, '0')}:${ms.toString().padStart(2, '0')}`;
            if (remaining <= 0) endGame();
        }, 50);
    } else if (mode === 'endurance') {
        state.game.timerInterval = setInterval(() => {
            const elapsed = Date.now() - state.game.startTime;
            const mins = Math.floor(elapsed / 60000), secs = Math.floor((elapsed % 60000) / 1000);
            document.getElementById('timer-display').textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
        }, 1000);
    } else document.getElementById('timer-display').textContent = '--:--';
    listenForZaps();
}

function listenForZaps() { if (!state.game.active) return; if (isZapDetected()) onZapDetected(); requestAnimationFrame(listenForZaps); }

function onZapDetected() {
    const now = Date.now(); state.game.lastZapTime = now;
    const timeSinceLast = now - (state.game.zaps.length > 0 ? state.game.zaps[state.game.zaps.length - 1].time : 0);
    if (timeSinceLast < COMBO_TIMEOUT && state.game.zaps.length > 0) state.game.combo++; else state.game.combo = 1;
    if (state.game.combo > state.game.maxCombo) state.game.maxCombo = state.game.combo;
    const multiplier = Math.min(state.game.combo, 10), basePoints = 10, points = basePoints * multiplier;
    state.game.score += points; state.game.bugs++;
    state.game.zaps.push({ time: now, combo: state.game.combo, points });
    if (state.game.comboTimer) clearTimeout(state.game.comboTimer);
    state.game.comboTimer = setTimeout(() => { state.game.combo = 0; updateHUD(); }, COMBO_TIMEOUT);
    if (state.settings.haptic && navigator.vibrate) { const duration = Math.min(50 + state.game.combo * 10, 200); navigator.vibrate(duration); }
    triggerSplat(state.game.combo);
    const announceKey = Object.keys(COMBO_ANNOUNCEMENTS).map(Number).filter(k => state.game.combo >= k).pop();
    if (announceKey) showAnnouncer(COMBO_ANNOUNCEMENTS[announceKey]);
    if (state.game.combo >= 2) showComboPopup(`×${state.game.combo}`);
    if (state.settings.voice && state.game.combo <= 1) { showVoiceHint(); startVoiceListen(); }
    updateHUD();
}

function updateHUD() {
    document.getElementById('score-display').textContent = state.game.score;
    document.getElementById('combo-display').textContent = `×${Math.min(state.game.combo, 10)}`;
    document.getElementById('bug-count').textContent = state.game.bugs;
    if (state.game.mode === 'endurance') { const hearts = '♥'.repeat(state.game.lives) + '♡'.repeat(3 - state.game.lives); document.getElementById('lives-display').textContent = hearts; }
    else document.getElementById('lives-display').textContent = '∞';
}

function endGame() {
    if (!state.game.active) return;
    state.game.active = false; state.game.endTime = Date.now();
    if (state.game.timerInterval) { clearInterval(state.game.timerInterval); state.game.timerInterval = null; }
    if (state.game.comboTimer) { clearTimeout(state.game.comboTimer); state.game.comboTimer = null; }
    const entry = { player: state.player, score: state.game.score, bugs: state.game.bugs, maxCombo: state.game.maxCombo, mode: state.game.mode, date: new Date().toISOString(), bugTypes: state.game.bugTypes };
    state.leaderboard.push(entry); state.leaderboard.sort((a, b) => b.score - a.score); state.leaderboard = state.leaderboard.slice(0, 100);
    saveData(); showResults();
}

function showResults() {
    showScreen('results');
    const game = state.game, duration = (game.endTime - game.startTime) / 1000, accuracy = game.zaps.length > 0 ? 100 : 0;
    document.getElementById('result-score').textContent = game.score;
    document.getElementById('result-bugs').textContent = game.bugs;
    document.getElementById('result-combo').textContent = game.m
