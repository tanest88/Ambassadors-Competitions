# UA Speed Lab — Car Tuning Challenge (UA Car Comp)

A browser-based “car tuning” competition built with plain **HTML, CSS, and JavaScript**. Students compete to finish a **100 m** track in the **least time** by editing **only** `config.js` (tires, spoiler, surface, grade, and a few tuning knobs).  

This project is intentionally split so the *UI + physics/timer engine* are stable and fair, while the *tuning* is where students experiment. The core physics/timing code is marked “DO NOT EDIT (competition fairness)”. 

---

## Project Files

* **`index.html`** — main page layout and UI elements (track, car, buttons, rules dialog) 
* **`styles.css`** — modern UA-themed styling + responsive layout 
* **`app.js`** — race logic, countdown, timer, physics step loop, UI updates, best-time storage (fairness code) 
* **`config.js`** — *student-editable* tuning configuration (parts + tuning knobs) 

---

## What You Need to Install

No Node.js, npm, or external libraries required. 

You only need:

* A modern browser (Chrome / Edge / Firefox)
* A code editor (VS Code recommended)
* Optional: **Live Server** extension in VS Code

---

## How to Run the Project

### Option 1: Open directly

1. Put these files in the same folder:

   * `index.html`
   * `styles.css`
   * `config.js`
   * `app.js`
2. Double-click `index.html` (or right-click → open in browser). 

### Option 2: VS Code + Live Server

1. Open the folder in VS Code
2. Open `index.html`
3. Click **Go Live** 

### Option 3: Simple local server with Python

From the project folder:

```bash
python -m http.server 8000
```

Then visit:

* `http://localhost:8000`

---

## Important Setup Note (Script Order)

In `index.html`, **`config.js` must load before `app.js`** because `app.js` reads `window.SPEED_LAB_TUNING` from `config.js`.  

The order must remain:

```html
<script src="config.js"></script>
<script src="app.js"></script>
```



---

## Competition Rules (Student Version)

✅ **Allowed edits:** `config.js` only

* Choose: `tires`, `spoiler`, `surface`, `grade`
* Adjust: `enginePowerKW`, `maxDriveForceN` (and typically leave `brakeDragFactor` alone unless instructed) 

❌ **Not allowed:** editing `app.js` (timer/physics) or changing displayed results. 

**Goal:** smallest finish time over **100 m**. 

---

## Teacher / Testing Mode (Optional)

Teachers can run the page with:

* `?unlock=1`

This enables temporary UI controls for experimenting (changes do **not** write back to `config.js`).  

Example:

* `index.html?unlock=1`

---

## How the Project Works (High-Level)

* `index.html` builds the interface and loads scripts 
* `styles.css` controls the look and responsive layout 
* `config.js` defines the “parts library” and selected setup options 
* `app.js`:

  * Reads the setup from `window.SPEED_LAB_TUNING`
  * Runs a countdown
  * Simulates motion with a simple force model + Euler integration
  * Updates time/speed/distance live
  * Saves best time in browser storage 

---

## What to Tune (What Each Choice Affects)

### Tires (`Eco`, `AllTerrain`, `Sport`, `Slick`)

Each tire defines:

* **grip** (traction potential)
* **rollCrr** (rolling resistance)
* **radiusM** (affects drive force scaling)
* **massKg** (affects total mass) 

### Spoiler (`None`, `Small`, `Big`)

Tradeoff:

* Adds **downforce** (better traction at speed)
* Adds **drag** (slower at high speed)
* Adds mass  

### Surface (`Asphalt`, `Concrete`, `Wet`, `Gravel`)

Controls:

* **μ friction** (traction multiplier)
* **rollMult** (rolling resistance multiplier) 

### Grade (`Downhill`, `Flat`, `Uphill`)

Controls slope percent (helps or hurts acceleration). 

### Tuning knobs

* **enginePowerKW** (recommended 40–110)
* **maxDriveForceN** (recommended 2500–8000)
* **brakeDragFactor** (usually leave at 1.00 unless teacher changes rules) 

---

## Troubleshooting

**I see “Missing SPEED_LAB_TUNING…”**

* `config.js` didn’t load, or script order is wrong. Ensure `config.js` is before `app.js`.  

**I get a “Config error / Invalid setup option”**

* One of your option strings doesn’t match the allowed keys in `config.js` (typo in tires/spoiler/surface/grade).  

**Styles look missing**

* Confirm `styles.css` is in the same folder and linked correctly in `index.html`.  

---

## Suggested Workflow for Students

1. Open `index.html` and confirm the UI loads.
2. Open `config.js`.
3. Change **one thing at a time** (e.g., tires first, then spoiler).
4. Save → refresh → race.
5. Track what changed and why (traction vs drag vs rolling resistance).
6. Submit final results by turning in **only** `config.js` (unless teacher says otherwise).  
