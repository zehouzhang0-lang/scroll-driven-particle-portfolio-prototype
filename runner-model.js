import * as THREE from "three";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";

const DEFAULT_ASSET_URL = new URL("./assets/Running.fbx", import.meta.url).href;
const QUALITY_LEVELS = new Set([5000, 8000, 15000, 25000]);
const COLOR_WEIGHT_ORDER = ["baseWhiteBlue", "activeCyan", "amberCadence", "roseAccent"];
const GROUP_NAMES = ["body", "motionAccent"];

const BODY_GROUP = 0;
const ACCENT_GROUP = 1;

const state = {
  assetUrl: DEFAULT_ASSET_URL,
  seed: 31,
  quality: 15000,
  speed: 0.75,
  sourceSteps: 4,
  targetSteps: 12,
  loaded: false,
  loadingPromise: null,
  lastTime: 0,
  clipTime: 0,
  loopIndex: 0,
};

const runtime = {
  fbxObject: null,
  mixer: null,
  activeAction: null,
  activeClip: null,
  surfaceMeshes: [],
  surfaceTriangles: [],
  vertexSamples: [],
  particleBindings: [],
  baseBounds: new THREE.Box3(),
  baseSize: new THREE.Vector3(1, 1.72, 1),
  baseObjectPosition: new THREE.Vector3(),
  clipLoopDelta: new THREE.Vector3(),
};

const targets = {
  count: 0,
  positions: new Float32Array(0),
  velocityHints: new Float32Array(0),
  sizes: new Float32Array(0),
  colorWeights: new Float32Array(0),
  groups: new Uint8Array(0),
  bindings: runtime.particleBindings,
  groupNames: GROUP_NAMES,
  colorWeightOrder: COLOR_WEIGHT_ORDER,
};

const currentBounds = {
  min: [0, 0, 0],
  max: [0, 0, 0],
  center: [0, 0, 0],
  size: [0, 0, 0],
};

let futurePositions = new Float32Array(0);

const tempA = new THREE.Vector3();
const tempB = new THREE.Vector3();
const tempC = new THREE.Vector3();
const tempAB = new THREE.Vector3();
const tempAC = new THREE.Vector3();
const tempNormal = new THREE.Vector3();
const tempCenterStart = new THREE.Vector3();
const tempCenterEnd = new THREE.Vector3();

function fract(x) {
  return x - Math.floor(x);
}

function hash01(id, salt) {
  return fract(Math.sin((id + 1) * 127.1 + (state.seed + salt) * 311.7) * 43758.5453123);
}

function mix(a, b, t) {
  return a + (b - a) * t;
}

function validateQuality(quality) {
  if (!QUALITY_LEVELS.has(quality)) {
    throw new Error(`Unsupported Runner quality ${quality}. Use 5000, 8000, 15000, or 25000.`);
  }
}

function getAttributeComponent(attribute, vertexIndex, component) {
  return attribute.array[vertexIndex * attribute.itemSize + component] || 0;
}

function getTriangleVertexIndex(data, triOffset, corner) {
  return data.index ? data.index.getX(triOffset + corner) : triOffset + corner;
}

function updateSkinnedVertexCache(data, forceAll = false) {
  const { mesh, position, skinned } = data;
  mesh.updateMatrixWorld(true);

  if (mesh.isSkinnedMesh && mesh.skeleton) {
    mesh.skeleton.update();
  }

  const vertexList = forceAll || !data.usedVertexIndices ? null : data.usedVertexIndices;
  const count = vertexList ? vertexList.length : position.count;

  for (let n = 0; n < count; n++) {
    const i = vertexList ? vertexList[n] : n;
    tempA.fromBufferAttribute(position, i);

    if (mesh.isSkinnedMesh && mesh.skeleton && mesh.geometry.attributes.skinIndex) {
      mesh.applyBoneTransform(i, tempA);
    }

    tempA.applyMatrix4(mesh.matrixWorld);
    const k = i * 3;
    skinned[k] = tempA.x;
    skinned[k + 1] = tempA.y;
    skinned[k + 2] = tempA.z;
  }
}

function updateAllSkinnedVertexCaches(forceAll = false) {
  for (const data of runtime.surfaceMeshes) {
    updateSkinnedVertexCache(data, forceAll);
  }
}

function readSkinnedVertex(data, vertexIndex, target) {
  const k = vertexIndex * 3;
  target.set(data.skinned[k], data.skinned[k + 1], data.skinned[k + 2]);
  return target;
}

function triangleAreaFromCache(data, i0, i1, i2) {
  readSkinnedVertex(data, i0, tempA);
  readSkinnedVertex(data, i1, tempB);
  readSkinnedVertex(data, i2, tempC);
  tempAB.subVectors(tempB, tempA);
  tempAC.subVectors(tempC, tempA);
  return tempAB.cross(tempAC).length() * 0.5;
}

function triangleNormalFromCache(data, i0, i1, i2) {
  readSkinnedVertex(data, i0, tempA);
  readSkinnedVertex(data, i1, tempB);
  readSkinnedVertex(data, i2, tempC);
  tempAB.subVectors(tempB, tempA);
  tempAC.subVectors(tempC, tempA);
  tempNormal.crossVectors(tempAB, tempAC).normalize();
  return [tempNormal.x, tempNormal.y, tempNormal.z];
}

function dominantBoneForTriangle(data, i0, i1, i2, b0, b1, b2) {
  const skinIndex = data.mesh.geometry.attributes.skinIndex;
  const skinWeight = data.mesh.geometry.attributes.skinWeight;
  if (!skinIndex || !skinWeight) return -1;

  const scores = new Map();
  const addVertex = (vertexIndex, baryWeight) => {
    for (let c = 0; c < skinIndex.itemSize; c++) {
      const bone = getAttributeComponent(skinIndex, vertexIndex, c);
      const weight = getAttributeComponent(skinWeight, vertexIndex, c) * baryWeight;
      if (weight > 0) scores.set(bone, (scores.get(bone) || 0) + weight);
    }
  };

  addVertex(i0, b0);
  addVertex(i1, b1);
  addVertex(i2, b2);

  let bestBone = -1;
  let bestScore = 0;
  for (const [bone, score] of scores) {
    if (score > bestScore) {
      bestBone = bone;
      bestScore = score;
    }
  }

  return bestBone;
}

function normalizeLoadedModel(object) {
  object.updateMatrixWorld(true);

  let box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const height = size.y || Math.max(size.x, size.z, 1);
  const scale = 1.72 / height;
  object.scale.setScalar(scale);
  object.updateMatrixWorld(true);

  box = new THREE.Box3().setFromObject(object);
  const center = box.getCenter(new THREE.Vector3());
  object.position.x -= center.x;
  object.position.y -= box.min.y;
  object.position.z -= center.z;
  object.updateMatrixWorld(true);

  runtime.baseObjectPosition.copy(object.position);
  runtime.baseBounds = new THREE.Box3().setFromObject(object);
  runtime.baseSize = runtime.baseBounds.getSize(new THREE.Vector3());
}

function collectSurfaceMeshes() {
  runtime.surfaceMeshes = [];

  runtime.fbxObject.traverse((child) => {
    if (!child.isMesh || !child.geometry || !child.geometry.attributes.position) return;

    child.visible = false;
    child.frustumCulled = false;

    const geometry = child.geometry;
    const position = geometry.attributes.position;
    runtime.surfaceMeshes.push({
      mesh: child,
      position,
      index: geometry.index,
      skinned: new Float32Array(position.count * 3),
      usedVertexIndices: null,
      vertexToTriangle: new Array(position.count),
    });
  });
}

function buildSurfaceTriangles() {
  runtime.surfaceTriangles = [];
  runtime.vertexSamples = [];
  let cumulative = 0;

  updateAllSkinnedVertexCaches(true);

  for (let meshIndex = 0; meshIndex < runtime.surfaceMeshes.length; meshIndex++) {
    const data = runtime.surfaceMeshes[meshIndex];
    const triangleVertexCount = data.index ? data.index.count : data.position.count;

    for (let offset = 0; offset + 2 < triangleVertexCount; offset += 3) {
      const i0 = getTriangleVertexIndex(data, offset, 0);
      const i1 = getTriangleVertexIndex(data, offset, 1);
      const i2 = getTriangleVertexIndex(data, offset, 2);
      const area = triangleAreaFromCache(data, i0, i1, i2);

      if (!Number.isFinite(area) || area <= 1e-10) continue;

      cumulative += area;
      const triangle = {
        triangleIndex: runtime.surfaceTriangles.length,
        meshIndex,
        i0,
        i1,
        i2,
        cumulative,
        normal: triangleNormalFromCache(data, i0, i1, i2),
      };

      runtime.surfaceTriangles.push(triangle);

      if (!data.vertexToTriangle[i0]) data.vertexToTriangle[i0] = { triangle, corner: 0 };
      if (!data.vertexToTriangle[i1]) data.vertexToTriangle[i1] = { triangle, corner: 1 };
      if (!data.vertexToTriangle[i2]) data.vertexToTriangle[i2] = { triangle, corner: 2 };
    }

    for (let vertexIndex = 0; vertexIndex < data.vertexToTriangle.length; vertexIndex++) {
      const source = data.vertexToTriangle[vertexIndex];
      if (!source) continue;
      runtime.vertexSamples.push({
        meshIndex,
        vertexIndex,
        triangle: source.triangle,
        corner: source.corner,
      });
    }
  }
}

function findTriangleByArea(value) {
  let lo = 0;
  let hi = runtime.surfaceTriangles.length - 1;

  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (runtime.surfaceTriangles[mid].cumulative < value) lo = mid + 1;
    else hi = mid;
  }

  return runtime.surfaceTriangles[lo];
}

function computeSkinnedHorizontalCenter(target, forceAll = false) {
  updateAllSkinnedVertexCaches(forceAll);

  let minX = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxZ = -Infinity;

  for (const data of runtime.surfaceMeshes) {
    const vertexList = forceAll || !data.usedVertexIndices ? null : data.usedVertexIndices;
    const count = vertexList ? vertexList.length : data.position.count;

    for (let n = 0; n < count; n++) {
      const i = vertexList ? vertexList[n] : n;
      const k = i * 3;
      const x = data.skinned[k];
      const z = data.skinned[k + 2];

      if (!Number.isFinite(x) || !Number.isFinite(z)) continue;

      minX = Math.min(minX, x);
      minZ = Math.min(minZ, z);
      maxX = Math.max(maxX, x);
      maxZ = Math.max(maxZ, z);
    }
  }

  if (!Number.isFinite(minX)) {
    return target.set(0, 0, 0);
  }

  return target.set((minX + maxX) * 0.5, 0, (minZ + maxZ) * 0.5);
}

function computeClipLoopDelta() {
  if (!runtime.mixer || !runtime.activeClip || !runtime.fbxObject) return;

  const duration = Math.max(runtime.activeClip.duration, 0.001);
  const sampleEnd = Math.max(0, duration - Math.min(1 / 60, duration * 0.02));

  runtime.fbxObject.position.copy(runtime.baseObjectPosition);
  runtime.mixer.setTime(0);
  runtime.fbxObject.updateMatrixWorld(true);
  computeSkinnedHorizontalCenter(tempCenterStart, true);

  runtime.fbxObject.position.copy(runtime.baseObjectPosition);
  runtime.mixer.setTime(sampleEnd);
  runtime.fbxObject.updateMatrixWorld(true);
  computeSkinnedHorizontalCenter(tempCenterEnd, true);

  runtime.clipLoopDelta.subVectors(tempCenterEnd, tempCenterStart);
  runtime.clipLoopDelta.y = 0;

  runtime.fbxObject.position.copy(runtime.baseObjectPosition);
  runtime.mixer.setTime(0);
  runtime.fbxObject.updateMatrixWorld(true);
}

function sequenceDuration() {
  if (!runtime.activeClip) return 1;
  return runtime.activeClip.duration * (Math.max(1, state.targetSteps) / Math.max(1, state.sourceSteps));
}

function prepareTargetArrays(count) {
  targets.count = count;
  targets.positions = new Float32Array(count * 3);
  targets.velocityHints = new Float32Array(count * 3);
  targets.sizes = new Float32Array(count);
  targets.colorWeights = new Float32Array(count * 4);
  targets.groups = new Uint8Array(count);
  futurePositions = new Float32Array(count * 3);
}

function buildParticleBindings() {
  if (!runtime.surfaceTriangles.length) return;

  const count = state.quality;
  const totalArea = runtime.surfaceTriangles[runtime.surfaceTriangles.length - 1].cumulative;
  const usedVertices = runtime.surfaceMeshes.map(() => new Set());
  const vertexParticleCount = runtime.vertexSamples.length ? Math.floor(count * 0.72) : 0;
  const vertexPhase = hash01(0, 19);

  runtime.particleBindings = new Array(count);
  prepareTargetArrays(count);

  for (let i = 0; i < count; i++) {
    const useVertexSample = i < vertexParticleCount;
    let triangle;
    let b0;
    let b1;
    let b2;
    let sampleSource = "surface";

    if (useVertexSample) {
      const sampleT = ((i + 0.5) / vertexParticleCount + vertexPhase) % 1;
      const sampleIndex = Math.min(
        runtime.vertexSamples.length - 1,
        Math.floor(sampleT * runtime.vertexSamples.length)
      );
      const sample = runtime.vertexSamples[sampleIndex];
      triangle = sample.triangle;
      b0 = sample.corner === 0 ? 1 : 0;
      b1 = sample.corner === 1 ? 1 : 0;
      b2 = sample.corner === 2 ? 1 : 0;
      sampleSource = "vertex";
    } else {
      triangle = findTriangleByArea(hash01(i, 1) * totalArea);
      const r1 = hash01(i, 2);
      const r2 = hash01(i, 3);
      const root = Math.sqrt(r1);
      b0 = 1 - root;
      b1 = root * (1 - r2);
      b2 = root * r2;
    }

    const data = runtime.surfaceMeshes[triangle.meshIndex];
    const dominantBone = dominantBoneForTriangle(data, triangle.i0, triangle.i1, triangle.i2, b0, b1, b2);
    const cyanAccent = hash01(i, 4) < 0.14;
    const group = cyanAccent ? ACCENT_GROUP : BODY_GROUP;
    const sizeJitter = hash01(i, 7);
    const weightOffset = i * 4;

    runtime.particleBindings[i] = {
      meshIndex: triangle.meshIndex,
      triangleIndex: triangle.triangleIndex,
      indices: [triangle.i0, triangle.i1, triangle.i2],
      barycentric: [b0, b1, b2],
      normal: triangle.normal,
      dominantBone,
      sampleSource,
    };

    usedVertices[triangle.meshIndex].add(triangle.i0);
    usedVertices[triangle.meshIndex].add(triangle.i1);
    usedVertices[triangle.meshIndex].add(triangle.i2);

    targets.groups[i] = group;
    targets.sizes[i] = cyanAccent
      ? mix(0.00115, 0.00205, sizeJitter)
      : mix(0.0009, 0.00165, sizeJitter);

    if (cyanAccent) {
      targets.colorWeights[weightOffset] = 0.64;
      targets.colorWeights[weightOffset + 1] = mix(0.26, 0.34, hash01(i, 5));
      targets.colorWeights[weightOffset + 2] = 0;
      targets.colorWeights[weightOffset + 3] = 0.02;
    } else {
      targets.colorWeights[weightOffset] = 0.88;
      targets.colorWeights[weightOffset + 1] = 0.10;
      targets.colorWeights[weightOffset + 2] = 0;
      targets.colorWeights[weightOffset + 3] = 0.02;
    }
  }

  for (let i = 0; i < runtime.surfaceMeshes.length; i++) {
    runtime.surfaceMeshes[i].usedVertexIndices = Array.from(usedVertices[i]);
  }

  targets.bindings = runtime.particleBindings;
}

function stableFollowY() {
  return (runtime.baseBounds.isEmpty() ? 0 : runtime.baseBounds.min.y) + runtime.baseSize.y * 0.54;
}

function updateOutputBounds(positions) {
  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;

  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    minZ = Math.min(minZ, z);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
    maxZ = Math.max(maxZ, z);
  }

  currentBounds.min[0] = minX;
  currentBounds.min[1] = minY;
  currentBounds.min[2] = minZ;
  currentBounds.max[0] = maxX;
  currentBounds.max[1] = maxY;
  currentBounds.max[2] = maxZ;
  currentBounds.center[0] = (minX + maxX) * 0.5;
  currentBounds.center[1] = (minY + maxY) * 0.5;
  currentBounds.center[2] = (minZ + maxZ) * 0.5;
  currentBounds.size[0] = maxX - minX;
  currentBounds.size[1] = maxY - minY;
  currentBounds.size[2] = maxZ - minZ;
}

function sampleAtElapsedTime(elapsedSeconds, outputPositions, updateBounds = false) {
  if (!runtime.activeClip || !runtime.mixer || !runtime.fbxObject) return;

  const duration = Math.max(runtime.activeClip.duration, 0.001);
  const totalDuration = Math.max(sequenceDuration(), 0.001);
  const previewTime = ((elapsedSeconds * state.speed) % totalDuration + totalDuration) % totalDuration;
  const loopIndex = Math.floor(previewTime / duration);
  const clipTime = previewTime - loopIndex * duration;

  runtime.mixer.setTime(clipTime);
  runtime.fbxObject.position
    .copy(runtime.baseObjectPosition)
    .addScaledVector(runtime.clipLoopDelta, loopIndex);
  runtime.fbxObject.updateMatrixWorld(true);

  updateAllSkinnedVertexCaches(false);

  let minX = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxZ = -Infinity;

  for (let i = 0; i < runtime.particleBindings.length; i++) {
    const ref = runtime.particleBindings[i];
    const data = runtime.surfaceMeshes[ref.meshIndex];
    const i0 = ref.indices[0] * 3;
    const i1 = ref.indices[1] * 3;
    const i2 = ref.indices[2] * 3;
    const b0 = ref.barycentric[0];
    const b1 = ref.barycentric[1];
    const b2 = ref.barycentric[2];
    const k = i * 3;
    const x = data.skinned[i0] * b0 + data.skinned[i1] * b1 + data.skinned[i2] * b2;
    const y = data.skinned[i0 + 1] * b0 + data.skinned[i1 + 1] * b1 + data.skinned[i2 + 1] * b2;
    const z = data.skinned[i0 + 2] * b0 + data.skinned[i1 + 2] * b1 + data.skinned[i2 + 2] * b2;

    outputPositions[k] = x;
    outputPositions[k + 1] = y;
    outputPositions[k + 2] = z;

    minX = Math.min(minX, x);
    minZ = Math.min(minZ, z);
    maxX = Math.max(maxX, x);
    maxZ = Math.max(maxZ, z);
  }

  const centerX = Number.isFinite(minX) ? (minX + maxX) * 0.5 : 0;
  const centerZ = Number.isFinite(minZ) ? (minZ + maxZ) * 0.5 : 0;
  const centerY = stableFollowY();

  for (let i = 0; i < outputPositions.length; i += 3) {
    outputPositions[i] -= centerX;
    outputPositions[i + 1] -= centerY;
    outputPositions[i + 2] -= centerZ;
  }

  if (updateBounds) {
    state.lastTime = elapsedSeconds;
    state.clipTime = clipTime;
    state.loopIndex = loopIndex;
    updateOutputBounds(outputPositions);
  }
}

function summarizeLoad() {
  const boneCount = runtime.fbxObject ? countObjects((obj) => obj.isBone) : 0;
  const meshCount = runtime.surfaceMeshes.length;
  const vertexCount = runtime.surfaceMeshes.reduce((sum, data) => sum + data.position.count, 0);

  return {
    assetUrl: state.assetUrl,
    clipName: runtime.activeClip?.name || "",
    clipDuration: runtime.activeClip?.duration || 0,
    sourceSteps: state.sourceSteps,
    targetSteps: state.targetSteps,
    sequenceDuration: sequenceDuration(),
    quality: state.quality,
    particleCount: targets.count,
    meshCount,
    boneCount,
    vertexCount,
    vertexSampleCount: runtime.vertexSamples.length,
    triangleCount: runtime.surfaceTriangles.length,
    loopOffset: [runtime.clipLoopDelta.x, runtime.clipLoopDelta.y, runtime.clipLoopDelta.z],
  };
}

function countObjects(predicate) {
  let count = 0;
  runtime.fbxObject.traverse((obj) => {
    if (predicate(obj)) count++;
  });
  return count;
}

function loadFBX(assetUrl) {
  const loader = new FBXLoader();
  return new Promise((resolve, reject) => {
    loader.load(assetUrl, resolve, undefined, reject);
  });
}

export async function loadRunnerAssets(options = {}) {
  if (options.assetUrl) state.assetUrl = options.assetUrl;
  if (options.seed !== undefined) state.seed = Number(options.seed) || 0;
  if (options.speed !== undefined) state.speed = Number(options.speed) || state.speed;
  if (options.sourceSteps !== undefined) state.sourceSteps = Math.max(1, Number(options.sourceSteps) || 4);
  if (options.targetSteps !== undefined) state.targetSteps = Math.max(state.sourceSteps, Number(options.targetSteps) || 12);
  if (options.quality !== undefined) {
    validateQuality(Number(options.quality));
    state.quality = Number(options.quality);
  }

  if (state.loaded) {
    return summarizeLoad();
  }

  if (state.loadingPromise) {
    return state.loadingPromise;
  }

  state.loadingPromise = (async () => {
    runtime.fbxObject = await loadFBX(state.assetUrl);
    normalizeLoadedModel(runtime.fbxObject);
    collectSurfaceMeshes();

    runtime.mixer = new THREE.AnimationMixer(runtime.fbxObject);
    runtime.activeClip = runtime.fbxObject.animations[0] || null;

    if (!runtime.activeClip) {
      throw new Error("Runner FBX has no animation clips.");
    }

    runtime.activeAction = runtime.mixer.clipAction(runtime.activeClip);
    runtime.activeAction.play();
    runtime.activeAction.setLoop(THREE.LoopRepeat);

    computeClipLoopDelta();
    buildSurfaceTriangles();
    buildParticleBindings();

    state.loaded = true;
    updateRunnerParticles(0);
    return summarizeLoad();
  })();

  return state.loadingPromise;
}

export function updateRunnerParticles(time) {
  if (!state.loaded) {
    throw new Error("Runner assets are not loaded. Call and await loadRunnerAssets() first.");
  }

  const elapsed = Number(time) || 0;
  const dt = 1 / 60;

  sampleAtElapsedTime(elapsed, targets.positions, true);
  sampleAtElapsedTime(elapsed + dt, futurePositions, false);

  for (let i = 0; i < targets.positions.length; i++) {
    targets.velocityHints[i] = (futurePositions[i] - targets.positions[i]) / dt;
  }

  return targets;
}

export function getRunnerParticleTargets() {
  return targets;
}

export function getRunnerBounds() {
  return {
    min: [...currentBounds.min],
    max: [...currentBounds.max],
    center: [...currentBounds.center],
    size: [...currentBounds.size],
  };
}

export function setRunnerQuality(quality) {
  const normalizedQuality = Number(quality);
  validateQuality(normalizedQuality);
  state.quality = normalizedQuality;

  if (state.loaded) {
    buildParticleBindings();
    updateRunnerParticles(state.lastTime);
  }

  return targets;
}

export const runnerModelInfo = {
  qualityLevels: [...QUALITY_LEVELS],
  defaultQuality: 15000,
  defaultSpeed: 0.75,
  defaultSourceSteps: 4,
  defaultTargetSteps: 12,
  samplingMode: "mesh-vertex-surface-hybrid",
  groupNames: GROUP_NAMES,
  colorWeightOrder: COLOR_WEIGHT_ORDER,
};
