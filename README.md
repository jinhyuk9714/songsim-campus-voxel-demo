# Songsim Campus Voxel Demo Starter

A browser-based interactive 3D voxel demo inspired by **The Catholic University of Korea — Songsim Campus (가톨릭대학교 성심교정)**.

This starter is intentionally **stylized, not survey-accurate**. The goal is a recognizable uphill campus composition that captures the main walk from the gate toward the academic core, library, pharmacy building, concert hall, and sports field.

## What is included

- Vite + TypeScript + Three.js starter
- Default isometric-style camera with orbit drag + wheel zoom
- Keyboard panning on `W/A/S/D`
- Toggle between **isometric** and **free** camera
- Procedural decorative trees and voxel-like landscape terraces
- Clickable buildings with info panel
- `AGENTS.md` and `.codex/` multi-agent config for Codex
- English + Korean Codex prompts in `docs/codex/`

## Key campus landmarks included in the starter

The starter includes a rough layout for the official campus-tour landmarks:

- 정문
- 김수환관 (K관)
- 스테파노 기숙사
- 안드레아 기숙사
- 마리아관 (M관)
- 니콜스관 (N관)
- 다솔관 (D관)
- 학생미래인재관 (B관)
- 하늘동산
- 미카엘관 (H관/T관)
- 베리타스관 / 중앙도서관 (L관)
- 정진석 추기경 약학관 (NP관)
- 콘서트홀 (CH관)
- 대운동장
- 예수성심성당 (C관)

## Run locally

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

Tests:

```bash
npm run test
```

## Controls

- Left drag: orbit
- Mouse wheel: zoom
- `W/A/S/D`: pan camera target
- `R`: reset camera
- Click building: show building details
- HUD buttons:
  - reset camera
  - toggle isometric/free camera
  - regenerate world decorations
  - toggle labels

## Project structure

```txt
src/
  data/
    campus.ts
  interaction/
    cameraRig.ts
  scene/
    SongsimExperience.ts
  ui/
    hud.ts
  world/
    buildings.ts
    decorations.ts
    roads.ts
    terrain.ts
docs/codex/
  MASTER_PROMPT.md
  MULTI_AGENT_PROMPT.md
  MULTI_AGENT_PROMPT.ko.md
.codex/
  config.toml
  agents/
```

## Design intent

- Keep the **main gate at the lower edge**
- Make the campus feel **uphill / terraced**
- Preserve the recognizable landmarks and route order from the official campus tour
- Prefer **clean code-generated geometry** over heavy external assets
- Make it easy for Codex to extend

## Suggested next steps

1. Make a stronger plaza around 김수환관
2. Refine the library/pharmacy/concert-hall ridge
3. Add a top-down minimap
4. Add building hover tooltips and camera fly-to
5. Add a “student mode” route between landmarks
6. Add a sunset / night toggle
7. Add stylized signage for building codes

## Notes for Codex

Open this repo root in Codex and start with:

- `docs/codex/MULTI_AGENT_PROMPT.md` for English
- `docs/codex/MULTI_AGENT_PROMPT.ko.md` for Korean

The repo already contains `.codex/config.toml`, role configs, and `AGENTS.md` so Codex can discover project-level guidance automatically.
