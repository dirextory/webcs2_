import * as T from 'three';
import { makeWeapon } from './models';

export function mountWeaponPreview(element:HTMLElement,id:string,skin:number,knife:string){
  const renderer=new T.WebGLRenderer({alpha:true,antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(element.clientWidth,element.clientHeight);
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;element.append(renderer.domElement);
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(42,element.clientWidth/element.clientHeight,.01,10);
  scene.add(new T.HemisphereLight(0xe3f1ff,0x526263,3.5));
  const key=new T.DirectionalLight(0xffdfaf,5);key.position.set(2,3,3);scene.add(key);
  const rim=new T.DirectionalLight(0x99d4fa,4);rim.position.set(-2,1,-3);scene.add(rim);
  const pivot=new T.Group();scene.add(pivot);let gun:T.Group,frame=0,drag=false,lastX=0,lastY=0,rotation=.1;
  const setWeapon=(weaponId:string,finish:number,knifeModel:string)=>{
    if(gun){pivot.remove(gun);gun.traverse(o=>{if(o instanceof T.Mesh)o.geometry.dispose();});}
    gun=makeWeapon(weaponId,finish,knifeModel);pivot.add(gun);
    const isKnife=weaponId==='knife',pistol=['usp','glock','deagle','p2000','dual','tec9'].includes(weaponId);
    const distance=isKnife?.9:pistol?1.05:2.15;
    camera.position.set(distance,.35*distance,.5*distance);camera.lookAt(0,0,isKnife?-.09:pistol?-.1:-.25);
    pivot.rotation.set(.12,rotation,.12);
  };
  setWeapon(id,skin,knife);
  renderer.domElement.onpointerdown=e=>{drag=true;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture(e.pointerId);};
  renderer.domElement.onpointerup=()=>{drag=false;};
  renderer.domElement.onpointermove=e=>{if(drag){rotation+=(e.clientX-lastX)*.013;pivot.rotation.y=rotation;pivot.rotation.x+=(e.clientY-lastY)*.01;lastX=e.clientX;lastY=e.clientY;}};
  const observer=new ResizeObserver(()=>{const w=element.clientWidth,h=element.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();});observer.observe(element);
  const animate=()=>{if(!drag)pivot.rotation.y=rotation+Math.sin(performance.now()*.0005)*.1;renderer.render(scene,camera);frame=requestAnimationFrame(animate);};animate();
  return {setWeapon,dispose(){cancelAnimationFrame(frame);observer.disconnect();gun.traverse(o=>{if(o instanceof T.Mesh)o.geometry.dispose();});renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();}};
}
