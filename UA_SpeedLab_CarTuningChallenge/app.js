/* ============================================================
   UA Speed Lab — DO NOT EDIT (competition fairness)
   ------------------------------------------------------------
   Reads setup from window.SPEED_LAB_TUNING in config.js
   Physics: simple force model + Euler integration.
   ============================================================ */

(() => {
  'use strict';

  const T = window.SPEED_LAB_TUNING;
  if (!T) {
    alert("Missing SPEED_LAB_TUNING. Make sure config.js is loaded before app.js");
    return;
  }

  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const fmt = (x, d=2) => (Number.isFinite(x) ? x.toFixed(d) : "—");
  const $ = (id) => document.getElementById(id);

  const startBtn = $("startBtn");
  const resetBtn = $("resetBtn");
  const statusText = $("statusText");
  const timeVal = $("timeVal");
  const speedVal = $("speedVal");
  const distVal = $("distVal");
  const bestVal = $("bestVal");
  const trackMeta = $("trackMeta");

  const carEl = $("car");
  const spoilerEl = $("carSpoiler");
  const countdownEl = $("countdown");
  const bannerEl = $("banner");
  const muBar = $("muBar");
  const dragBar = $("dragBar");

  const rulesDialog = $("rulesDialog");
  $("showRulesBtn").addEventListener("click", () => rulesDialog.showModal());
  $("closeRulesBtn").addEventListener("click", () => rulesDialog.close());

  const unlocked = new URLSearchParams(location.search).get("unlock") === "1";

  function getSetup() {
    const s = T.setup;
    const tires = T.parts.tires[s.tires];
    const spoiler = T.parts.spoiler[s.spoiler];
    const surface = T.parts.surface[s.surface];
    const grade = T.parts.grade[s.grade];

    if (!tires || !spoiler || !surface || !grade) {
      throw new Error("Invalid setup option in config.js. Check tires/spoiler/surface/grade values.");
    }

    const totalMass = T.baseCar.massKg + 4*tires.massKg + spoiler.massKg;
    return { tires, spoiler, surface, grade, totalMass };
  }

  const TRACK_LEN = T.track.lengthM;
  const START_X = 26;
  const END_X_PAD = 26;
  let trackPx = 1;

  let running = false;
  let finished = false;
  let tSec = 0;
  let v = 0;
  let x = 0;
  let lastTs = 0;

  const bestKey = "ua_speedlab_best_s";
  const loadBest = () => {
    const n = Number(localStorage.getItem(bestKey));
    return Number.isFinite(n) && n > 0 ? n : null;
  };
  const saveBest = (val) => localStorage.setItem(bestKey, String(val));

  function setStatus(text, ok=true){
    statusText.textContent = text;
    const dot = document.querySelector(".dot");
    dot.style.background = ok ? "rgba(0,255,160,.9)" : "rgba(255,45,85,.9)";
    dot.style.boxShadow = ok ? "0 0 0 6px rgba(0,255,160,.10)" : "0 0 0 6px rgba(255,45,85,.12)";
  }

  function setCarPos(xMeters){
    const pct = clamp(xMeters / TRACK_LEN, 0, 1);
    const px = START_X + pct * trackPx;
    carEl.style.transform = `translateX(${px}px)`;
  }

  function resetRace(){
    running = false; finished = false;
    tSec = 0; v = 0; x = 0; lastTs = 0;
    timeVal.textContent = "—";
    speedVal.textContent = "—";
    distVal.textContent = "—";
    bannerEl.classList.remove("show");
    countdownEl.classList.remove("show");
    carEl.style.filter = "none";
    setCarPos(0);
    setStatus("Ready");
    startBtn.disabled = false;
  }

  function updateMeta(setup){
    trackMeta.textContent =
      `${T.track.lengthM} m · ${T.setup.grade} · ${T.setup.surface} · ${T.setup.tires} tires · ${T.setup.spoiler} spoiler`;
  }

  function updateBars(setup){
    muBar.style.width = `${clamp(setup.surface.mu / 1.1, 0, 1) * 100}%`;
    dragBar.style.width = `${clamp(setup.spoiler.dragCdA / 0.12, 0, 1) * 100}%`;
  }

  function paintConfig(setup){
    const grid = $("configGrid");
    grid.innerHTML = "";
    const items = [
      ["Tires", T.setup.tires],
      ["Spoiler", T.setup.spoiler],
      ["Surface", T.setup.surface],
      ["Grade", `${T.setup.grade} (${setup.grade.pct.toFixed(1)}%)`],
      ["Mass", `${setup.totalMass.toFixed(1)} kg`],
      ["Engine power", `${T.tuning.enginePowerKW.toFixed(0)} kW`],
      ["Max drive force", `${T.tuning.maxDriveForceN.toFixed(0)} N`],
      ["Tire grip", setup.tires.grip.toFixed(2)],
      ["Surface μ", setup.surface.mu.toFixed(2)],
      ["Roll Crr", (setup.tires.rollCrr * setup.surface.rollMult).toFixed(3)],
      ["Aero drag (ΔCdA)", setup.spoiler.dragCdA.toFixed(2)],
      ["Downforce (ΔClA)", setup.spoiler.downforceClA.toFixed(2)],
    ];
    for (const [k, v] of items){
      const d = document.createElement("div");
      d.className = "config-item";
      d.innerHTML = `<div class="config-k">${k}</div><div class="config-v">${v}</div>`;
      grid.appendChild(d);
    }
  }

  async function countdown(seconds){
    countdownEl.classList.add("show");
    for (let s = seconds; s >= 1; s--){
      countdownEl.textContent = String(s);
      await new Promise(r => setTimeout(r, 850));
    }
    countdownEl.textContent = "GO!";
    await new Promise(r => setTimeout(r, 500));
    countdownEl.classList.remove("show");
    countdownEl.textContent = "";
  }

  function stepPhysics(dt, setup){
    const rho = T.baseCar.airDensity;
    const CdA = T.baseCar.baseCdA + setup.spoiler.dragCdA;
    const ClA = T.baseCar.baseClA + setup.spoiler.downforceClA;

    const mass = setup.totalMass;
    const g = 9.80665;

    const grade = setup.grade.pct / 100;
    const sin = grade; // small-angle approx
    const cos = Math.sqrt(1 - Math.min(0.2, grade*grade));

    const drag = 0.5 * rho * CdA * v * v;
    const downforce = 0.5 * rho * ClA * v * v;

    const normal = mass * g * cos + downforce;

    const Crr = setup.tires.rollCrr * setup.surface.rollMult;
    const rolling = Crr * normal;

    const slope = mass * g * sin;

    const powerW = T.tuning.enginePowerKW * 1000;
    const maxDriveForce = T.tuning.maxDriveForceN;

    const vFloor = 2.0;
    let drive = powerW / Math.max(v, vFloor);

    const baseRadius = 0.32;
    drive *= (baseRadius / setup.tires.radiusM);

    drive = Math.min(drive, maxDriveForce);

    const tractionLimit = setup.tires.grip * setup.surface.mu * normal;
    drive = Math.min(drive, tractionLimit);

    const net = drive - drag - rolling - slope;
    const a = net / mass;

    v = Math.max(0, v + a * dt);
    x = x + v * dt;
    return a;
  }

  function showBanner(title, subtitle){
    bannerEl.innerHTML = `<div><strong>${title}</strong><div class="muted">${subtitle}</div></div><div class="muted">Edit config.js to improve</div>`;
    bannerEl.classList.add("show");
  }

  function onFinish(timeS, setup){
    setStatus("Finished", true);
    startBtn.disabled = false;
    carEl.style.filter = "drop-shadow(0 20px 55px rgba(0,190,255,.25))";
    showBanner(`Finished: ${timeS.toFixed(3)} s`, `Surface μ=${setup.surface.mu.toFixed(2)} · Tires grip=${setup.tires.grip.toFixed(2)} · Spoiler=${T.setup.spoiler}`);

    const best = loadBest();
    if (!best || timeS < best) saveBest(timeS);
    const newBest = loadBest();
    bestVal.textContent = newBest ? newBest.toFixed(3) : "—";
  }

  function tick(ts, setup){
    if (!running) return;
    if (!lastTs) lastTs = ts;

    const rawDt = (ts - lastTs) / 1000;
    lastTs = ts;
    const dt = clamp(rawDt, 0.0, 0.03);

    stepPhysics(dt, setup);
    tSec += dt;

    setCarPos(x);
    timeVal.textContent = fmt(tSec, 3);
    speedVal.textContent = fmt(v, 2);
    distVal.textContent = fmt(Math.min(x, TRACK_LEN), 1);

    if (x >= TRACK_LEN && !finished){
      finished = true;
      running = false;
      onFinish(tSec, setup);
      return;
    }
    requestAnimationFrame((t) => tick(t, setup));
  }

  async function startRace(){
    resetRace();

    let setup;
    try{ setup = getSetup(); }
    catch(err){
      setStatus("Config error", false);
      alert(String(err.message || err));
      return;
    }

    updateMeta(setup);
    updateBars(setup);
    paintConfig(setup);

    spoilerEl.className = "car-spoiler";
    if (T.setup.spoiler !== "None"){
      spoilerEl.classList.add("on");
      if (T.setup.spoiler === "Big") spoilerEl.classList.add("big");
    }

    const rect = document.querySelector(".track").getBoundingClientRect();
    trackPx = Math.max(20, rect.width - (START_X + END_X_PAD) - 84);

    const best = loadBest();
    bestVal.textContent = best ? best.toFixed(3) : "—";

    setStatus("Countdown...");
    startBtn.disabled = true;
    await countdown(3);

    setStatus("Racing...");
    running = true;
    finished = false;
    tSec = 0; v = 0; x = 0; lastTs = 0;

    requestAnimationFrame((t) => tick(t, setup));
  }

  window.addEventListener("resize", () => {
    const rect = document.querySelector(".track").getBoundingClientRect();
    trackPx = Math.max(20, rect.width - (START_X + END_X_PAD) - 84);
    setCarPos(x);
  });

  function maybeEnableControls(){
    if (!unlocked) return;
    const grid = $("configGrid");
    const panel = document.createElement("div");
    panel.className = "config-item";
    panel.style.gridColumn = "1 / -1";
    panel.innerHTML = `
      <div class="config-k">Unlocked controls (testing only)</div>
      <div class="config-v" style="font-size:12px; font-weight:700; color: rgba(234,240,255,.85);">
        Change these, then click Reset. Your changes will not save to config.js.
      </div>
      <div style="display:grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap:8px; margin-top:10px;">
        <label class="miniCtl">Tires <select id="uiTires"></select></label>
        <label class="miniCtl">Spoiler <select id="uiSpoiler"></select></label>
        <label class="miniCtl">Surface <select id="uiSurface"></select></label>
        <label class="miniCtl">Grade <select id="uiGrade"></select></label>
      </div>
      <div style="display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:8px; margin-top:10px;">
        <label class="miniCtl">Engine kW <input id="uiPower" type="number" step="1" /></label>
        <label class="miniCtl">Max drive force (N) <input id="uiForce" type="number" step="50" /></label>
      </div>
    `;
    grid.prepend(panel);

    const fillSelect = (sel, opts, val) => {
      sel.innerHTML = "";
      for (const o of opts){
        const opt = document.createElement("option");
        opt.value = o; opt.textContent = o;
        if (o === val) opt.selected = true;
        sel.appendChild(opt);
      }
    };

    fillSelect($("uiTires"), Object.keys(T.parts.tires), T.setup.tires);
    fillSelect($("uiSpoiler"), Object.keys(T.parts.spoiler), T.setup.spoiler);
    fillSelect($("uiSurface"), Object.keys(T.parts.surface), T.setup.surface);
    fillSelect($("uiGrade"), Object.keys(T.parts.grade), T.setup.grade);

    $("uiPower").value = String(T.tuning.enginePowerKW);
    $("uiForce").value = String(T.tuning.maxDriveForceN);

    const apply = () => {
      T.setup.tires = $("uiTires").value;
      T.setup.spoiler = $("uiSpoiler").value;
      T.setup.surface = $("uiSurface").value;
      T.setup.grade = $("uiGrade").value;
      T.tuning.enginePowerKW = Number($("uiPower").value);
      T.tuning.maxDriveForceN = Number($("uiForce").value);

      resetRace();
      const setup = getSetup();
      updateMeta(setup);
      updateBars(setup);
      paintConfig(setup);

      spoilerEl.className = "car-spoiler";
      if (T.setup.spoiler !== "None"){
        spoilerEl.classList.add("on");
        if (T.setup.spoiler === "Big") spoilerEl.classList.add("big");
      }
      setStatus("Ready (unlocked)");
    };

    ["uiTires","uiSpoiler","uiSurface","uiGrade","uiPower","uiForce"].forEach(id => {
      $(id).addEventListener("change", apply);
      $(id).addEventListener("input", apply);
    });

    const s = document.createElement("style");
    s.textContent = `
      .miniCtl{ display:flex; flex-direction:column; gap:6px; font-size:12px; color: rgba(234,240,255,.75); }
      .miniCtl select, .miniCtl input{
        padding: 8px 10px;
        border-radius: 12px;
        border: 1px solid rgba(255,255,255,.12);
        background: rgba(0,0,0,.22);
        color: var(--text);
        outline: none;
      }
    `;
    document.head.appendChild(s);
  }

  startBtn.addEventListener("click", startRace);
  resetBtn.addEventListener("click", () => {
    resetRace();
    try{
      const setup = getSetup();
      updateMeta(setup);
      updateBars(setup);
      paintConfig(setup);
      maybeEnableControls();
    }catch{}
  });

  // Initial render
  resetRace();
  try{
    const setup = getSetup();
    updateMeta(setup);
    updateBars(setup);
    paintConfig(setup);
  }catch(err){
    setStatus("Config error", false);
  }
  maybeEnableControls();

})(); 
