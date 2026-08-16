# 20D concept note

## Current evidence status

The author confirms that “20D Manifold” is an intentionally designed concept structure rather than an accidental label. The source snapshot verifies a layered, multi-parameter generative network and a three-dimensional projection. It does not yet contain an explicit list of 20 mathematical coordinates or a proof that the generated object is a manifold in the strict mathematical sense.

Safe names for the current artifact are:

- author-designed 20D conceptual network;
- 20D-inspired high-dimensional network;
- three-dimensional projection of a 20D concept structure.

## What the code currently implements

`buildManifoldBindings()` assigns each particle to one of 18 strands and stores parameters including:

- normalized strand position and longitudinal coordinate;
- width and depth layer;
- four phases;
- three generated frequencies;
- flow speed and parallax sign;
- warm-node and point-size attributes.

`computeManifoldPosition()` combines these bindings with harmonic functions, strand curl, breathing, depth scale, parallax and a contact-region mask, then maps the result to visible `x`, `y`, and `z` coordinates. A line network is rendered over eligible points and its density breathes in the final state.

## Documentation still needed

To make the design claim independently reviewable, a future revision should add:

1. the intended 20 dimensions or state variables;
2. the semantic meaning and allowed range of each dimension;
3. the mapping from each dimension to code fields;
4. the 20D-to-3D projection rule;
5. which parts are mathematical structure and which are artistic naming.

Completing that mapping would strengthen the design documentation. It would not by itself prove all formal manifold properties.
