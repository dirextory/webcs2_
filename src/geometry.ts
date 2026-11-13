import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** Bake rigid detail into material batches while retaining invisible raycast colliders. */
export function batchRigidMeshes(root:T.Object3D,retain:T.Object3D[]=[]){
  root.updateMatrixWorld(true);
  const inverse=root.matrixWorld.clone().invert();
  const batches=new Map<T.Material,T.BufferGeometry[]>(),meshes:T.Mesh[]=[];
  root.traverse(o=>{
    if(!(o instanceof T.Mesh)||Array.isArray(o.material))return;
    const geo=o.geometry.clone().applyMatrix4(inverse.clone().multiply(o.matrixWorld));
    if(!batches.has(o.material))batches.set(o.material,[]);
    batches.get(o.material)!.push(geo);meshes.push(o);
  });
  const retained=new Set(retain);
  for(const mesh of meshes){mesh.removeFromParent();if(!retained.has(mesh))mesh.geometry.dispose();}
  for(const [material,geometries]of batches){
    const geometry=mergeGeometries(geometries,false);
    if(geometry){const mesh=new T.Mesh(geometry,material);mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);}
    for(const g of geometries)g.dispose();
  }
}
