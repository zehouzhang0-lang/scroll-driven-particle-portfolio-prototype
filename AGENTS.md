# Repository instructions

This repository is a privacy-safe review archive for a scroll-driven Three.js/WebGL portfolio homepage prototype.

## Authoritative boundaries

- Treat the project as `Prototype / Safe archive`, not a production website.
- The human owner states that this was an independent project and that Codex, Claude, and Gemini assisted development. Do not upgrade that statement beyond owner attestation without new evidence.
- AI tools were part of the development workflow. The page has no runtime LLM, Agent, RAG, or AI product feature.
- Use “author-designed 20D conceptual network” or “20D-inspired high-dimensional network.” Do not claim a mathematically proven 20-dimensional manifold unless an explicit dimensional definition and proof are added and reviewed.
- Do not claim production deployment, real users, stable FPS, broad device support, or conversion outcomes.

## Safety rules

- Never commit `node_modules/`, `.tmp-*`, local paths, credentials, personal contact data, or unscreened captures.
- Never commit raw Mixamo or other third-party 3D assets unless redistribution permission is documented in the repository.
- `assets/Running.fbx` is intentionally ignored. Keep the code path and asset instructions aligned.
- Preserve the evidence status vocabulary in `docs/evidence-and-claims.md`.
- Update `docs/archive-manifest.md` when adding or removing archive material.

## Key files

- `index.html`: integrated four-act prototype.
- `runner-model.js`: rigged-FBX surface sampling and animated particle binding.
- Three `*-lab.html` files: isolated transition experiments.
- `docs/teacher-review-guide.md`: quickest human review path.

## Validation before publishing changes

1. Run `npm ci`.
2. Run `node --check server.js`.
3. Start the local server and verify the HTML and JavaScript endpoints return successfully.
4. Run a text scan for credentials, email addresses, phone numbers, absolute local paths, and private data.
5. Inspect `git status` and confirm no binary 3D asset or dependency directory is staged.

Keep changes on a review branch and use a pull request for merges into the default branch.
