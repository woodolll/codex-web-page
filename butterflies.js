import * as THREE from 'three';

// Curved silhouettes with independent hinged wings, shared by both 3D scenes.
export function createButterflies(scene, { screen = false, reduced = false, camera = null } = {}) {
  const history=Array.from({length:90},()=>new THREE.Vector2(.5,.5));
  const pointer=new THREE.Vector2(.5,.5);let seen=false,lastTime=null;
  window.addEventListener('pointermove',e=>{pointer.set(e.clientX/innerWidth,1-e.clientY/innerHeight);seen=true},{passive:true});
  document.documentElement.addEventListener('pointerleave',()=>{seen=false});
  const destination=new THREE.Vector3(),ray=new THREE.Vector3();
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(.18, .42, .8, .72, .85, .35);
  shape.bezierCurveTo(.93, .08, .52, -.04, .38, -.08);
  shape.bezierCurveTo(.75, -.12, .59, -.61, .28, -.42);
  shape.quadraticCurveTo(.08, -.29, 0, 0);
  const geometry = new THREE.ShapeGeometry(shape, 12);
  const flock = Array.from({ length: screen ? 22 : 18 }, (_, i) => {
    const group = new THREE.Group();
    const material = new THREE.MeshStandardMaterial({color: i % 3 ? '#f3eee9' : '#bbc9d3', side: THREE.DoubleSide, roughness: .55, metalness: .1, transparent: true, opacity: screen ? .72 : .9, depthWrite: false});
    const left = new THREE.Mesh(geometry, material), right = new THREE.Mesh(geometry, material);
    left.scale.x = -1;
    group.add(left, right);
    scene.add(group);
    return {group, left, right, phase: i * 2.399, speed: .16 + (i % 5) * .021};
  });
  if (screen) { scene.add(new THREE.HemisphereLight('#ffffff', '#899aa9', 2.4)); }
  return time => {
    const t = reduced ? 0 : time;
    const dt=lastTime===null?1/60:Math.max(0,Math.min(time-lastTime,.05));lastTime=time;
    history[0].lerp(pointer,1-Math.exp(-dt*15));
    for(let j=history.length-1;j>0;j--)history[j].lerp(history[j-1],1-Math.exp(-dt*30));
    flock.forEach(({group,left,right,phase,speed}, i) => {
      const a=t*speed+phase;
      if(screen){
        const x=(.5+Math.sin(a)*.48)*innerWidth;
        const y=(.5+Math.sin(a*.71+phase)*.46)*innerHeight;
        group.position.set(x,y,30+(i%5)*12);
        group.scale.setScalar(10+(i%5)*4);
      }else{
        group.position.set(Math.sin(a)*13,2.3+(Math.sin(a*.73+phase)+1)*3.8,3+Math.cos(a*.81+phase)*6);
        group.scale.setScalar(.09+(i%4)*.045);
      }
      if(seen&&!reduced){
        const target=history[Math.min(89,i*4)];
        const orbit=18+(i%6)*11;
        if(screen){destination.set(target.x*innerWidth+Math.sin(t*1.8+phase)*orbit,target.y*innerHeight+Math.cos(t*1.4+phase)*orbit*.7,30+(i%5)*12);}
        else if(camera){
          ray.set(target.x*2-1,target.y*2-1,.5).unproject(camera).sub(camera.position).normalize();
          destination.copy(camera.position).addScaledVector(ray,8+(i%5)*1.2);
          destination.x+=Math.sin(t*1.8+phase)*.3;destination.y+=Math.cos(t*1.4+phase)*.25;
        }else destination.copy(group.position);
        if(!group.userData.follow)group.userData.follow=group.position.clone();
        group.userData.follow.lerp(destination,1-Math.exp(-dt*(2.2+(i%4)*.45)));
        group.position.copy(group.userData.follow);
      }else group.userData.follow=null;
      group.rotation.set(Math.sin(a*.6)*.35, Math.sin(a)*.6, Math.cos(a*.71)*.55);
      const flap=.25+Math.sin(t*(seen?12+i%4:7+i%4)+phase)*.9;
      left.rotation.y=flap;right.rotation.y=-flap;
    });
  };
}
