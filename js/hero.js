/* HERO - LOCKED. Copied verbatim from homepage-mock/index.html. Do not retime or reword. */
/* animated hero: full-width screen count, then One location, One platform, the logo.
   Tap or click anywhere on the hero to jump to the next scene. */
(function(){
const A='assets/',V='?v=r52';
/* r18: the count is a code-drawn wall of glowing screens (js/herowall.js), no photographs. 200 removed. */
const BEATS=[[1,'Screen'],[10,'Screens'],[50,'Screens'],[100,'Screens'],[500,'Screens']];
const hero=document.getElementById('hero'),num=document.getElementById('h_num'),word=document.getElementById('h_word'),
bigA=document.getElementById('h_bigA'),bigB=document.getElementById('h_bigB'),logo=document.getElementById('h_logo');
if(!hero)return;
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
if(reduce){logo.classList.add('on','full');hero.classList.add('end');return;}
const wall=window.LSQWall||{show:async()=>{},stop(){}};
let visible=true,skip=null;
new IntersectionObserver(e=>{visible=e[0].isIntersecting;},{threshold:.05}).observe(hero);
hero.addEventListener('click',()=>{if(skip){const f=skip;skip=null;f();}});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
/* a hold the visitor can cut short by tapping the hero */
const hold=ms=>new Promise(r=>{const t=setTimeout(()=>{skip=null;r();},ms);skip=()=>{clearTimeout(t);r();};});
const whenVisible=async()=>{while(!visible||document.hidden)await wait(400);};
function countTo(t,dur){return new Promise(res=>{const s=parseInt(num.textContent,10)||0,t0=performance.now();let done=false;
const fin=()=>{if(done)return;done=true;skip=null;num.textContent=t;res();};skip=fin;
(function step(x){if(done)return;const k=Math.min(1,(x-t0)/dur),e=1-Math.pow(1-k,3);num.textContent=Math.round(s+(t-s)*e);
 k<1?requestAnimationFrame(step):fin();})(t0);});}
async function run(){
  await whenVisible();
  hero.classList.remove('end');logo.classList.remove('on','full');bigA.classList.remove('on');bigB.classList.remove('on');
  num.textContent='';word.textContent='';wall.stop();
  await wait(300);
  for(const [n,l] of BEATS){word.textContent=l;wall.show(n);await countTo(n,520);await hold(n>=500?3600:1000);}
  num.textContent='';word.textContent='Infinite screens';await wall.show('inf');await hold(4200);
  hero.classList.add('end');await wait(900);wall.stop();
  bigA.classList.add('on');await hold(3000);
  bigA.classList.remove('on');await wait(450);
  logo.classList.add('on');await hold(650);
  logo.classList.add('full');await hold(4200);
  logo.classList.remove('on');await wait(1300);
  run();
}
run();
})();
