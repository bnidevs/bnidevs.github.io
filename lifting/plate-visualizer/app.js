(() => {
  "use strict";

  const PLATES = [
    { weight: 45, color: "#2563eb", label: "Blue",   height: 120 },
    { weight: 35, color: "#eab308", label: "Yellow", height: 104 },
    { weight: 25, color: "#16a34a", label: "Green",  height: 88  },
    { weight: 10, color: "#1c1c1c", label: "Black",  height: 64  },
  ];
  const BAR_WEIGHT = 45;
  const MAX_TOTAL = 1000;

  // ---- State ----
  let mode = "plates";
  let plateCounts = [0, 0, 0, 0];

  // ---- DOM refs ----
  const $total      = document.getElementById("total-number");
  const $svg        = document.getElementById("barbell-svg");
  const $legend     = document.getElementById("legend");
  const $platesPanel = document.getElementById("plates-panel");
  const $weightPanel = document.getElementById("weight-panel");
  const $weightInput = document.getElementById("weight-input");
  const $weightMsgs  = document.getElementById("weight-messages");
  const modeBtns     = document.querySelectorAll(".mode-btn");

  // ---- Solver ----
  function solvePlates(target) {
    if (target <= 0) return { plates: [0, 0, 0, 0], exact: target === 0, total: 0 };
    const maxA = Math.floor(target / 45);
    let best = null, bestDiff = Infinity;
    for (let a = 0; a <= maxA; a++) {
      const maxB = Math.floor((target - a * 45) / 35);
      for (let b = 0; b <= maxB; b++) {
        const maxC = Math.floor((target - a * 45 - b * 35) / 25);
        for (let c = 0; c <= maxC; c++) {
          const rem = target - a * 45 - b * 35 - c * 25;
          const dLow = Math.max(0, Math.floor(rem / 10));
          for (const d of [dLow, dLow + 1]) {
            const total = a * 45 + b * 35 + c * 25 + d * 10;
            const diff = Math.abs(total - target);
            const count = a + b + c + d;
            const bestCount = best ? best.plates.reduce((s, v) => s + v, 0) : Infinity;
            if (diff < bestDiff || (diff === bestDiff && count < bestCount)) {
              bestDiff = diff;
              best = { plates: [a, b, c, d], exact: diff === 0, total };
            }
          }
        }
      }
    }
    return best || { plates: [0, 0, 0, 0], exact: false, total: 0 };
  }

  // ---- Helpers ----
  function calcTotal(counts) {
    return BAR_WEIGHT + 2 * counts.reduce((s, c, i) => s + c * PLATES[i].weight, 0);
  }

  function canAdd(index) {
    return calcTotal(plateCounts) + 2 * PLATES[index].weight <= MAX_TOTAL;
  }

  function maxForPlate(index) {
    const otherWeight = plateCounts.reduce((s, c, i) => i === index ? s : s + c * PLATES[i].weight, 0);
    const budget = (MAX_TOTAL - BAR_WEIGHT) / 2 - otherWeight;
    return Math.max(0, Math.floor(budget / PLATES[index].weight));
  }

  // ---- SVG rendering ----
  const SVG_NS = "http://www.w3.org/2000/svg";
  const W = 700, H = 160, CX = 350, CY = 80;
  const BAR_HALF = 320, COLLAR_W = 10, COLLAR_START = 36;
  const PLATE_START = COLLAR_START + COLLAR_W;
  const PLATE_ZONE = BAR_HALF - PLATE_START - 8;

  function rect(x, y, w, h, rx, fill, stroke, sw) {
    const r = document.createElementNS(SVG_NS, "rect");
    r.setAttribute("x", x); r.setAttribute("y", y);
    r.setAttribute("width", w); r.setAttribute("height", h);
    r.setAttribute("rx", rx); r.setAttribute("fill", fill);
    if (stroke) { r.setAttribute("stroke", stroke); r.setAttribute("stroke-width", sw); }
    return r;
  }

  function drawBar(counts) {
    $svg.innerHTML = "";

    // static bar parts
    $svg.appendChild(rect(CX - BAR_HALF, CY - 5, BAR_HALF * 2, 10, 2, "#777"));
    $svg.appendChild(rect(CX - COLLAR_START - COLLAR_W, CY - 12, COLLAR_W, 24, 2, "#999"));
    $svg.appendChild(rect(CX + COLLAR_START, CY - 12, COLLAR_W, 24, 2, "#999"));
    $svg.appendChild(rect(CX - BAR_HALF, CY - 9, 6, 18, 2, "#555"));
    $svg.appendChild(rect(CX + BAR_HALF - 6, CY - 9, 6, 18, 2, "#555"));

    // build ordered plate list (heaviest first)
    const ordered = [];
    PLATES.forEach((p, i) => { for (let j = 0; j < counts[i]; j++) ordered.push(p); });

    if (!ordered.length) return;

    let pw = 14, pg = 3;
    const needed = ordered.length * (pw + pg);
    if (needed > PLATE_ZONE) {
      const ratio = PLATE_ZONE / needed;
      pw = Math.max(4, Math.floor(14 * ratio));
      pg = Math.max(1, Math.floor(3 * ratio));
    }

    const drawSide = (sign) => {
      let off = PLATE_START;
      ordered.forEach(p => {
        const x = sign === 1 ? CX + off : CX - off - pw;
        $svg.appendChild(rect(x, CY - p.height / 2, pw, p.height, 2, p.color, "rgba(255,255,255,0.12)", 0.5));
        off += pw + pg;
      });
    };
    drawSide(-1);
    drawSide(1);
  }

  function drawLegend(counts) {
    $legend.innerHTML = "";
    PLATES.forEach((p, i) => {
      if (counts[i] <= 0) return;
      const d = document.createElement("div");
      d.className = "legend-item";
      d.innerHTML = `<div class="legend-swatch" style="background:${p.color}"></div>${counts[i]}×${p.weight}`;
      $legend.appendChild(d);
    });
    const bar = document.createElement("div");
    bar.className = "legend-bar";
    bar.textContent = "bar: 45";
    $legend.appendChild(bar);
  }

  // ---- Plate rows ----
  const plateInputs = [];

  function buildPlateRows() {
    PLATES.forEach((plate, i) => {
      const row = document.createElement("div");
      row.className = "plate-row";

      const swatch = document.createElement("div");
      swatch.className = "plate-swatch" + (plate.color === "#1c1c1c" ? " black" : "");
      swatch.style.background = plate.color;

      const info = document.createElement("div");
      info.className = "plate-info";
      info.innerHTML = `<span class="plate-weight">${plate.weight} lbs</span><span class="plate-label">${plate.label}</span>`;

      const controls = document.createElement("div");
      controls.className = "plate-controls";

      const minus = document.createElement("button");
      minus.className = "adj-btn";
      minus.textContent = "−";
      minus.addEventListener("click", () => { setPlate(i, plateCounts[i] - 1); });

      const input = document.createElement("input");
      input.type = "number";
      input.className = "plate-count-input";
      input.min = 0;
      input.value = 0;
      input.addEventListener("input", () => {
        const raw = parseInt(input.value, 10);
        if (isNaN(raw) || raw < 0) return;
        setPlate(i, raw);
      });
      input.addEventListener("blur", () => {
        input.value = plateCounts[i];
      });
      plateInputs.push(input);

      const plus = document.createElement("button");
      plus.className = "adj-btn";
      plus.textContent = "+";
      plus.addEventListener("click", () => { setPlate(i, plateCounts[i] + 1); });

      controls.append(minus, input, plus);
      row.append(swatch, info, controls);
      $platesPanel.appendChild(row);
    });

    // summary
    const summary = document.createElement("div");
    summary.className = "summary-bar";
    summary.id = "plates-summary";
    $platesPanel.appendChild(summary);
  }

  function setPlate(index, value) {
    const clamped = Math.max(0, Math.min(value, maxForPlate(index)));
    plateCounts[index] = clamped;
    render();
  }

  // ---- Weight mode ----
  function solveWeight(val) {
    if (isNaN(val) || val < BAR_WEIGHT) return null;
    const clamped = Math.min(val, MAX_TOTAL);
    const perSide = (clamped - BAR_WEIGHT) / 2;
    const fl = Math.floor(perSide), cl = Math.ceil(perSide);
    if (fl === cl) {
      const r = solvePlates(fl);
      return { ...r, requested: val, actual: BAR_WEIGHT + 2 * r.total };
    }
    const a = solvePlates(fl), b = solvePlates(cl);
    const dA = Math.abs(BAR_WEIGHT + 2 * a.total - clamped);
    const dB = Math.abs(BAR_WEIGHT + 2 * b.total - clamped);
    const best = dA <= dB ? a : b;
    return { ...best, exact: false, requested: val, actual: BAR_WEIGHT + 2 * best.total };
  }

  // ---- Render ----
  function render() {
    let displayCounts, displayTotal;

    if (mode === "plates") {
      displayCounts = plateCounts;
      displayTotal = calcTotal(plateCounts);

      // update inputs & buttons
      const rows = $platesPanel.querySelectorAll(".plate-row");
      rows.forEach((row, i) => {
        const btns = row.querySelectorAll(".adj-btn");
        btns[0].disabled = plateCounts[i] === 0;
        btns[1].disabled = !canAdd(i);
        plateInputs[i].value = plateCounts[i];
      });

      const perSide = (displayTotal - BAR_WEIGHT) / 2;
      document.getElementById("plates-summary").innerHTML =
        `<span class="summary-left">Per side: ${perSide} lbs</span>` +
        `<span class="summary-right">Total: <strong>${displayTotal} lbs</strong></span>`;

    } else {
      const val = parseInt($weightInput.value, 10);
      const result = solveWeight(val);
      $weightMsgs.innerHTML = "";

      if (!$weightInput.value) {
        displayCounts = [0, 0, 0, 0];
        displayTotal = BAR_WEIGHT;
      } else if (val < BAR_WEIGHT) {
        displayCounts = [0, 0, 0, 0];
        displayTotal = BAR_WEIGHT;
        $weightMsgs.innerHTML = `<div class="msg-box err">Minimum weight is ${BAR_WEIGHT} lbs (empty bar)</div>`;
      } else if (val > MAX_TOTAL) {
        const r = solveWeight(MAX_TOTAL);
        displayCounts = r.plates;
        displayTotal = r.actual;
        $weightMsgs.innerHTML = `<div class="msg-box warn">Capped at ${MAX_TOTAL} lbs max</div>`;
        appendResult(r);
      } else if (result) {
        displayCounts = result.plates;
        displayTotal = result.actual;
        if (!result.exact) {
          const delta = result.actual - result.requested;
          $weightMsgs.innerHTML =
            `<div class="msg-box warn">Can't hit ${result.requested} lbs exactly. Closest: ${result.actual} lbs (${delta > 0 ? "+" : ""}${delta} lbs)</div>`;
        } else {
          $weightMsgs.innerHTML = `<div class="msg-box ok">✓ Exact match</div>`;
        }
        appendResult(result);
      } else {
        displayCounts = [0, 0, 0, 0];
        displayTotal = BAR_WEIGHT;
      }
    }

    $total.textContent = displayTotal;
    drawBar(displayCounts);
    drawLegend(displayCounts);
  }

  function appendResult(result) {
    const panel = document.createElement("div");
    panel.className = "result-panel";
    panel.innerHTML = `<div class="section-label" style="margin-bottom:10px">Per side</div>`;
    let any = false;
    PLATES.forEach((p, i) => {
      if (result.plates[i] <= 0) return;
      any = true;
      const row = document.createElement("div");
      row.className = "result-row";
      row.innerHTML =
        `<div class="result-swatch${p.color === '#1c1c1c' ? ' black' : ''}" style="background:${p.color}"></div>` +
        `<span class="result-name">${p.label} — ${p.weight} lbs</span>` +
        `<span class="result-count">×${result.plates[i]}</span>`;
      panel.appendChild(row);
    });
    if (!any) {
      const empty = document.createElement("div");
      empty.style.cssText = "color:#555;font-size:12px";
      empty.textContent = "Bar only — no plates needed";
      panel.appendChild(empty);
    }
    $weightMsgs.appendChild(panel);
  }

  // ---- Mode switching ----
  modeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      mode = btn.dataset.mode;
      modeBtns.forEach(b => b.classList.toggle("active", b === btn));
      $platesPanel.classList.toggle("hidden", mode !== "plates");
      $weightPanel.classList.toggle("hidden", mode !== "weight");
      render();
    });
  });

  $weightInput.addEventListener("input", render);

  // ---- Init ----
  buildPlateRows();
  render();
})();
