Build out this starter into a polished browser-based interactive 3D voxel demo inspired by **The Catholic University of Korea — Songsim Campus (성심교정)**.

Use the existing multi-agent setup in this repository.

## First read

- Read `AGENTS.md`
- Read `docs/codex/CAMPUS_NOTES.md`
- Inspect `src/data/campus.ts`
- Inspect the current world/interaction/ui file boundaries

## Multi-agent workflow requirements

Use parallel read-heavy agents first, then one writer at a time.

1. Spawn `explorer`
   - summarize the current architecture
   - identify the main render loop, scene composition, and file ownership boundaries

2. Spawn `layout_planner`
   - review whether the current landmark placement reads as Songsim Campus
   - suggest concrete layout improvements without editing code

3. Spawn `reviewer`
   - identify the top runtime, interaction, and polish risks in the current starter

4. After the three read-heavy reports return:
   - synthesize the findings
   - propose a short implementation plan
   - execute with exactly one write-focused agent at a time

## Write-agent rules

- Use `world_builder` for terrain, roads, buildings, labels, and props
- Use `interaction_builder` for camera, picking, HUD, and input
- Never have two write-capable agents edit the same file concurrently
- Keep edits small and verify after each logical step

## Product goal

The result should feel like:
- a stylized but recognizable Songsim campus
- portfolio-ready
- smooth to navigate
- better than a static render
- easy to keep extending

## Features to prioritize

Prioritize in this order unless exploration reveals a better sequence:

1. improve campus silhouette and landmark readability
2. improve path / hill readability
3. improve camera feel and reset behavior
4. improve building selection feedback and info panel
5. improve decorative dressing without clutter
6. add one extra “wow” feature, such as:
   - fly-to landmark camera
   - day/night toggle
   - minimap
   - guided campus route

## Validation

Before finishing:
- run build
- run tests
- summarize what changed by file
- note any remaining gaps or next recommended steps
