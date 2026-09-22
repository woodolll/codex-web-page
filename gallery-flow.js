import * as THREE from 'three';
import { createButterflies } from './butterflies.js';
import { createCollectionRoom } from './collection-room.js';

// Screen-aligned photo meshes: flat at rest; only the surface curls in motion.
export function createGalleryFlow({reduced}){
 const page=document.querySelector('#projects');
 const updateRoom=createCollectionRoom({reduced});
 let renderer;
 try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'})}catch{return}
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor(0,0);renderer.outputColorSpace=THREE.SRGBColorSpace;
 const canvas=renderer.domElement;canvas.id='gallery-liquid';canvas.setAttribute('aria-hidden','true');document.body.append(canvas);
 const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(0,innerWidth,innerHeight,0,-2000,2000);camera.position.z=1000;
 const butterflyScene=new THREE.Scene();
 const updateButterflies=createButterflies(butterflyScene,{screen:true,reduced,renderer});
 const geometry=new THREE.PlaneGeometry(1,1,96,40),items=[];
 // Every photo and caption samples the SAME screen-space sheet, never a per-card curl.
 const vertex=`uniform vec2 size;uniform float top;uniform float fold;uniform float viewport;uniform float bend;uniform float time;varying vec2 vUv;varying float vCurl;varying float vDepth;
 void main(){vUv=uv;
 float y=top+(1.-uv.y)*size.y;
 float x=position.x*size.x;
 float radius=105.;
 float distance=max(0.,fold-y);
 float angle=min(distance/radius,3.05);
 float mappedY=y;
 float z=0.;
 if(distance>0.){mappedY=fold-sin(angle)*radius;z=-(1.-cos(angle))*radius;}
 float wave=sin(y*.006-time*1.5)*bend;
 x+=wave*8.;mappedY+=sin(x*.005+y*.004)*bend*12.;
 float depthScale=1.+z*.00055;
 x*=depthScale;
 vCurl=angle/3.14159;vDepth=distance;
 gl_Position=projectionMatrix*viewMatrix*vec4(modelMatrix[3].x+x,viewport-mappedY,z,1.);
 }`;
 const fragment=`uniform sampler2D map;uniform float time;varying vec2 vUv;varying float vCurl;varying float vDepth;
 void main(){vec2 uv=vUv;uv.y+=sin(uv.x*25.+time*2.)*vCurl*.008;
 vec4 c=texture2D(map,uv);float shade=sin(vCurl*3.14159);
 c.rgb=mix(c.rgb,vec3(.83,.89,.92),shade*.24);c.rgb*=1.-shade*.12;
 float alpha=1.-smoothstep(220.,320.,vDepth);
 gl_FragColor=vec4(c.rgb,c.a*alpha);
 #include <colorspace_fragment>
 }`;
 document.querySelectorAll('.look').forEach((el,i)=>{
  const image=el.querySelector('img'),surface=document.createElement('canvas'),ctx=surface.getContext('2d');
  const texture=new THREE.CanvasTexture(surface);texture.colorSpace=THREE.SRGBColorSpace;texture.minFilter=THREE.LinearFilter;
  const material=new THREE.ShaderMaterial({uniforms:{map:{value:texture},size:{value:new THREE.Vector2()},bend:{value:0},top:{value:0},fold:{value:0},viewport:{value:innerHeight},time:{value:0}},vertexShader:vertex,fragmentShader:fragment,transparent:true,side:THREE.DoubleSide,depthTest:false,depthWrite:false});
  const mesh=new THREE.Mesh(geometry,material);scene.add(mesh);let paintedWidth=0;
  const item={el,image,mesh,ready:false,paint(){
   if(!image.complete||!image.naturalWidth)return;const rect=el.getBoundingClientRect(),imgRect=image.getBoundingClientRect();if(rect.width<1)return;
   const ratio=Math.min(devicePixelRatio,1.7);surface.width=Math.round(rect.width*ratio);surface.height=Math.round(rect.height*ratio);ctx.scale(ratio,ratio);ctx.clearRect(0,0,rect.width,rect.height);
   const iw=image.naturalWidth,ih=image.naturalHeight,s=Math.max(imgRect.width/iw,imgRect.height/ih),sw=imgRect.width/s,sh=imgRect.height/s;
   ctx.filter=i>=10?"grayscale(1)":"none";ctx.drawImage(image,(iw-sw)/2,(ih-sh)*.05,sw,sh,0,0,imgRect.width,imgRect.height);
   ctx.filter='none';const title=el.querySelector('.look-name'),sub=el.querySelector('small');ctx.fillStyle='#262724';ctx.textBaseline='top';ctx.font='500 17px "DM Sans", Arial';ctx.fillText(title.textContent,0,imgRect.height+12);ctx.font='12px "DM Sans", Arial';ctx.fillText(sub.textContent,0,imgRect.height+36);ctx.font='21px Arial';ctx.fillText('↗',rect.width-21,imgRect.height+20);ctx.strokeStyle='#8c8d87';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(0,rect.height-.5);ctx.lineTo(rect.width,rect.height-.5);ctx.stroke();texture.needsUpdate=true;paintedWidth=rect.width;item.ready=true;el.classList.add('gallery-card-ready');
  },get width(){return paintedWidth}};items.push(item);image.addEventListener('load',()=>item.paint());if(image.complete)item.paint();
 });
 document.fonts.ready.then(()=>items.forEach(item=>item.paint()));
 function resize(){renderer.setSize(innerWidth,innerHeight);camera.right=innerWidth;camera.top=innerHeight;camera.updateProjectionMatrix();items.forEach(item=>item.paint())}resize();window.addEventListener('resize',resize);
 let lastScroll=page.scrollTop,velocity=0,lastTime=performance.now(),time=0;
 function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-lastTime)/1000,.05);lastTime=now;updateRoom(!page.hidden&&!document.hidden,page.scrollTop);if(page.hidden||document.hidden){canvas.style.display='none';lastScroll=page.scrollTop;velocity=0;return}canvas.style.display='block';time+=dt;
  const delta=page.scrollTop-lastScroll;lastScroll=page.scrollTop;const target=THREE.MathUtils.clamp(delta/Math.max(dt,1/120)/1800,-1,1);velocity+=(target-velocity)*(1-Math.exp(-dt*(Math.abs(target)>.01?12:8)));
  const h=innerHeight,w=innerWidth,header=page.querySelector('.page-heading').getBoundingClientRect().bottom+4;
  items.forEach((item,i)=>{const {el,mesh}=item;if(!el.hidden&&!item.ready)item.paint();if(el.hidden||!item.ready){mesh.visible=false;return}const r=el.getBoundingClientRect();if(Math.abs(r.width-item.width)>1)item.paint();mesh.visible=r.bottom>header-350&&r.top<h+180;if(!mesh.visible)return;
   mesh.position.set(r.left+r.width/2,h-r.top-r.height/2,0);mesh.rotation.set(0,0,0);const uniforms=mesh.material.uniforms;uniforms.size.value.set(r.width,r.height);
   uniforms.top.value=r.top;uniforms.viewport.value=h;
   uniforms.fold.value=reduced?-10000:header+100;
   uniforms.bend.value=reduced?0:velocity;
   uniforms.time.value=time;

  });
  updateButterflies(time);renderer.setScissorTest(false);renderer.clear();renderer.setScissor(0,0,w,Math.max(0,h-header));renderer.setScissorTest(true);renderer.render(scene,camera);renderer.setScissorTest(false);renderer.autoClear=false;renderer.clearDepth();renderer.render(butterflyScene,camera);renderer.autoClear=true;
 }requestAnimationFrame(frame);
 canvas.addEventListener('webglcontextlost',()=>{items.forEach(item=>item.el.classList.remove('gallery-card-ready'));canvas.style.display='none'});
}
