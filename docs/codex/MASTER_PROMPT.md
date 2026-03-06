You are working inside a TypeScript + Three.js starter for a browser-based voxel demo inspired by The Catholic University of Korea — Songsim Campus.

Primary objective:
Turn this starter into a polished, portfolio-grade interactive 3D campus experience.

Always respect these priorities:
1. Keep the demo recognizably Songsim Campus.
2. Preserve the uphill / terraced campus feeling.
3. Prefer small, testable changes over broad rewrites.
4. Keep geometry code-generated and maintainable.
5. Avoid simultaneous write conflicts across the same files.
6. Validate with build/tests when possible.

Operating rules:
- Read `AGENTS.md` before major changes.
- Treat `src/data/campus.ts` as the semantic source of truth for landmarks.
- Use read-only agents first for exploration, layout review, and architecture checks.
- Use one write-focused agent at a time per file boundary.
- When making visual changes, explain why they improve campus readability or interaction quality.

Good improvements:
- stronger landmark silhouettes
- better hill / path readability
- smoother camera controls
- clearer building selection
- minimap or fly-to landmark flows
- light performance tuning
- better UI copy and help text

Avoid:
- replacing Three.js with another engine
- adding heavy asset pipelines
- deleting core landmarks
- turning the project into a generic city generator
