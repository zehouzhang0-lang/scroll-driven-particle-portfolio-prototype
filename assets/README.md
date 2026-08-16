# Local animation asset

The source code expects this local path:

```text
assets/Running.fbx
```

The original development asset is deliberately absent from Git because its raw redistribution rights are not documented for this repository. `.gitignore` blocks common 3D source formats under `assets/`.

To reproduce the interaction, provide an FBX file you are entitled to use. It should contain:

- a mesh with non-degenerate triangles and a `position` attribute;
- at least one animation clip;
- preferably a skinned mesh with `skinIndex` and `skinWeight` data.

`runner-model.js` loads the file, samples its surface, binds particles using barycentric coordinates, and updates targets from the animated mesh. A different model can require scale, orientation, sampling, or framing adjustments.

The separate local file `Jog Forward.fbx` was not referenced by the archived code and is also excluded.
