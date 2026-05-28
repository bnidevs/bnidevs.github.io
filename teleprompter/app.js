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

  // Build line elements preserving user newlines
  textDisplay.innerHTML = '';
  const lines = text.split('\n');
  const lineEls = lines.map((line) => {
    const div = document.createElement('div');
    div.className = 'line';
    div.textContent = line || '\u00A0'; // non-breaking space for empty lines
    textDisplay.appendChild(div);
    return div;
  });

  scrollY = 0;
  textDisplay.style.transform = 'translateY(0px)';
  paused = false;
  pauseBtn.textContent = 'Pause';

  function updateActiveLines() {
    const center = window.innerHeight / 2;
    lineEls.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const lineMid = rect.top + rect.height / 2;
      const distance = Math.abs(lineMid - center);
      if (distance < rect.height / 2 + 4) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });
  }

  function tick() {
    if (!paused) {
      const speed = parseFloat(speedSlider.value);
      scrollY -= speed;
      const maxScroll = -(textDisplay.scrollHeight - window.innerHeight / 2);
      if (scrollY < maxScroll) scrollY = maxScroll;
      textDisplay.style.transform = `translateY(${scrollY}px)`;
      updateActiveLines();
    }
    scrollAnim = requestAnimationFrame(tick);
  }
  scrollAnim = requestAnimationFrame(tick);
  updateActiveLines();
}

// ─── AUDIO SCROLL ───

function startAudio(text) {
  speedGroup.style.display = 'none';
  micGroup.style.display = 'flex';

  // Split into words while tracking line breaks
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
  textDisplay.style.transform = `translateY(${scrollY}px)`;
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
