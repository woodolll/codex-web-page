import * as THREE from 'three';

// Screen-aligned photo meshes: flat at rest; only the surface curls in motion.
export function createGalleryFlow({reduced}){
 const page=document.querySelector('#projects');
 let renderer;
 try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'})}catch{return}
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor(0,0);renderer.outputColorSpace=THREE.SRGBColorSpace;
 const canvas=renderer.domElement;canvas.id='gallery-liquid';canvas.setAttribute('aria-hidden','true');document.body.append(canvas);
 const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(0,innerWidth,innerHeight,0,-2000,2000);camera.position.z=1000;
 const geometry=new THREE.PlaneGeometry(1,1,96,40),items=[];
 const vertex=`uniform vec2 size;uniform float bend;uniform float sink;uniform float direction;uniform float side;uniform float time;varying vec2 vUv;varying float vCurl;
 void main(){vUv=uv;vec3 p=position;float u=mix(uv.x,1.-uv.x,step(side,0.));float edge=pow(smoothstep(.12,1.,u),1.8);float angle=edge*bend*3.4;float signX=side;
 p.x*=size.x;p.y*=size.y;
 p.x+=signX*(sin(angle)-angle)*size.x*.26;
 p.y+=direction*(1.-cos(angle))*size.y*.3;
 p.y+=sin(uv.x*3.14159)*sin(uv.y*3.14159+time*1.4)*bend*size.y*.045;
 float tip=uv.y;float pull=sink*sink; p.x*=1.-pull*(.25+tip*.6);p.y+=pull*size.y*(.45+tip*.55);p.x+=sin(tip*8.+time*2.)*sink*size.x*.035;p.z=(1.-cos(angle))*size.x*.22-sink*size.x*tip*.45;
 float perspective=1000./(1000.-p.z);p.xy*=perspective;
 vCurl=edge*bend;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`;
 const fragment=`uniform sampler2D map;uniform float fade;uniform float sink;uniform float bend;uniform float time;varying vec2 vUv;varying float vCurl;
 void main(){vec2 uv=vUv;uv.x+=sin(uv.y*22.+time*2.)*(vCurl*.009+sink*.024);vec4 c=texture2D(map,uv);uv.y+=sin(uv.x*28.-time*3.)*sink*.014;c=texture2D(map,uv);float sheen=sin(vCurl*3.14159)*.12+sink*.32;c.rgb=mix(c.rgb,vec3(.79,.88,.92),sheen);float edge=smoothstep(0.,.002,vUv.x)*smoothstep(0.,.002,1.-vUv.x);gl_FragColor=vec4(c.rgb,c.a*fade*edge*(1.-smoothstep(1.-sink*.95,1.04,vUv.y+sin(vUv.x*18.+time*2.)*sink*.055)));
 #include <colorspace_fragment>
 }`;
 document.querySelectorAll('.look').forEach((el,i)=>{
  const image=el.querySelector('img'),surface=document.createElement('canvas'),ctx=surface.getContext('2d');
  const texture=new THREE.CanvasTexture(surface);texture.colorSpace=THREE.SRGBColorSpace;texture.minFilter=THREE.LinearFilter;
  const material=new THREE.ShaderMaterial({uniforms:{map:{value:texture},size:{value:new THREE.Vector2()},bend:{value:0},sink:{value:0},direction:{value:1},side:{value:i%2?1:-1},time:{value:0},fade:{value:1}},vertexShader:vertex,fragmentShader:fragment,transparent:true,side:THREE.DoubleSide,depthTest:false,depthWrite:false});
  const mesh=new THREE.Mesh(geometry,material);scene.add(mesh);let paintedWidth=0;
  const item={el,image,mesh,ready:false,paint(){
   if(!image.complete||!image.naturalWidth)return;const rect=el.getBoundingClientRect(),imgRect=image.getBoundingClientRect();if(rect.width<1)return;
   const ratio=Math.min(devicePixelRatio,1.7);surface.width=Math.round(rect.width*ratio);surface.height=Math.round(rect.height*ratio);ctx.scale(ratio,ratio);ctx.clearRect(0,0,rect.width,rect.height);
   const iw=image.naturalWidth,ih=image.naturalHeight,s=Math.max(imgRect.width/iw,imgRect.height/ih),sw=imgRect.width/s,sh=imgRect.height/s;
   ctx.drawImage(image,(iw-sw)/2,(ih-sh)*.05,sw,sh,0,0,imgRect.width,imgRect.height);
   const title=el.querySelector('.look-name'),sub=el.querySelector('small');ctx.fillStyle='#262724';ctx.textBaseline='top';ctx.font='500 17px "DM Sans", Arial';ctx.fillText(title.textContent,0,imgRect.height+12);ctx.font='12px "DM Sans", Arial';ctx.fillText(sub.textContent,0,imgRect.height+36);ctx.font='21px Arial';ctx.fillText('↗',rect.width-21,imgRect.height+20);ctx.strokeStyle='#8c8d87';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(0,rect.height-.5);ctx.lineTo(rect.width,rect.height-.5);ctx.stroke();texture.needsUpdate=true;paintedWidth=rect.width;item.ready=true;el.classList.add('gallery-card-ready');
  },get width(){return paintedWidth}};items.push(item);image.addEventListener('load',()=>item.paint());if(image.complete)item.paint();
 });
 document.fonts.ready.then(()=>items.forEach(item=>item.paint()));
 function resize(){renderer.setSize(innerWidth,innerHeight);camera.right=innerWidth;camera.top=innerHeight;camera.updateProjectionMatrix();items.forEach(item=>item.paint())}resize();window.addEventListener('resize',resize);
 let lastScroll=page.scrollTop,velocity=0,lastTime=performance.now(),time=0;
 function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-lastTime)/1000,.05);lastTime=now;if(page.hidden||document.hidden){canvas.style.display='none';lastScroll=page.scrollTop;velocity=0;return}canvas.style.display='block';time+=dt;
  const delta=page.scrollTop-lastScroll;lastScroll=page.scrollTop;const target=THREE.MathUtils.clamp(delta/Math.max(dt,1/120)/1800,-1,1);velocity+=(target-velocity)*(1-Math.exp(-dt*(Math.abs(target)>.01?12:8)));
  const h=innerHeight,w=innerWidth,header=page.querySelector('.page-heading').getBoundingClientRect().bottom+4;
  items.forEach((item,i)=>{const {el,mesh}=item;if(!el.hidden&&!item.ready)item.paint();if(el.hidden||!item.ready){mesh.visible=false;return}const r=el.getBoundingClientRect();if(Math.abs(r.width-item.width)>1)item.paint();mesh.visible=r.bottom>header-150&&r.top<h+180;if(!mesh.visible)return;
   mesh.position.set(r.left+r.width/2,h-r.top-r.height/2,0);mesh.rotation.set(0,0,0);const uniforms=mesh.material.uniforms;uniforms.size.value.set(r.width,r.height);
   const exit=THREE.MathUtils.smoothstep(header+r.height*.8-r.bottom,0,r.height*.9);const entering=THREE.MathUtils.smoothstep(r.top-(h-70),0,170);
   // Stop input => the mesh settles back to its undistorted front-facing plane.
   const bend=reduced?0:Math.min(1,Math.abs(velocity)*.92+exit*.85+entering*.35);
   uniforms.sink.value=reduced?0:exit;uniforms.bend.value+=(bend-uniforms.bend.value)*(1-Math.exp(-dt*12));uniforms.direction.value=velocity<-.02?-1:1;uniforms.time.value=time;uniforms.fade.value=1-Math.pow(exit,2)*.97;
  });
  renderer.setScissorTest(false);renderer.clear();renderer.setScissor(0,0,w,Math.max(0,h-header));renderer.setScissorTest(true);renderer.render(scene,camera);
 }requestAnimationFrame(frame);
 canvas.addEventListener('webglcontextlost',()=>{items.forEach(item=>item.el.classList.remove('gallery-card-ready'));canvas.style.display='none'});
}
