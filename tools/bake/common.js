import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
export { THREE };
const loader = new GLTFLoader(), cache = new Map();
export const KIT = { c: 'commercial', i: 'industrial', s: 'suburban', r: 'roads' };
export function load(kit, name) {
  const k = kit + '/' + name;
  if (!cache.has(k)) cache.set(k, loader.loadAsync(`/dl/${KIT[kit]}/Models/GLB format/${name}.glb`).then(g => g.scene));
  return cache.get(k);
}
