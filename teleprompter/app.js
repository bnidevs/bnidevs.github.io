const $ = (id) => document.getElementById(id);

const inputText = $('inputText');
const startBtn = $('start');
const textDisplay = $('text-display');
const sizeSlider = $('sizeSlider');
const speedSlider = $('speedSlider');
const pauseBtn = $('pauseBtn');
const resetBtn = $('resetBtn');
const speedGroup = $('speedGroup');
const micGroup = $('micGroup');
const micDot = $('micDot');
const micLabel = $('micLabel');
const chromeWarning = $('chromeWarning');

const isChrome = /Chrome/.test(navigator.userAgent) && !/Edg|OPR/.test(navigator.userAgent);

let mode = 'fixed';
let scrollAnim = null;
let paused = false;
let scrollY = 0;
let recognition = null;
let wordIndex = 0;
let words = [];
let wordEls = [];
let activeHighlightFn = null; // current mode's highlight updater

// ─── SHARED SCROLL HELPERS ───

function applyScroll() {
  textDisplay.style.transform = `translateY(${scrollY}px)`;
  if (activeHighlightFn) activeHighlightFn();
}

function clampScroll() {
  const maxScroll = -(textDisplay.scrollHeight - window.innerHeight / 2);
  if (scrollY < maxScroll) scrollY = maxScroll;
  if (scrollY > 0) scrollY = 0;
}

// Wheel scroll — works in both modes
document.addEventListener('wheel', (e) => {
  if (!$('prompter').classList.contains('active')) return;
  e.preventDefault();
  scrollY -= e.deltaY;
  clampScroll();
  applyScroll();
}, { passive: false });

// Touch scroll — works in both modes
let touchStartY = null;
document.addEventListener('touchstart', (e) => {
  if (!$('prompter').classList.contains('active')) return;
  touchStartY = e.touches[0].clientY;
}, { passive: true });

document.addEventListener('touchmove', (e) => {
  if (!$('prompter').classList.contains('active') || touchStartY === null) return;
  e.preventDefault();
  const touchY = e.touches[0].clientY;
  const delta = touchY - touchStartY;
  touchStartY = touchY;
  scrollY += delta;
  clampScroll();
  applyScroll();
}, { passive: false });

document.addEventListener('touchend', () => {
  touchStartY = null;
});

// ─── SETUP ───

inputText.addEventListener('input', () => {
  startBtn.disabled = !inputText.value.trim();
});

document.querySelectorAll('input[name="mode"]').forEach((r) => {
  r.addEventListener('change', (e) => {
    mode = e.target.value;
    if (mode === 'audio' && !isChrome) {
      chromeWarning.style.display = 'block';
    } else {
      chromeWarning.style.display = 'none';
    }
  });
});

startBtn.addEventListener('click', () => {
  const raw = inputText.value.trim();
  if (!raw) return;

  $('setup').style.display = 'none';
  $('prompter').classList.add('active');

  if (mode === 'fixed') {
    startFixed(raw);
  } else {
    startAudio(raw);
  }
});

sizeSlider.addEventListener('input', () => {
  textDisplay.style.fontSize = sizeSlider.value + 'rem';
});

// ─── FIXED SCROLL ───

function startFixed(text) {
  speedGroup.style.display = 'flex';
  micGroup.style.display = 'none';

  // Build word-level spans inside line divs, preserving user newlines
  textDisplay.innerHTML = '';
  const lines = text.split('\n');
  const allSpans = [];

  lines.forEach((line, lineIdx) => {
    const div = document.createElement('div');
    div.className = 'line';
    const lineWords = line.split(/(\s+)/); // keep whitespace chunks
    if (lineWords.every((w) => w.trim() === '')) {
      div.innerHTML = '\u00A0';
    } else {
      lineWords.forEach((chunk) => {
        if (chunk.trim() === '') {
          div.appendChild(document.createTextNode(chunk));
        } else {
          const span = document.createElement('span');
          span.className = 'fw';
          span.textContent = chunk;
          div.appendChild(span);
          allSpans.push(span);
        }
      });
    }
    textDisplay.appendChild(div);
  });

  scrollY = 0;
  textDisplay.style.transform = 'translateY(0px)';
  paused = false;
  pauseBtn.textContent = 'Pause';

  activeHighlightFn = function updateActiveWords() {
    const center = window.innerHeight / 2;
    const tolerance = 4;
    allSpans.forEach((span) => {
      const rect = span.getBoundingClientRect();
      if (rect.top - tolerance <= center && rect.bottom + tolerance >= center) {
        span.classList.add('active');
      } else {
        span.classList.remove('active');
      }
    });
  };

  function tick() {
    if (!paused) {
      const speed = parseFloat(speedSlider.value);
      scrollY -= speed;
      clampScroll();
      applyScroll();
    }
    scrollAnim = requestAnimationFrame(tick);
  }
  scrollAnim = requestAnimationFrame(tick);
  applyScroll();
}

// ─── AUDIO SCROLL ───

function startAudio(text) {
  speedGroup.style.display = 'none';
  micGroup.style.display = 'flex';

  const rawLines = text.split('\n');
  words = [];
  wordEls = [];
  textDisplay.innerHTML = '';

  rawLines.forEach((line, lineIdx) => {
    const lineWords = line.split(/\s+/).filter((w) => w.length > 0);
    lineWords.forEach((w) => {
      const span = document.createElement('span');
      span.className = 'word upcoming';
      span.textContent = w + ' ';
      textDisplay.appendChild(span);
      words.push(w);
      wordEls.push(span);
    });
    if (lineIdx < rawLines.length - 1) {
      textDisplay.appendChild(document.createElement('br'));
    }
  });

  wordIndex = 0;
  scrollY = 0;
  textDisplay.style.transform = 'translateY(0px)';

  activeHighlightFn = highlightCurrent;
  highlightCurrent();

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    return;
  }

  recognition = new SR();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onresult = (e) => {
    if (paused) return;
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const transcript = e.results[i][0].transcript.toLowerCase().trim();
      const heard = transcript.split(/\s+/);
      for (const h of heard) {
        if (wordIndex < words.length) {
          const expected = normalize(words[wordIndex]);
          if (normalize(h) === expected || fuzzy(normalize(h), expected)) {
            advanceWord();
          }
        }
      }
    }
  };

  recognition.onerror = (e) => {
    if (e.error === 'no-speech' || e.error === 'aborted') return;
    console.warn('Recognition error:', e.error);
  };

  recognition.onend = () => {
    if (!paused && wordIndex < words.length) {
      try {
        recognition.start();
      } catch (e) {}
    }
  };

  try {
    recognition.start();
    micDot.classList.add('live');
    micLabel.textContent = 'Listening';
  } catch (e) {
    console.error(e);
  }
}

// ─── WORD MATCHING ───

function normalize(s) {
  return s.replace(/[^a-z0-9]/gi, '').toLowerCase();
}

function fuzzy(a, b) {
  if (!a || !b) return false;
  if (a.startsWith(b) || b.startsWith(a)) return true;
  if (Math.abs(a.length - b.length) > 2) return false;
  let diff = 0;
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  for (let i = 0; i < longer.length; i++) {
    if (shorter[i] !== longer[i]) diff++;
  }
  return diff <= 1;
}

// ─── WORD NAVIGATION ───

function advanceWord() {
  if (wordIndex < wordEls.length) {
    wordEls[wordIndex].className = 'word spoken';
  }
  wordIndex++;
  highlightCurrent();
  scrollToWord();
}

function highlightCurrent() {
  wordEls.forEach((el, i) => {
    if (i < wordIndex) el.className = 'word spoken';
    else if (i === wordIndex) el.className = 'word current';
    else el.className = 'word upcoming';
  });
}

function scrollToWord() {
  if (wordIndex >= wordEls.length) return;
  const el = wordEls[wordIndex];
  const rect = el.getBoundingClientRect();
  const center = window.innerHeight / 2;
  const offset = rect.top - center;
  scrollY -= offset;
  clampScroll();
  applyScroll();
}

// ─── CONTROLS ───

pauseBtn.addEventListener('click', () => {
  paused = !paused;
  pauseBtn.textContent = paused ? 'Resume' : 'Pause';

  if (mode === 'audio' && recognition) {
    if (paused) {
      recognition.stop();
      micDot.classList.remove('live');
      micLabel.textContent = 'Paused';
    } else {
      try {
        recognition.start();
      } catch (e) {}
      micDot.classList.add('live');
      micLabel.textContent = 'Listening';
    }
  }
});

resetBtn.addEventListener('click', () => {
  if (scrollAnim) cancelAnimationFrame(scrollAnim);
  if (recognition) {
    recognition.stop();
    recognition = null;
  }
  activeHighlightFn = null;
  $('prompter').classList.remove('active');
  $('setup').style.display = 'flex';
  textDisplay.innerHTML = '';
  textDisplay.style.transform = '';
  scrollY = 0;
  paused = false;
});

document.addEventListener('keydown', (e) => {
  if (!$('prompter').classList.contains('active')) return;
  if (e.code === 'Space') {
    e.preventDefault();
    pauseBtn.click();
  }
});
