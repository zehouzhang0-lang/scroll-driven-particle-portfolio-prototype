# Design and interaction notes

This file is a privacy-safe rewrite of the local development brief. It records design intent, not independent user-research evidence.

## Four-act narrative

| Act | Visual state | Intended role |
|---|---|---|
| Runner | Particle figure following a rigged running animation | Personal introduction and visual anchor |
| Flow | Layered procedural particle bands | Skills, workflow and systems thinking |
| Chen–Lee | Chaotic-attractor trajectory | Work and complex-system imagery |
| 20D conceptual network | Layered particles and line connections projected into 3D | Final contact state and high-dimensional afterimage |

## Interaction decisions preserved in code

- The model reaches a stable state before the associated copy is revealed.
- Transition segments and stable segments are explicit rather than inferred from labels alone.
- Snap animations have bounded duration and can be cancelled by user input.
- The final line-density effect breathes without writing back into scroll progress.
- Diagnostic controls expose progress, speed, particle count, line density and internal state during iteration.

## Development path stated by the author

- An early procedural-skeleton runner was rejected because it read like a stick figure.
- The runner representation was replaced with animated FBX surface sampling.
- Three transition labs were developed separately and then integrated into a four-act page.
- Codex, Claude and Gemini were used as development assistants; final choices remained with the author.

These points are owner-authored process notes. The current archive has no original Git history or AI conversation export with which to independently reconstruct the full sequence.

## Open work

- Replace the third-party runner asset with a self-owned or clearly redistributable model.
- Separate the monolithic integrated file into maintainable modules.
- Add a production build, error fallback and deployable base path.
- Complete Work, Links and contact content.
- Test mobile performance, browsers, reduced-motion behavior and WebGL failure states.
- Document the 20D design dimensions and their code mapping in greater detail.
