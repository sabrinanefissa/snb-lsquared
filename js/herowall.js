/* HERO WALL - the screen count is drawn in code: glowing blue, gold and white screens, no photographs.
   hero.js drives it through window.LSQWall.show(n) and .stop(). */
(()=>{
const cv=document.getElementById('h_wall'),cx=cv.getContext('2d');
const bl=document.getElementById('h_bloom'),bx=bl.getContext('2d');
const hero=document.getElementById('hero'),num=document.getElementById('h_num'),word=document.getElementById('h_word');
if(!cv||!hero)return;
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const PHONE=matchMedia('(max-width: 760px)');
const BLUE=[86,176,228],GOLD=[246,170,34],WHITE=[208,222,238],OFF=[9,13,19];           // L Squared blue, and an orange pushed toward yellow gold
let W=0,H=0,D=1;
function size(){D=Math.min(2,window.devicePixelRatio||1);W=hero.clientWidth;H=hero.clientHeight;cv.width=W*D;cv.height=H*D;bl.width=Math.ceil(W/4);bl.height=Math.ceil(H/4);cx.setTransform(D,0,0,D,0,0);sprites={};if(state)(state.inf?layoutInf():layout(state.n));}
addEventListener('resize',size);

/* one glowing screen, pre-rendered per colour and size so 500 of them stay cheap */
let sprites={};
function sprite(col,w,h){
  const key=col.join()+'|'+Math.round(w)+'x'+Math.round(h);if(sprites[key])return sprites[key];
  const pad=Math.max(12,w*.55),c=document.createElement('canvas');c.width=(w+pad*2)*D;c.height=(h+pad*2)*D;
  const g=c.getContext('2d');g.setTransform(D,0,0,D,0,0);
  const r=Math.max(1.5,w*.035),rgb=col.join(',');
  if(col===OFF){ // a screen that is switched off: no light at all
    g.fillStyle='rgb(9,13,19)';rr(g,pad,pad,w,h,r);g.fill();g.lineWidth=1;g.strokeStyle='rgba(120,150,180,.16)';rr(g,pad,pad,w,h,r);g.stroke();
    return sprites[key]={c,pad};}
  // soft neon thrown wide around the screen, in three passes so it is dense near the edge and fades far out
  g.fillStyle=`rgba(${rgb},.9)`;g.shadowColor=`rgba(${rgb},1)`;
  for(const b of [.98,.6,.28]){g.shadowBlur=pad*b;rr(g,pad,pad,w,h,r);g.fill();}
  g.shadowBlur=0;
  // the panel itself: brighter in the middle, a touch of falloff to the edges
  const lg=g.createLinearGradient(0,pad,0,pad+h);
  lg.addColorStop(0,`rgba(${col.map(v=>Math.round(v*.94)).join(',')},1)`);lg.addColorStop(.6,`rgba(${col.map(v=>Math.round(v*.84)).join(',')},1)`);lg.addColorStop(1,`rgba(${col.map(v=>Math.round(v*.7)).join(',')},1)`);
  g.fillStyle=lg;rr(g,pad,pad,w,h,r);g.fill();
  const rg=g.createRadialGradient(pad+w*.5,pad+h*.42,0,pad+w*.5,pad+h*.42,w*.62);rg.addColorStop(0,'rgba(255,255,255,.12)');rg.addColorStop(.6,'rgba(255,255,255,.04)');rg.addColorStop(1,'rgba(255,255,255,0)');
  g.fillStyle=rg;rr(g,pad,pad,w,h,r);g.fill();
  // no dark bezel: a lit neon rim that spills over the frame
  g.lineWidth=Math.max(1,w*.02);g.strokeStyle=`rgba(${col.map(v=>Math.min(255,v+24)).join(',')},.75)`;g.shadowColor=`rgba(${rgb},1)`;g.shadowBlur=pad*.35;
  rr(g,pad,pad,w,h,r);g.stroke();g.shadowBlur=0;
  return sprites[key]={c,pad};
}
function rr(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();}

/* fit N 16:9 screens into the window as large as they go */
const AR=16/9;
function grid(n){ // the wall always fills the window: full rows, edge to edge, screens close to 16:9
  if(n===1)return {c:1,r:1};
  let best=null;
  for(let c=1;c<=Math.min(n,60);c++)for(const r of [Math.floor(n/c),Math.ceil(n/c)]){ if(r<1)continue;
    const ratio=(W/c)/(H/r),off=Math.abs(Math.log(ratio/AR)),miss=Math.abs(c*r-n)/n;
    const score=off*1.0+miss*(n<=10?40:6);                 // small counts must be exact, big walls may be a few off
    if(!best||score<best.score)best={c,r,score};}
  return best;
}
let state=null;
function layout(n){
  bl.style.opacity=n>=100?.76:.88;
  if(n>=500){layoutConvey(Math.min(34,Math.max(12,Math.round(W/58))),n,false);return;}
  const g=grid(n),m=Math.max(12,W*.014),gapf=.3;
  const cw=(W-m*2)/(g.c+(g.c-1)*gapf),gap=cw*gapf;let ch=(H-m*2-(g.r-1)*gap)/g.r,y0=m;
  if(n<=10){ch=Math.min(ch,cw/AR);y0=(H-(g.r*ch+(g.r-1)*gap))/2;}
  if(n===1){const w1=Math.min(W-m*2,Math.max(W*.34,300),H*.5*AR);state={n,cw:w1,ch:w1/AR,cells:[{x:(W-w1)/2,y:(H-w1/AR)/2,i:0,j:0,ph:0}],born:performance.now(),inf:false};return;}
  const cells=[];
  for(let j=0;j<g.r;j++)for(let i=0;i<g.c;i++)cells.push({x:m+i*(cw+gap),y:y0+j*(ch+gap),i,j,ph:((i*7+j*13)%17)/17});
  state={n,cw,ch,cells,born:performance.now(),inf:false};
}
/* the big walls: small screens on conveyors that never stop. Rows run sideways, each its own way and pace.
   Infinite also has bands of columns running up and down; rows fade out as they pass under a column band, so nothing is ever cut */
const fr=v=>v-Math.floor(v);
const hsh=(a,b)=>fr(Math.sin(a*127.1+b*311.7)*43758.5453);
function layoutConvey(cols,n,inf){
  const gapf=.3,px=W/cols,cw=px/(1+gapf),gap=px-cw,rows=Math.max(3,Math.round(H/(cw/AR+gap))),py=H/rows,ch=py-gap;
  const cut=inf?[0,.27,.41,.59,.73,1].map(f=>Math.round(f*cols)):[0,cols],zones=[];
  for(let z=0;z<cut.length-1;z++)zones.push({i0:cut[z],i1:cut[z+1],col:z%2===1});
  const sp=(k,base)=>(base+hsh(k,5)*base*1.3)*(k%2?1:-1);
  bl.style.opacity=.7;
  state={n,cw,ch,gap,px,py,cols,rows,zones,inf,convey:true,born:performance.now(),
    rs:Array.from({length:rows},(_,j)=>sp(j+1,inf?26:20)),cs:Array.from({length:cols},(_,i)=>sp(i+11,inf?22:18))};
}
/* infinite: a floor and a ceiling of screens running away to a horizon at the exact centre, where the words sit */
function layoutInf(){bl.style.opacity=.45;state={n:Infinity,inf:true,persp:true,born:performance.now()};}
const PAINT=new Map();
function paint(col){let p=PAINT.get(col);if(!p){p=col===OFF?{face:'rgb(9,13,19)',rim:'rgba(120,150,180,.16)',glow:null}:
  {face:`rgb(${col.map(v=>Math.round(v*.86)).join(',')})`,rim:`rgba(${col.map(v=>Math.min(255,v+24)).join(',')},.8)`,glow:`rgba(${col.join(',')},.95)`};p.id=(PAINT.size+1)*10;PAINT.set(col,p);}return p;}
function drawPersp(t,age){
  // every screen stays a true 16:9 rectangle. Depth comes from scale alone: each row is a fixed step smaller than the one before,
  // and all of them converge on the horizon at the centre. Floor and ceiling travel away together.
  // phone only: a tall window gets more, smaller rows so the floor and ceiling read as depth, not a few big screens
  const q=PHONE.matches?.85:.78,gp=1.3,cwS=300,chS=cwS/AR,Yc=chS*gp*(1+q)/(2*(1-q)),mx=W/2,my=H/2;
  const s0=(my*1.06)/(Yc-chS/2),sEnd=(H*.06)/Yc,N=Math.ceil(Math.log(sEnd/s0)/Math.log(q))+1,T=reduce?0:(t-state.born)*.001*.3;
  for(let k=0;k<N;k++){
    const e=(k+T)%N,sc=s0*Math.pow(q,e),yc=Yc*sc,w=cwS*sc,pitch=w*gp;
    const aD=sst((yc-H*.078)/(H*.15));if(aD<=0)continue;
    const ap=reduce?1:sst((age-e/N*900)/400),half=Math.ceil(mx/pitch)+1;
    for(let i=-half;i<half;i++){
      const xc=mx+(i+.5)*pitch;if(xc+w<0||xc-w>W)continue;
      for(const sg of [1,-1]){
        const ii=i+300,jj=k+(sg>0?0:137),L=look(ii,jj,t),off=L.col===OFF,seed=ii*73+jj*131+1;
        let fl=1;if(!reduce&&!off){const f1=.7+.6*hsh(seed,3),f2=.7+.6*hsh(seed,4);fl=.8+.2*(.6*Math.sin(t*.0012*f1+seed)+.4*Math.sin(t*.0019*f2+seed*2.3));}
        const a=aD*ap*fade*fl*(off?.9*Math.max(.3,L.level):(.06+.94*L.level));if(a<=.01)continue;
        const sp=sprite(L.col,cwS,chS),dw=(cwS+sp.pad*2)*sc,dh=(chS+sp.pad*2)*sc;
        cx.globalAlpha=Math.min(1,a);cx.drawImage(sp.c,xc-dw/2,my+sg*yc-dh/2,dw,dh);
      }
    }
  }
  cx.shadowBlur=0;cx.globalAlpha=fade;
  // the glow on the horizon
  cx.save();cx.globalCompositeOperation='lighter';cx.translate(mx,my);cx.scale(1,.1);
  const hz=cx.createRadialGradient(0,0,0,0,0,W*.6);hz.addColorStop(0,'rgba(86,176,228,.34)');hz.addColorStop(.5,'rgba(86,176,228,.12)');hz.addColorStop(1,'rgba(86,176,228,0)');
  cx.fillStyle=hz;cx.fillRect(-W,-H*5,W*2,H*10);cx.restore();
  // the sides fall away softly
  cx.globalAlpha=fade;for(const [xa,xb] of [[0,W*.14],[W,W*.86]]){const sd=cx.createLinearGradient(xa,0,xb,0);sd.addColorStop(0,'rgba(0,0,0,.7)');sd.addColorStop(1,'rgba(0,0,0,0)');cx.fillStyle=sd;cx.fillRect(Math.min(xa,xb),0,W*.14,H);}
}
const sst=e=>{e=Math.max(0,Math.min(1,e));return e*e*(3-2*e);};
function drawConvey(t,age){
  const S=state,T=reduce?0:(t-S.born)*.001,g2=S.gap/2;
  for(const Z of S.zones){const X0=Z.i0*S.px,nz=Z.i1-Z.i0,Wz=nz*S.px,X1=X0+Wz;
    if(Z.col){
      for(let i=Z.i0;i<Z.i1;i++)for(let k=0;k<S.rows;k++){
        const ap=reduce?1:sst((age-fr(i*.362+k*.814)*560)/300);if(ap<=0)continue;
        const y=((k*S.py+T*S.cs[i])%H+H)%H,x=X0+(i-Z.i0)*S.px+g2;
        drawCell(x,y+g2,S.cw,S.ch,i,k,t,ap*fade);if(y+S.py>H)drawCell(x,y-H+g2,S.cw,S.ch,i,k,t,ap*fade);}
    }else{
      const fadeL=Z.i0>0,fadeR=Z.i1<S.cols;
      const edge=x=>{const c=x+S.cw/2;let f=1;if(fadeL)f*=sst((c-X0)/S.px-.35);if(fadeR)f*=sst((X1-c)/S.px-.35);return f;};
      for(let j=0;j<S.rows;j++)for(let k=0;k<nz;k++){
        const ap=reduce?1:sst((age-fr((k+Z.i0)*.362+j*.814)*560)/300);if(ap<=0)continue;
        const x=X0+((k*S.px+T*S.rs[j])%Wz+Wz)%Wz+g2,y=j*S.py+g2,id=k+Z.i0;
        let f=edge(x);if(f>0)drawCell(x,y,S.cw,S.ch,id,j,t,ap*fade*f);
        if(x+S.px>X1){f=edge(x-Wz);if(f>0)drawCell(x-Wz,y,S.cw,S.ch,id,j,t,ap*fade*f);}}
    }}
}
/* colours are dealt out on an even lattice, never at random, so no colour bunches up: mostly blue, some gold, some white, a few off.
   Every screen changes on the same slow beat but at its own moment, and dips to dark as it changes */
function look(i,j,t){
  if(state&&state.n===1){const m=reduce?-1:-Math.cos((t-state.born)*.0009);return {col:m<0?BLUE:GOLD,level:Math.pow(Math.min(1,Math.abs(m)*1.9),.7)};}
  const v=fr(i*.7548776662+j*.5698402910),u=reduce?.5:(t/5200+fr(i*.362+j*.814)),k=Math.floor(u),f=u-k,r=fr(v+k*.6180339887);
  const col=r<.58?BLUE:r<.76?GOLD:r<.89?WHITE:(state&&state.n<=10?BLUE:OFF);   // ten screens is too few to leave any switched off
  return {col,level:sst(Math.min(f,1-f)*7)};
}
let textBox=null;
function dimNear(x,y,cw,ch){ // screens behind the count step back so the words read
  if(!textBox)return 1;const cxm=x+cw/2,cym=y+ch/2;
  const dx=Math.max(0,Math.abs(cxm-textBox.x)-textBox.w/2)/(textBox.w*.22),dy=Math.max(0,Math.abs(cym-textBox.y)-textBox.h/2)/(textBox.h*.55);
  const d=Math.min(1,Math.hypot(dx,dy));return .16+.84*d*d*(3-2*d);
}
function drawCell(x,y,cw,ch,i,j,t,appear){
  const L=look(i,j,t),one=state&&state.n===1,off=L.col===OFF,seed=i*73+j*131+1;
  // every lit screen flickers: a constant small shimmer, plus quick drops now and then
  let fl=1;if(!reduce&&!off){const f1=.7+.6*hsh(seed,3),f2=.7+.6*hsh(seed,4);fl=.8+.2*(.6*Math.sin(t*.0012*f1+seed)+.4*Math.sin(t*.0019*f2+seed*2.3));}   // slow and soft, a few seconds per swell, never a strobe
  const a=appear*fl*(off?.9*Math.max(.3,L.level):(.06+.94*L.level))*(one?.95:dimNear(x,y,cw,ch)),sp=sprite(L.col,cw,ch);
  const s=.88+.12*appear,dw=(cw+sp.pad*2)*s,dh=(ch+sp.pad*2)*s;
  cx.globalAlpha=Math.max(0,Math.min(1,a));cx.drawImage(sp.c,x+cw/2-dw/2,y+ch/2-dh/2,dw,dh);
}
let fade=1,fadeTo=1;
function frame(t){
  requestAnimationFrame(frame);if(!active||!W)return;
  cx.globalAlpha=1;cx.globalCompositeOperation='source-over';cx.fillStyle='#000';cx.fillRect(0,0,W,H);
  if(state){
    fade+=(fadeTo-fade)*.16;cx.globalCompositeOperation='source-over';
    const rb=document.querySelector('#hero .read').getBoundingClientRect(),nb=num.getBoundingClientRect(),wb=word.getBoundingClientRect();
    const L=Math.min(nb.width?nb.left:wb.left,wb.left),R=Math.max(nb.right,wb.right);textBox={x:(L+R)/2,y:(wb.top+wb.bottom)/2,w:(R-L)+60,h:wb.height+30};
    const age=t-state.born;
    if(state.persp)drawPersp(t,age);
    else if(state.convey)drawConvey(t,age);
    else{
      const n=state.cells.length,spread=Math.min(520,140+n*1.1);
      for(const c of state.cells){const d=(c.ph*.55+((c.i+c.j)%9)/9*.45)*spread,ap=reduce?1:Math.max(0,Math.min(1,(age-d)/260));
        if(ap>0)drawCell(c.x,c.y,state.cw,state.ch,c.i,c.j,t,ap*fade);}
    }
  }
  bx.globalCompositeOperation='copy';bx.drawImage(cv,0,0,bl.width,bl.height);
}
/* driven by hero.js */
let active=false,seen=true;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
new IntersectionObserver(e=>{seen=e[0].isIntersecting;active=seen&&!!state&&!document.hidden;},{threshold:.02}).observe(hero);
document.addEventListener('visibilitychange',()=>{active=seen&&!!state&&!document.hidden;});
async function show(n){
  if(!W)size();
  if(state&&active){fadeTo=0;await wait(230);}
  n==='inf'?layoutInf():layout(n);fade=0;fadeTo=1;active=seen&&!document.hidden;
}
function stop(){state=null;active=false;cx.globalAlpha=1;cx.fillStyle='#000';cx.fillRect(0,0,W,H);bx.globalCompositeOperation='copy';bx.drawImage(cv,0,0,bl.width,bl.height);}
window.LSQWall={show,stop};
size();requestAnimationFrame(frame);
})();
