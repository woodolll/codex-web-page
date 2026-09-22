import * as THREE from 'three';

const clamp=THREE.MathUtils.clamp;
const ease=(a,b,x)=>THREE.MathUtils.smoothstep(x,a,b);
export const TRAIL_COUNT=20;
export const flowGLSL=`
uniform vec4 trail[20];
uniform float aspect;
vec3 fluidField(vec2 uv){
  vec2 bend=vec2(0.);float glow=0.;
  for(int i=0;i<20;i++){
    vec4 drop=trail[i];
    vec2 delta=(uv-drop.xy)*vec2(aspect,1.);
    float d=length(delta)+.0001;
    float life=exp(-drop.z*2.0)*drop.w;
    float ring=exp(-pow((d-drop.z*.12)/.055,2.));
    float core=exp(-d*d/ .009);
    float wave=sin(d*78.-drop.z*7.5);
    bend+=delta/d*(ring*wave*.007+core*.012)*life/vec2(aspect,1.);
    glow+=(core*.7+ring*.12)*life;
  }
  return vec3(clamp(bend,vec2(-.045),vec2(.045)),clamp(glow,0.,1.));
}`;

export function createLiquidExperience({scene,camera,renderer,reduced,isActive,onLook}){
 const trail=Array.from({length:TRAIL_COUNT},()=>new THREE.Vector4(-10,-10,10,0));
 let slot=0,lastX=-1,lastY=-1,lastStamp=0,progress=0,activeIndex=-1,disposed=false;
 const uniforms={trail:{value:trail},aspect:{value:innerWidth/innerHeight}};
 const onMove=e=>{
  if(reduced||!isActive())return;
  const now=performance.now();
  const distance=lastX<0?12:Math.hypot(e.clientX-lastX,e.clientY-lastY);
  if(now-lastStamp<22||distance<3)return;
  if(!e.target.closest('#entry,dialog')){
   trail[slot].set(e.clientX/innerWidth,1-e.clientY/innerHeight,0,clamp(distance/38,.25,1));slot=(slot+1)%TRAIL_COUNT;
  }
  lastX=e.clientX;lastY=e.clientY;lastStamp=now;
 };
 window.addEventListener('pointermove',onMove,{passive:true});
 // The headline is composited into the same optical pass as the scene.
 // Its accessible DOM heading remains in place, while the visible glyphs refract.
 const textCanvas=document.createElement('canvas'),ctx=textCanvas.getContext('2d');
 const textTexture=new THREE.CanvasTexture(textCanvas);textTexture.colorSpace=THREE.SRGBColorSpace;
 const overlayScene=new THREE.Scene(),overlayCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
 const textMaterial=new THREE.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,uniforms:{...uniforms,map:{value:textTexture},visibility:{value:0}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:`uniform sampler2D map;uniform float visibility;varying vec2 vUv;${flowGLSL}
 void main(){vec3 flow=fluidField(vUv);vec4 glyph=texture2D(map,vUv+flow.xy*.45);vec3 waterColor=mix(vec3(.035,.35,.46),vec3(.37,.16,.59),vUv.x);vec3 color=mix(glyph.rgb,waterColor,flow.z*.96);color+=flow.z*.025;gl_FragColor=vec4(color,glyph.a*visibility);}`});
 overlayScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),textMaterial));
 let typeReady=false;
 function paintType(){
  const heading=document.querySelector('.hero-copy h1');if(!heading)return;
  const scale=Math.min(devicePixelRatio,1.75);textCanvas.width=Math.round(innerWidth*scale);textCanvas.height=Math.round(innerHeight*scale);ctx.scale(scale,scale);ctx.clearRect(0,0,innerWidth,innerHeight);
  for(const el of [heading.querySelector('em'),heading.querySelector(':scope > span')]){
   const css=getComputedStyle(el),r=el.getBoundingClientRect();ctx.font=`${css.fontStyle} ${css.fontWeight} ${css.fontSize} ${css.fontFamily}`;ctx.textAlign='center';ctx.textBaseline='alphabetic';ctx.fillStyle='#262724';
   if('letterSpacing' in ctx)ctx.letterSpacing=css.letterSpacing;
   const m=ctx.measureText(el.textContent);const inkHeight=m.actualBoundingBoxAscent+m.actualBoundingBoxDescent;
   ctx.fillText(el.textContent,r.left+r.width/2,r.top+(r.height-inkHeight)/2+m.actualBoundingBoxAscent);
  }
  textTexture.needsUpdate=true;typeReady=true;document.body.classList.add('fluid-type-ready');
 }
 document.fonts.ready.then(()=>{if(!disposed)paintType()});
 // Three physical photo surfaces turn and pass through the reflecting water.
 const cards=[],loader=new THREE.TextureLoader();
 for(let i=0;i<3;i++){
  const mat=new THREE.ShaderMaterial({transparent:true,side:THREE.DoubleSide,uniforms:{map:{value:null},uvTransform:{value:new THREE.Matrix3()},time:{value:0},opacity:{value:0},dive:{value:0}},vertexShader:`uniform float time;uniform float dive;varying vec2 vUv;varying vec3 vWorld;void main(){vUv=uv;vec3 p=position;float tip=1.-uv.y;float curl=pow(tip,1.7)*dive;float pull=dive*dive;p.x*=1.-pull*(.2+tip*.65);p.y-=curl*2.6;p.z+=sin(tip*3.14159+dive*2.4)*curl*2.2; p.x+=sin(tip*8.-time*3.)*curl*.22;p.z+=sin(p.x*2.3+p.y*2.+time*1.1)*(.025+dive*.22);vec4 world=modelMatrix*vec4(p,1.);vWorld=world.xyz;gl_Position=projectionMatrix*viewMatrix*world;}`,fragmentShader:`uniform sampler2D map;uniform mat3 uvTransform;uniform float time;uniform float opacity;uniform float dive;varying vec2 vUv;varying vec3 vWorld;void main(){float wet=1.-smoothstep(-.3,.55,vWorld.y);vec2 uv=(uvTransform*vec3(vUv,1.)).xy;uv.x+=sin(uv.y*39.+time*2.)*wet*.026;uv.y+=sin(uv.x*24.-time*2.8)*wet*.014;vec4 photo=texture2D(map,uv);vec3 col=mix(photo.rgb,vec3(.07,.32,.37),wet*.72);float edge=smoothstep(0.,.025,vUv.x)*smoothstep(0.,.025,1.-vUv.x)*smoothstep(0.,.02,vUv.y)*smoothstep(0.,.02,1.-vUv.y);float submerged=smoothstep(-1.25,.12,vWorld.y);float waterline=exp(-abs(vWorld.y-.06)*18.);col+=vec3(.48,.68,.7)*waterline*.35;gl_FragColor=vec4(col,opacity*edge*submerged);}`});
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(3.6,4.5,36,48),mat);mesh.visible=false;scene.add(mesh);cards.push(mesh);
  loader.load(`assets/look-0${i+1}.jpg`,texture=>{texture.colorSpace=THREE.SRGBColorSpace;const a=texture.image.width/texture.image.height,desired=3.6/4.5;if(a>desired){texture.repeat.x=desired/a;texture.offset.x=(1-texture.repeat.x)/2}else{texture.repeat.y=a/desired;texture.offset.y=(1-texture.repeat.y)/2}texture.updateMatrix();mat.uniforms.uvTransform.value.copy(texture.matrix);mat.uniforms.map.value=texture},undefined,()=>{mesh.userData.failed=true});
 }
 const splashGeometry=new THREE.RingGeometry(.82,1,100);
 const splashRings=Array.from({length:4},(_,i)=>{const m=new THREE.Mesh(splashGeometry,new THREE.MeshBasicMaterial({color:'#d0fbff',transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide}));m.rotation.x=-Math.PI/2;m.position.set(1.05,.072,4.4);scene.add(m);return m});
 const copy=document.createElement('div');copy.id='dive-caption';copy.innerHTML='<span class="dive-eyebrow">SS26 / A STUDY IN FLOW</span><h2>Soft Structure</h2><button class="pill" type="button">Explore this look ↗</button>';document.body.append(copy);copy.querySelector('button').onclick=()=>onLook(Math.max(activeIndex,0));
 const hint=document.createElement('button');hint.id='scroll-flow';hint.innerHTML='<span>SCROLL TO FLOW</span><i>↓</i>';hint.setAttribute('aria-label','스크롤로 물속 컬렉션 보기');hint.onclick=()=>window.scrollTo({top:innerHeight*.85,behavior:reduced?'instant':'smooth'});document.body.append(hint);
 const letters=[];
 for(const title of document.querySelectorAll('.page-heading h2,#contact>h2')){
  const label=title.textContent;title.setAttribute('aria-label',label);
  const walker=document.createTreeWalker(title,NodeFilter.SHOW_TEXT);const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
  nodes.forEach(node=>{const fragment=document.createDocumentFragment();for(const char of node.textContent){const span=document.createElement('span');span.className='liquid-letter';span.textContent=char===' '?'\u00a0':char;span.setAttribute('aria-hidden','true');fragment.append(span);letters.push({el:span,x:0,y:0,heat:0})}node.replaceWith(fragment)});
 }
 let clientX=-1000,clientY=-1000;
 window.addEventListener('pointermove',e=>{clientX=e.clientX;clientY=e.clientY},{passive:true});
 function resize(){uniforms.aspect.value=innerWidth/innerHeight;paintType()}
 window.addEventListener('resize',resize);
 function update(dt,time){
  trail.forEach(p=>{p.z+=dt});
  // Collection surfaces are handled by gallery-flow.js, without rotating DOM cards.
  if(!reduced){letters.forEach(letter=>{if(!letter.el.closest('.page:not([hidden])'))return;const r=letter.el.getBoundingClientRect();const dx=clientX-(r.left+r.width/2-letter.x),dy=clientY-(r.top+r.height/2-letter.y);const heat=Math.exp(-(dx*dx+dy*dy)/16000);const k=1-Math.exp(-dt*6);letter.heat+=(heat-letter.heat)*k;letter.x+=(dx*heat*.15-letter.x)*k;letter.y+=((dy*.2+Math.sin(time*3+r.left*.025)*8)*heat-letter.y)*k;letter.el.style.transform=`translate(${letter.x.toFixed(2)}px,${letter.y.toFixed(2)}px) rotate(${(letter.x*.25).toFixed(2)}deg)`;letter.el.style.color=`rgb(${Math.round(38+letter.heat*25)} ${Math.round(39+letter.heat*105)} ${Math.round(36+letter.heat*140)})`})}
  const isHome=isActive()&&document.body.dataset.page==='index';
  const raw=isHome?window.scrollY/innerHeight:0;progress+=(raw-progress)*(reduced?1:1-Math.exp(-dt*5.5));
  document.body.style.setProperty('--flow-scroll',Math.min(progress*1.8,1));
  document.body.classList.toggle('flow-scrolled',isHome&&progress>.2);
  let selected=-1,divePulse=0;
  cards.forEach((card,i)=>{
   const p=progress-(.32+i*1.08),appear=ease(-.04,.28,p),dive=Math.pow(ease(.42,1.08,p),1.65);const visible=isHome&&p>-.04&&p<1.2&&!!card.material.uniforms.map.value&&!card.userData.failed;
   card.visible=visible;if(!visible)return;
   if(p>=0&&p<1.08)selected=i;
   const mobile=innerWidth<650;card.scale.setScalar(mobile?.75:1);
   const x=1.05+(i-1)*.08;const y=THREE.MathUtils.lerp(2.6,3.45,appear)-dive*6.8;
   card.position.set(x,y,4.4-dive*2.6);card.scale.multiplyScalar(1-dive*.38);
   card.quaternion.copy(camera.quaternion);card.rotateX(reduced?0:-dive*Math.PI*.48);card.rotateZ(reduced?0:(1-appear)*-.15+Math.sin(time*.65+i)*.017);
   const mat=card.material;mat.uniforms.time.value=time;mat.uniforms.dive.value=reduced?0:dive;mat.uniforms.opacity.value=appear*(1-ease(1.02,1.19,p));
   divePulse=Math.max(divePulse,Math.sin(dive*Math.PI));
  });
  splashRings.forEach((ring,i)=>{const phase=(time*.38+i*.23)%1;const s=.5+phase*3.5;ring.scale.setScalar(s);ring.material.opacity=isHome&&!reduced?divePulse*(1-phase)*.21:0;ring.visible=ring.material.opacity>.001});
  const names=['Soft Structure','In Between','Free Form'];if(selected!==activeIndex&&selected>=0){copy.querySelector('h2').textContent=names[selected];copy.querySelector('.dive-eyebrow').textContent=`0${selected+1} / SS26 — A STUDY IN FLOW`;}activeIndex=selected;
  const captionVisible=isHome&&selected>=0&&!document.body.classList.contains('exploring');
  copy.classList.toggle('visible',captionVisible);copy.inert=!captionVisible;copy.setAttribute('aria-hidden',String(!captionVisible));
  const hintVisible=isHome&&progress<.15;hint.classList.toggle('visible',hintVisible);hint.disabled=!hintVisible;hint.setAttribute('aria-hidden',String(!hintVisible));
  const opacity=parseFloat(getComputedStyle(document.querySelector('.hero-copy')).opacity)||0;
  textMaterial.uniforms.visibility.value=isHome&&typeReady?opacity*(1-ease(.03,.38,progress)):0;
  return {progress,divePulse};
 }
 function renderText(){if(textMaterial.uniforms.visibility.value<=.001)return;const wasClear=renderer.autoClear;renderer.autoClear=false;renderer.clearDepth();renderer.render(overlayScene,overlayCamera);renderer.autoClear=wasClear}
 return {uniforms,update,renderText,resize};
}

