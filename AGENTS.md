# AGENTS.md

## Project goal

Build a polished browser-based interactive 3D voxel demo inspired by **The Catholic University of Korea — Songsim Campus (성심교정)**.

This repository is **not** trying to reproduce a survey-grade campus twin. The target is:

- stylized but recognizable
- recognizably uphill / terraced
- strong sense of the main campus walk
- playable and portfolio-friendly
- easy for Codex to extend safely

## Non-negotiable constraints

1. Keep the result **browser-first**.
2. Use **TypeScript + Three.js**.
3. Keep geometry mostly **code-generated**.
4. Preserve the main Songsim landmarks in `src/data/campus.ts`.
5. Prefer small, testable changes.
6. Do not replace the starter with an unrelated engine or framework.
7. Avoid large binary assets unless explicitly requested.

## Campus fidelity rules

Use the official Songsim campus tour / campus map as the semantic reference for landmark names and order.

The current starter intentionally uses:
- a lower-edge main gate
- an uphill academic spine
- a mid-campus green / sky-garden zone
- an upper-right sports-field zone

Treat this as a **recognizable interpretation**, not a precise GIS map.

## File ownership for multi-agent work

To avoid edit conflicts, keep write-heavy tasks split by file boundary:

- `src/data/campus.ts`
  - source-of-truth campus landmarks
  - add/remove landmarks carefully
- `src/world/terrain.ts`
  - terrain terraces, hill logic, sports-ground base
- `src/world/roads.ts`
  - roads, paths, stair/ramp-like connectors
- `src/world/buildings.ts`
  - building geometry and labels
- `src/world/decorations.ts`
  - trees, small props, random world dressing
- `src/interaction/cameraRig.ts`
  - camera modes and keyboard pan
- `src/ui/hud.ts`
  - overlay UI and info panel
- `src/scene/SongsimExperience.ts`
  - scene composition and runtime orchestration

Do **not** have multiple write-capable agents modify the same file at the same time.

## Multi-agent guidance

Parallel agents are best for:
- reading the codebase
- checking layout consistency
- reviewing camera behavior
- verifying prompt / docs quality

Use one writer at a time for:
- `src/world/buildings.ts`
- `src/world/terrain.ts`
- `src/scene/SongsimExperience.ts`

Preferred sequence:
1. Explorer agents gather evidence
2. Reviewer identifies real risks
3. One worker applies changes
4. Reviewer validates

## Visual direction

Aim for:
- clean voxel / blocky geometry
- soft daylight
- campus-like pathways
- enough realism to feel familiar
- enough stylization to look intentionally designed

Avoid:
- photorealism
- noisy textures
- ultra-dense meshes
- giant empty plazas with no focal points

## Validation before finishing

Always try to leave the repo in a state where these pass:

```bash
npm run build
npm run test
```

If you cannot run something, say exactly what you changed and what still needs validation.

## When adding features

Prefer these extensions:
- fly-to landmark camera
- hover outlines / better selection
- day/night and lighting presets
- minimap
- route playback
- building cards
- mobile interaction polish

Avoid gold-plating or large speculative refactors unless asked.
