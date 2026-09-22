import * as THREE from 'three';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';

// Curved silhouettes with independent hinged wings, shared by both 3D scenes.
export function createButterflies(scene, { screen = false, reduced = false, camera = null, renderer = null } = {}) {
  const pointer=new THREE.Vector2(.5,.5);let seen=false,lastTime=null,next=0,emitClock=0,lastMove=-10;
  window.addEventListener('pointermove',e=>{pointer.set(e.clientX/innerWidth,1-e.clientY/innerHeight);seen=true;lastMove=performance.now()/1000},{passive:true});
  document.documentElement.addEventListener('pointerleave',()=>{seen=false});
  const ray=new THREE.Vector3();
  if(!scene.environment&&renderer){const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();scene.environment=pmrem.fromScene(room,.04).texture;room.dispose();pmrem.dispose();}
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(.18, .42, .8, .72, .85, .35);
  shape.bezierCurveTo(.93, .08, .52, -.04, .38, -.08);
  shape.bezierCurveTo(.75, -.12, .59, -.61, .28, -.42);
  shape.quadraticCurveTo(.08, -.29, 0, 0);
  const geometry = new THREE.ShapeGeometry(shape, 12);
  const flock = Array.from({ length: screen ? 48 : 36 }, (_, i) => {
    const group = new THREE.Group();
    const material = new THREE.MeshPhysicalMaterial({color: '#dce4ee', clearcoat:1, clearcoatRoughness:.06, envMapIntensity:2.3, emissive:'#b8cce6', emissiveIntensity:0, side: THREE.DoubleSide, roughness: .14, metalness: .92, transparent: true, opacity: screen ? .72 : .9, depthWrite: false, depthTest: false});
    const left = new THREE.Mesh(geometry, material), right = new THREE.Mesh(geometry, material);
    left.scale.x = -1;left.renderOrder=right.renderOrder=50;
    group.add(left, right);
    scene.add(group);
    return {group, left, right, material, age:100, life:3.2+(i%5)*.3, origin:new THREE.Vector3(), phase: i * 2.399, speed: .16 + (i % 5) * .021};
  });
  if (screen) { scene.add(new THREE.HemisphereLight('#ffffff', '#899aa9', 2.4)); }
  return time => {
    const t=reduced?0:time,dt=lastTime===null?1/60:Math.max(0,Math.min(time-lastTime,.05));lastTime=time;
    emitClock+=dt;
    const emitting=seen&&!reduced&&performance.now()/1000-lastMove<.6;
    if(emitting&&emitClock>.065){
      emitClock=0;const item=flock[next++%flock.length];item.age=0;
      if(screen)item.origin.set(pointer.x*innerWidth,pointer.y*innerHeight,50);
      else if(camera){camera.updateMatrixWorld();ray.set(pointer.x*2-1,pointer.y*2-1,.5).unproject(camera).sub(camera.position).normalize();item.origin.copy(camera.position).addScaledVector(ray,7.5);}
    }
    flock.forEach((item,i)=>{
      const {group,left,right,material,phase,origin,life}=item;item.age+=dt;
      const age=item.age,alive=age<life;
      // A small background flock stays visible before the first pointer movement.
      if(!alive){group.visible=i<8;if(!group.visible)return;
        if(screen){group.position.set((.5+Math.sin(t*.17+phase)*.48)*innerWidth,(.5+Math.cos(t*.13+phase)*.45)*innerHeight,40);group.scale.setScalar(9+i);}
        else{group.position.set(Math.sin(t*.17+phase)*10,3+Math.cos(t*.2+phase)*2,2+Math.sin(phase)*3);group.scale.setScalar(.12);}
        material.opacity=.42;
      }else{
        group.visible=true;const unit=screen?1:.012;
        group.position.copy(origin);group.position.x+=(Math.sin(phase)*age*45+Math.sin(age*4+phase)*age*12)*unit;
        group.position.y+=(age*38+Math.sin(age*3+phase)*age*18)*unit;
        group.position.z+=Math.sin(phase)*age*(screen?8:.25);
        const birth=THREE.MathUtils.smoothstep(age,0,.16),fade=1-THREE.MathUtils.smoothstep(age,life*.55,life);
        group.scale.setScalar((screen?12+i%5*3:.14+i%4*.025)*birth);material.opacity=fade*.94;
      }
      if(!screen&&camera){group.quaternion.copy(camera.quaternion);group.rotateZ(Math.sin(t+phase)*.45)}else group.rotation.set(Math.sin(t*.7+phase)*.4,Math.sin(t+phase)*.45,Math.sin(t*.6+phase)*.55);
      const flap=.2+Math.sin(t*(27+i%5*2)+phase)*1.12;
      left.rotation.y=flap;right.rotation.y=-flap;
      material.emissiveIntensity=Math.pow(Math.max(0,Math.sin(t*8+phase)),22)*.65;
    });
  };
}
