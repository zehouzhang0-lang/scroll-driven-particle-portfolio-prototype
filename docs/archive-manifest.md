# Safe archive manifest

Archive assembled on 2026-08-16 from a local development snapshot. The original development directory was not modified.

## Core source mapping

Hashes below identify the exact pre-packaging source files. `index.html`, `package*.json`, and `server.js` received small archive-only naming, entry-point, and preview-MIME edits after copying.

| Original file | Archive path | Original bytes | Original SHA-256 |
|---|---|---:|---|
| `homepage-assembly-lab.html` | `index.html` | 110,512 | `0E26E5F06D3C3BB1DB2461FCB448B7E7EF1710F1BC031AA22C9542AD506171D5` |
| `runner-model.js` | `runner-model.js` | 21,105 | `D9E4592A520A0F5C1A387FC5F344098BF5D0519637F73DD22B9AE0D99679C548` |
| `server.js` | `server.js` | 1,376 | `06716D360A24960F857928DD29AFD9D84A8DB70EDD5E1068EE3E57541420DE92` |
| `package.json` | `package.json` | 197 | `9ED3D40240F2D065289773E3220AFBA21F51377AC0D497484F8F56384780267B` |
| `package-lock.json` | `package-lock.json` | 538 | `2F0453073A5EB52B04D5500988223785F56B823F7488D44CB3658032923AB41F` |
| `scroll-morph-lab.html` | same | 25,854 | `A96DD1CCC54064A01EB78124968BF1B8FCE51541D6438810DA9627144C89F070` |
| `flow-chenlee-lab.html` | same | 45,281 | `8E6D6A4129FD007665C1D7F778F3DA14DDC01D9BAAF3679F8BD5CB6CA8149026` |
| `chenlee-manifold-lab.html` | same | 57,618 | `E1206673072C4BA2A7ACC3952FFC281560A67F2570C4A798E4EAF58B5595467A` |

## Selected visual evidence

Only six reviewed PNG files are kept under `screenshots/`. Their role and visible-debug caveats are documented in `screenshots/README.md`.

## Explicit exclusions

- `node_modules/` — reproducible from the lockfile; not source.
- `.tmp-*.mjs` — temporary extracted/duplicated scripts.
- the older root `index.html` — superseded Runner → Flow preview.
- the unsanitized local review brief — contains local paths and agent-directed instructions.
- 69 unselected process/debug screenshots — repetitive and not needed for review.
- `Running.fbx` and `Jog Forward.fbx` — raw third-party asset redistribution not documented.

## Excluded asset fingerprints

Fingerprints preserve provenance without distributing the binaries.

| Local asset | Bytes | SHA-256 | Archive status |
|---|---:|---|---|
| `Running.fbx` | 35,484,720 | `71F6867DF84F37B38AA8842BC4F2F92371E3F63D9645C96685F5CD39BBF76DAD` | excluded; code expects this path locally |
| `Jog Forward.fbx` | 2,019,280 | `5D965041C795B9CD5676AFC6800BCD8CD1DF18089940A80465664DE94F4F66F8` | excluded; not referenced by archived code |
