/* ============================================================
   UA Speed Lab — TUNING CONFIG (students edit this file only)
   ------------------------------------------------------------
   Goal: finish the 100m track in the least time.

   ✅ Allowed edits (for the competition):
     - Select tires, spoiler, surface, and slope (grade)
     - Adjust a few tuning knobs (within reason)
   ❌ Not allowed:
     - Editing app.js (timer/physics) or cheating the time display
   ============================================================ */

window.SPEED_LAB_TUNING = {
  track: { lengthM: 100 },

  // Pick ONE option in each category:
  setup: {
    tires: "AllTerrain",        // "Eco" | "AllTerrain" | "Sport" | "Slick"
    spoiler: "Small",      // "None" | "Small" | "Big"
    surface: "Asphalt",    // "Asphalt" | "Concrete" | "Wet" | "Gravel"
    grade: "Downhill"          // "Downhill" | "Flat" | "Uphill"
  },

  // Optional fine-tuning knobs (students may adjust slightly)
  tuning: {
    enginePowerKW: 72,      // 40–110 recommended
    maxDriveForceN: 4800,   // 2500–8000 recommended
    brakeDragFactor: 1.00   // leave at 1.00 (teacher can lock/remove)
  },

  // Parts library
  parts: {
    tires: {
      Eco:        { grip: 0.88, rollCrr: 0.013, radiusM: 0.31, massKg: 7.5 },
      AllTerrain: { grip: 1.02, rollCrr: 0.018, radiusM: 0.33, massKg: 9.0 },
      Sport:      { grip: 1.12, rollCrr: 0.014, radiusM: 0.32, massKg: 8.3 },
      Slick:      { grip: 1.22, rollCrr: 0.012, radiusM: 0.31, massKg: 8.6 }
    },

    spoiler: {
      None:  { dragCdA: 0.00, downforceClA: 0.00, massKg: 0.0 },
      Small: { dragCdA: 0.06, downforceClA: 0.18, massKg: 3.2 },
      Big:   { dragCdA: 0.10, downforceClA: 0.28, massKg: 5.2 }
    },

    surface: {
      Asphalt:  { mu: 1.00, rollMult: 1.00 },
      Concrete: { mu: 0.96, rollMult: 0.98 },
      Wet:      { mu: 0.72, rollMult: 1.02 },
      Gravel:   { mu: 0.62, rollMult: 1.25 }
    },

    grade: {
      Downhill: { pct: -2.0 },
      Flat:     { pct:  0.0 },
      Uphill:   { pct:  2.0 }
    }
  },

  // Base car + aero
  baseCar: {
    massKg: 220,
    baseCdA: 0.42,
    baseClA: 0.00,
    airDensity: 1.225
  }
};
