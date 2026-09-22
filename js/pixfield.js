/* Interactive L-mark cursor field. Ported from homepage-v4/js/main.js via homepage-mock. */
/* interactive pixel-logo field (ported from homepage-v4 main.js, effect #1) */
(function(){
  const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
  const clamp=(v,a,b)=>v<a?a:v>b?b:v;
  const coarse=matchMedia('(hover:none),(pointer:coarse)').matches;
  const ptr={x:-1e4,y:-1e4,t:-1e4,has:false};
  window.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;ptr.x=e.clientX;ptr.y=e.clientY;ptr.t=performance.now();ptr.has=true;},{passive:true});
  /* r43, phone only: a touch puts the mark where the finger is, the same way
     the pointer does on desktop. Above 760px nothing here runs. */
  const tap={x:-1e4,y:-1e4,t:-1e4};
  const onTouch=e=>{if(e.pointerType!=='touch'||innerWidth>760)return;tap.x=e.clientX;tap.y=e.clientY;tap.t=performance.now();kick();};
  window.addEventListener('pointerdown',onTouch,{passive:true});
  window.addEventListener('pointermove',onTouch,{passive:true});
  document.documentElement.addEventListener('pointerleave',()=>{ptr.has=false;});
  const fxs=[];let raf=0,lastT=0;
  const loop=now=>{raf=0;const dt=lastT?Math.min(64,now-lastT):16.7;lastT=now;let any=false;
    for(const f of fxs)if(f.on){f.frame(now,dt);any=true;}if(any&&!reduce)raf=requestAnimationFrame(loop);else lastT=0;};
  const kick=()=>{if(!raf&&!reduce)raf=requestAnimationFrame(loop);};
  const io='IntersectionObserver'in window?new IntersectionObserver(es=>{es.forEach(e=>{const f=e.target.__fx;if(f){f.on=e.isIntersecting;if(f.on)kick();}});},{threshold:0,rootMargin:'-2px'}):null;
  const ro='ResizeObserver'in window?new ResizeObserver(es=>{es.forEach(e=>{const f=e.target.__fx;if(f&&f.resize){f.resize();if(reduce||!f.on)f.still();}});}):null;
  const register=(el,f)=>{f.el=el;f.on=false;el.__fx=f;fxs.push(f);if(io)io.observe(el);if(ro&&f.resize)ro.observe(el);if(f.resize)f.resize();f.still();return f;};
  const through=r=>clamp((innerHeight-r.top)/(innerHeight+r.height),0,1);
  const LOGO=[1,2,2,1,0,2,1,1,2];
  class Grid{
    constructor(cv,o){this.cv=cv;this.o=o;this.c=cv.getContext('2d');this.base=document.createElement('canvas');}
    resize(){const r=this.cv.getBoundingClientRect();const d=Math.min(window.devicePixelRatio||1,this.o.dpr||2);
      if(this.e&&Math.abs(r.width-this.w)<1&&Math.abs(r.height-this.h)<1&&d===this.d)return;
      this.w=Math.max(1,r.width);this.h=Math.max(1,r.height);this.d=d;
      for(const cv of[this.cv,this.base]){cv.width=Math.round(this.w*d);cv.height=Math.round(this.h*d);}
      this.c.setTransform(d,0,0,d,0,0);
      const s=this.o.cell(this.w);this.s=s;this.g=this.o.gap(this.w);
      this.cols=Math.ceil(this.w/s)+1;this.rows=Math.ceil(this.h/s)+1;
      this.ox=(this.w-(this.cols-1)*s)/2-s/2;this.oy=(this.h-(this.rows-1)*s)/2-s/2;
      this.e=new Float32Array(this.cols*this.rows);this.k=new Uint8Array(this.cols*this.rows);
      const b=this.base.getContext('2d');b.setTransform(d,0,0,d,0,0);b.clearRect(0,0,this.w,this.h);
      b.fillStyle=this.o.baseFill;const q=s-this.g;
      for(let j=0;j<this.rows;j++)for(let i=0;i<this.cols;i++){b.fillRect(this.ox+i*s+this.g/2,this.oy+j*s+this.g/2,q,q);}}
    cellAt(px,py){return[Math.floor((px-this.ox)/this.s),Math.floor((py-this.oy)/this.s)];}
    set(i,j,v,k){if(i<0||j<0||i>=this.cols||j>=this.rows)return;const n=j*this.cols+i;if(v>this.e[n]){this.e[n]=v;this.k[n]=k;}}
    logo(px,py,v){const[ci,cj]=this.cellAt(px,py);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const t=LOGO[(dy+1)*3+(dx+1)];if(t)this.set(ci+dx,cj+dy,v,t);}}
    decay(dt){const f=Math.pow(this.o.decay,dt/16.7);const e=this.e;for(let n=0;n<e.length;n++)e[n]=e[n]<.004?0:e[n]*f;}
    draw(){const c=this.c,s=this.s,q=s-this.g,h=this.g/2;c.clearRect(0,0,this.w,this.h);c.drawImage(this.base,0,0,this.w,this.h);
      const gd=this.o.glow||0,gu=this.guard;
      for(let pass=1;pass<=2;pass++){const col=pass===1?this.o.lit1:this.o.lit2;if(!col)continue;c.fillStyle=col[0];
        if(gd){c.shadowBlur=gd;c.shadowColor=col[0];}
        for(let j=0;j<this.rows;j++)for(let i=0;i<this.cols;i++){const n=j*this.cols+i,v=this.e[n];
          if(v<.01||this.k[n]!==pass)continue;
          const x=this.ox+i*s+h,y=this.oy+j*s+h;
          /* cells behind the type are held back so they never fight it */
          let a=Math.min(1,v)*col[1];
          /* on a phone the guarded type is much bigger relative to the
             canvas, so the same .18 would erase the field almost entirely;
             desktop is untouched */
          if(gu&&x+q>gu.l&&x<gu.r&&y+q>gu.t&&y<gu.b)a*=(this.w<760?.5:.18);
          c.globalAlpha=a;c.fillRect(x,y,q,q);}
        if(gd)c.shadowBlur=0;}
      c.globalAlpha=1;}
  }
  /* v7: at rest the field is empty. Nothing is drawn until the visitor moves a
     pointer inside it, so there is never a stray block sitting in a corner.
     On a touch device it is one slow drift across the centre instead. */
  const feel=(el,now,w,h)=>{const r=el.getBoundingClientRect();
    if(coarse){
      if(innerWidth<=760&&now-tap.t<1600&&tap.x>=r.left&&tap.x<=r.right&&tap.y>=r.top&&tap.y<=r.bottom)return{x:tap.x-r.left,y:tap.y-r.top,v:1,r,real:true};
      const p=through(r);return{x:w*(.14+.72*p),y:h*(.5+.10*Math.sin(p*Math.PI*2)),v:.8,r};}
    const inside=ptr.has&&ptr.x>=r.left&&ptr.x<=r.right&&ptr.y>=r.top&&ptr.y<=r.bottom;
    if(inside&&now-ptr.t<1800)return{x:ptr.x-r.left,y:ptr.y-r.top,v:1,r,real:true};
    return null;};
  document.querySelectorAll('[data-fx="pixfield"]').forEach(cv=>{
    const blue=cv.closest('#statement');
    const dark=cv.closest('#numbers');
    const g=new Grid(cv,{cell:w=>w<760?22:34,gap:w=>w<760?3:4,decay:dark?.955:.94,dpr:1.5,
      baseFill:'transparent',
      glow:dark?18:0,
      lit1:blue?['#0b1a2b',.6]:['#56B0E4',.5],
      lit2:blue?['#c4e5f8',.75]:['#7CC2EC',.95]});
    const panel=cv.parentElement;
    /* in the figures section the type owns the centre, so the field is told
       where it is and keeps out of its way */
    const setGuard=()=>{
      if(!dark)return;
      const t=panel.querySelector('.beats__stage');if(!t)return;
      const r=cv.getBoundingClientRect(),q=t.getBoundingClientRect();
      g.guard={l:q.left-r.left-18,t:q.top-r.top-18,r:q.right-r.left+18,b:q.bottom-r.top+18};
    };
    register(panel,{resize:()=>{g.resize();setGuard();},
      still:()=>{g.e.fill(0);g.draw();},
      frame:(now,dt)=>{g.decay(dt);const f=feel(panel,now,g.w,g.h);if(f)g.logo(f.x,f.y,f.v);g.draw();}});
  });
})();
