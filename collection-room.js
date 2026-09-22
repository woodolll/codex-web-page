import * as THREE from 'three';

export function createCollectionRoom({reduced}) {
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.4));
  const canvas=renderer.domElement;canvas.id='collection-room';canvas.setAttribute('aria-hidden','true');document.body.append(canvas);
  const scene=new THREE.Scene();scene.background=new THREE.Color('#eeefee');scene.fog=new THREE.Fog('#eeefee',12,45);
  const camera=new THREE.PerspectiveCamera(52,innerWidth/innerHeight,.1,70);
  const material=new THREE.MeshStandardMaterial({color:'#e0e3e5',roughness:.65,metalness:.12});
  scene.add(new THREE.HemisphereLight('#ffffff','#a2abb8',2));
  const light=new THREE.DirectionalLight('#ffffff',3);light.position.set(-6,12,8);scene.add(light);
  const fill=new THREE.DirectionalLight('#c2ccdc',1.4);fill.position.set(9,4,-8);scene.add(fill);
  const pillar=new THREE.BoxGeometry(.55,7,.8);
  const arch=new THREE.Shape();arch.moveTo(-2.3,9);arch.lineTo(2.3,9);arch.lineTo(2.3,6);arch.absarc(0,6,2.3,0,Math.PI,false);arch.lineTo(-2.3,9);
  const archGeometry=new THREE.ExtrudeGeometry(arch,{depth:.8,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.055,bevelThickness:.055,curveSegments:36});
  for(let row=0;row<7;row++)for(const side of [-1,1]){
    const group=new THREE.Group();group.position.set(side*6,0,-row*5);
    group.rotation.y=Math.PI/2;
    for(const x of [-2.55,2.55]){const column=new THREE.Mesh(pillar,material);column.position.set(x,3.5,.4);group.add(column)}
    group.add(new THREE.Mesh(archGeometry,material));scene.add(group);
  }
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(70,90),new THREE.MeshStandardMaterial({color:'#e5e7ea',roughness:.38,metalness:.18}));floor.rotation.x=-Math.PI/2;floor.position.z=-18;scene.add(floor);
  const pointer=new THREE.Vector2();window.addEventListener('pointermove',e=>pointer.set(e.clientX/innerWidth-.5,e.clientY/innerHeight-.5),{passive:true});
  function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()}resize();window.addEventListener('resize',resize);
  return (active,scroll=0)=>{
    canvas.style.display=active?'block':'none';if(!active)return;
    const k=reduced?1:.045;camera.position.lerp(new THREE.Vector3(reduced?0:pointer.x*.7,3.7+(reduced?0:-pointer.y*.3),9-Math.min(scroll/2500,1.6)),k);
    camera.lookAt(0,3.8,-20);renderer.render(scene,camera);
  };
}
