(function(){
'use strict';
var M=Math,AR=Array.isArray,T0=1767225600000,HL=30240,HLX=129600,L2=M.LN2,K='daybrief:v1',KS='daybrief:s1',
SLOW=/^(analysis|research|papers|techniques|tools|video)$/,
TL={a:'AI models',g:'AI agents',p:'Pentesting',v:'Vulnerabilities',m:'Markets',s:'Singapore',b:'Startups & business'},
SN={ai:'AI',cyber:'Cyber',markets:'Markets',business:'Business',singapore:'Singapore'},
SIG={imp:[0,1,0,0,1],open:[1,0,1,1],mis:[-.8,0,0],unmis:[.8,0,0],read:[.5,0,0],go:[1,0,1,1],like:[2,0,1],unlike:[-2,0,-1],share:[1,0,0]},
clip=(v,a,b)=>v<a?a:v>b?b:v,
fade=(t,n,h)=>M.pow(.5,(n-t)/h),
r3=v=>M.round(v*1e3)/1e3,
now=()=>M.floor((Date.now()-T0)/6e4),
i8=s=>s.id.slice(0,8),
tk=s=>s.top[1]?s.top:'g:'+s.top,
lab=t=>t[1]?SN[t.slice(2)]:TL[t],
cmp=(a,b)=>a.er-b.er||(a.id<b.id?-1:a.id>b.id),
fresh=()=>({v:1,on:1,f:{},tot:[0,0,0],op:[0,0],x:{},hide:{},like:{},gone:{},seen:{},vis:[0,0]}),
norm=(p,q=fresh())=>{if(p&&p.v===1)for(var k in q){var a=p[k],b=q[k],j;if(a!=null&&typeof a==typeof b&&(AR(b)?AR(a)&&a.length==b.length&&a.every(x=>typeof x=='number'):!AR(a))){if(typeof b=='object'&&!AR(b))for(j in a)if(/^(f|x|seen)$/.test(k)?!AR(a[j]):typeof a[j]!='number')delete a[j];q[k]=a;}}return q;},
raw=()=>{try{return localStorage.getItem(K);}catch(e){return 0;}},
load=(r=raw())=>{try{return norm(JSON.parse(r));}catch(e){return fresh();}},
keep=(o,x,t,m)=>Object.keys(o).filter(k=>t(o[k])<m?!delete o[k]:1).sort((a,b)=>t(o[b])-t(o[a])).slice(x).forEach(k=>delete o[k]),
cap=(p,n,f=p.f,ks=Object.keys(f))=>{ks[400]&&ks.sort((a,b)=>(nOf(p,b,n)>=.05)-(nOf(p,a,n)>=.05)||f[b][2]-f[a][2]).slice(400).forEach(k=>delete f[k]);keep(p.seen,1e3,v=>v[1],n-11520);keep(p.gone,300,v=>v,n-20160);keep(p.like,200,v=>v);keep(p.x,50,v=>v[1]);keep(p.hide,50,v=>v);},
save=p=>{for(var i=0,j;i<2;i++){j=JSON.stringify(p);try{if(j.length<=65536)return localStorage.setItem(K,j),1;}catch(e){}keep(p.seen,Object.keys(p.seen).length>>1,v=>v[1]);}},
dv=(r,n,h)=>r?r[0]*fade(r[1],n,h):0,
stp=(p,t,n)=>dv(p.x[t],n,HLX),
nOf=(p,k,n,r=p.f[k])=>r?r[1]*fade(r[2],n,HL):0,
fk=s=>s.g.map(e=>'g:'+e[0]).concat(s.w.map(h=>'w:'+h),['s:'+s.s,'u:'+s.s+'/'+s.u,'o:'+s.o]),
rec=(p,s,k,n,vs,m)=>{var g=SIG[k],sn;fk(s).concat(0).forEach(y=>{var r=y?p.f[y]||[0,0,n]:p.tot,x=fade(r[2],n,HL),v=[r3(M.max(0,r[0]*x+g[0])),r3(r[1]*x+g[1]*(m||1)),n];y?p.f[y]=v:p.tot=v;});if(g[2])p.op=[r3(M.max(0,dv(p.op,n,HL)+g[2])),n];if(g[3]||g[4]){sn=p.seen[i8(s)]||[0,vs,0];if(g[4]&&(sn[1]!=vs||!sn[0]))sn=[sn[0]+1,vs,sn[2]];p.seen[i8(s)]=[sn[0],sn[1],sn[2]|g[3]];}},
rate=(p,n,x=fade(p.tot[2],n,HL),N=p.tot[1]*x)=>N>=20?M.max(.05,p.tot[0]*x/N):.3,
aff=(p,k,rb,n,r=p.f[k],x=r&&fade(r[2],n,HL))=>r?clip(M.log(M.max(rb,r[0]*x+10*rb)/(rb*(r[1]*x+10))),-1,1):0,
taste=(p,s,rb,n)=>{var t=0,w=.9,h=0,g=0,ws=[],a=k=>aff(p,k,rb,n);s.g.forEach(e=>{g+=e[1]*a('g:'+e[0]);h+=e[1];});if(h)t=g/h,w++;s.w.forEach(x=>nOf(p,'w:'+x,n)>=3&&ws.push(a('w:'+x)));if(ws.length)t+=.6*ws.reduce((x,y)=>x+y)/ws.length,w+=.6;return(t+.4*a('s:'+s.s)+.2*a('u:'+s.s+'/'+s.u)+.3*a('o:'+s.o))/w;},
vis=(s,a,h=s.g.reduce((x,e)=>x+e[1],0),v=(a['s:'+s.s]||0)+(a['o:'+s.o]||0))=>(s.g.forEach(e=>{v+=(a['g:'+e[0]]||0)*e[1]/h;}),clip(v,-.8,.8)),
ctx=(p,a,B,vs,n=now(),o=dv(p.op,n,HL))=>({p,n,rb:rate(p,n),be:o/(o+20),a:a||{},B,vs:vs||0}),
score=(s,c)=>{var p=c.p,sn=p.seen[i8(s)],pr=s.prev&&p.seen[s.prev.slice(0,8)],R=0,lb=M.log(s.b)-L2*M.max(0,(c.B-(s.t||c.B))/3600)/(SLOW.test(s.u)?96:36),P=c.be*taste(p,s,c.rb,c.n),X=.6*stp(p,s.top,c.n),V=vis(s,c.a),U=pr&&pr[2]&1?.4:0,m=clip(P+X+V+U,-1.5,1.5);if(s.n==1&&s.q<=1.1)m=M.min(m,.5);if(sn)R=sn[2]&1&&sn[1]<c.vs?1.5:M.min(1,.35*M.max(0,sn[0]-(sn[1]==c.vs)));s.k=[lb,P,X,V,U,R];return s.sc=lb+m-R;},
guards=(all,c,top={})=>{all.forEach(s=>{var t=top[s.s];if(!t||s.b>t.b||s.b==t.b&&s.er<t.er)top[s.s]=s;});all.forEach(s=>{var sn=c.p.seen[i8(s)],d=s.er==1?3:s.er<=3?8:99;if(s.n>=4)d=M.min(d,10);if(top[s.s]==s)d=M.min(d,stp(c.p,s.top,c.n)<0||stp(c.p,'s:'+s.s,c.n)<0?25:15);s.dl=d<99&&!(sn&&(sn[2]&1||sn[1]<c.vs||sn[0]>1))?d:0;});},
sim=(a,b)=>M.min(1,.3*(a.s==b.s)+.3*(a.top==b.top)+.2*(a.o==b.o)+.4*a.w.some(x=>b.w.includes(x))),
brk=(s,q,p,l,c)=>{var n=q.length,a=q[n-1],b=q[n-2];return c.bar&&c.bar[s.top]>=p||l<4&&a&&b&&a.s==s.s&&b.s==s.s||l<3&&p<=8&&q.filter(t=>t.top==s.top).length>=3||l<2&&q.slice(-7).filter(t=>t.o==s.o).length>=2||l<1&&s.f!='lg'&&a&&b&&a.f!='lg'&&b.f!='lg';},
best=(pool,q,p,c,l)=>{var k=null,bv=-1/0,w=q.slice(-6),i=0,s,r,v;for(;i<pool.length;i++){s=pool[i];if(s.sc<bv)break;r=0;if(l<5){if(brk(s,q,p,l,c))continue;w.forEach(t=>{r=M.max(r,sim(s,t));});}v=s.sc-.5*r;if(!k||v>bv||v==bv&&cmp(s,k)<0)bv=v,k=s;}return k;},
sur=(pool,q,p,c,last=q.slice(-5).map(t=>t.top),k=null)=>(pool.forEach(s=>{if(nOf(c.p,tk(s),c.n)<5&&!last.includes(s.top)&&stp(c.p,s.top,c.n)>=0&&!(c.bar&&c.bar[s.top]>=p)&&(!k||s.k[0]>k.k[0]||s.k[0]==k.k[0]&&cmp(s,k)<0))k=s;}),k),
pf=o=>{o=o.slice();var six=o.length>5?o.splice(5,1)[0]:0,rl=k=>k+1+(six&&k>=5?1:0);for(var t=0,j;t<5&&t<o.length;t++){if(o[t].f=='lg'||t>=2&&!o.slice(2,t).some(x=>x.f!='lg'))continue;for(j=t+1;j<t+6&&j<o.length;j++)if(o[j].f=='lg'&&!(six&&j>=5&&o[j].top==six.top)&&!o.slice(t,j).some((s,i)=>s.dl&&rl(t+i+1)>s.dl)){o.splice(t,0,o.splice(j,1)[0]);break;}}if(six)o.splice(5,0,six);return o;},
arrange=(pool,c)=>{var out=[],st=c.start||1,bf=c.before||[],p,q,k,l,G;pool.forEach(s=>{score(s,c);s.slot='';});pool=pool.slice().sort((a,b)=>b.sc-a.sc||cmp(a,b));while(pool.length){p=st+out.length;q=bf.concat(out);k=null;if(c.guards){G=pool.filter(s=>s.dl).sort((x,y)=>x.dl-y.dl||cmp(x,y));if(G.some((s,i)=>p+i>=s.dl))k=G[0];}if(k)k.slot='g';else if(p>=6&&(p-6)%8==0&&(k=sur(pool,q,p,c)))k.slot='u';for(l=0;!k&&l<6;l++)k=best(pool,q,p,c,l);out.push(k);pool.splice(pool.indexOf(k),1);}return st==1&&c.guards?pf(out):out;},
removed=(s,p)=>p.gone[i8(s)]||p.hide[s.o]&&!(s.er<=3&&!s.t),
tail=(bl,all,c,j)=>{var cut=j?0:1,mv,st;bl.forEach((s,i)=>{if(s.nr)cut=i+1;});mv=bl.slice(cut);if(!mv[1])return 0;st=all.indexOf(mv[0])+1;(c.nb||[]).forEach(t=>{c.bar[t]=st+5;});c.nb=0;return arrange(mv,Object.assign({},c,{start:st,before:all.slice(M.max(0,st-8),st-1),guards:!j}));},
ub=(e,B,a=(B-e[1])/3600)=>M.max(M.log(e[2])-L2*a/36,M.log(e[3])-L2*a/96)+1.5,
pickEds=(l,B,fl,done)=>l.filter(e=>!done.includes(e[0])&&ub(e,B)>=fl).slice(0,2),
early=(sts,c,fl,room,have,before,st)=>arrange(sts.filter(s=>!c.p.seen[i8(s)]&&!removed(s,c.p)&&!have.includes(s.id)&&score(s,c)>=fl),Object.assign({},c,{start:st,before,guards:0})).slice(0,M.max(0,room)),
mk=(d,el)=>{var g=(d.g||'').split(' ').filter(x=>x).map(x=>(x=x.split(':'),[x[0],+x[1]])),go=d.go||'';return{id:d.id,s:d.s,u:d.u||'',g,w:(d.w||'').split(' ').filter(x=>x),o:d.o,n:+d.n,q:+d.q,b:+d.b,er:+d.er,f:d.f,prev:d.prev||'',top:g.length?g[0][0]:'s:'+d.s,t:+(d.t||d.built)||0,go:go.pop?go[0]:go,gon:go.pop?go[1]:d.gon,el};},
cardModel=j=>({cls:'card card--'+j.f+(j.n>=3?' card--many':''),data:{id:j.id,s:j.s,u:j.u,g:j.g,w:j.w,o:j.o,n:j.n,q:j.q,b:j.b,er:j.er,f:j.f,go:j.go[0],gon:j.go[1],prev:j.prev||'',t:j.t,k:j.k},m:j.m||[],on:j.on,more:j.more>0?' + '+j.more+' more':'',img:j.f!='tx'&&j.img||'',ss:j.f=='lg'&&j.ss||'',href:'story/'+j.id+'.html',hl:j.hl,hk:j.gi?j.hk||j.gi:'',gi:j.gi||'',why:j.why||'',dt:j.dt,tm:j.tm,cr:j.cr?' · Image: '+j.cr:''});
if(typeof module=='object')module.exports={arrange,score,taste,aff,ctx,guards,mk,rec,cap,save,load,raw,fresh,norm,nOf,stp,sim,removed,tail,ub,pickEds,early,cardModel,TL,HL,HLX};
if(typeof document!='object'||!document.body)return;
var D=document,W=window,HT=D.documentElement,BD=D.body,
$=(s,r)=>(r||D).querySelector(s),$$=(s,r)=>[].slice.call((r||D).querySelectorAll(s)),
mq=q=>W.matchMedia(q).matches,at=(e,k,v)=>e.setAttribute(k,v),T=(e,v)=>{e.textContent=v;},cl=(e,c,f)=>e.classList.toggle(c,f),has=(e,c)=>e.classList.contains(c),
h=(t,c,x,e=D.createElement(t))=>(c&&(e.className=c),x&&T(e,x),e),
tpl=i=>$('#'+i).content.firstElementChild.cloneNode(1),
on=(e,t,f,o)=>e.addEventListener(t,f,o||{passive:1}),
idle=f=>(W.requestIdleCallback||setTimeout)(f),
RM=mq('(prefers-reduced-motion:reduce)'),NH=has(BD,'no-hearts'),NV=has(BD,'no-viewer'),
SD=(navigator.connection||{}).saveData||mq('(prefers-reduced-data:reduce)'),
sd=x=>SD?x.split(',').filter(z=>!/ (8|12)00w$/.test(z.trim())).join(','):x,
ROOT=new URL('..',D.currentScript.src).href,VSZ='(min-width:1296px) 572px, calc(55vw - 141px)',
LEAD='(max-width:600px) 100vw, (max-width:899px) 94vw, (max-width:1199px) 62vw, (max-width:1439px) 803px, 676px',
F=$('#feed'),CA=$('#caught'),FD=F?F.dataset:{},ED=FD.ed,B=+FD.built,
EL=(FD.earlier||'').split(' ').filter(x=>x).map(x=>x.split(':')),FL=M.log(+FD.min)-.5,
P=load(),N0=now(),VS=N0-P.vis[1]>30?N0:P.vis[0],Q=[],IMP={},NB=[],S1,C,SP,
hl=s=>(F?$('.card-hl',s.el):$('h1')).textContent.trim(),
out=(e,d,r=d.getBoundingClientRect())=>e.target==d&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom),
ad=(k,v)=>{S1.a[k]=r3((S1.a[k]||0)+v);},
sload=()=>{var d={ed:ED,vs:VS,a:{},gl:{},bar:{},o:{},lk:{}},s;try{s=JSON.parse(sessionStorage.getItem(KS));}catch(e){}if(!s||s.vs!=VS||F&&s.ed&&s.ed!=ED)return d;s=Object.assign(d,s);'a gl bar o lk'.split(' ').forEach(k=>{var v=s[k];if(!v||typeof v!='object'||AR(v))s[k]={};});if(!AR(s.order))delete s.order;s.er=AR(s.er)?F?s.er.filter(k=>EL.some(e=>e[0]==k)):s.er:[];return s;},
ssave=()=>{try{sessionStorage.setItem(KS,JSON.stringify(S1));}catch(e){}},
ev=f=>{Q.push(f);f(P);},
flush=()=>{try{var r=raw(),p=r===0?P:load(r),n=now();if(p!=P)Q.forEach(f=>f(p));Q=[];p.vis=[VS,n];cap(p,n);save(p);P=p;if(F)S1.order=$$('.card',F).map(e=>e.id.slice(2));}catch(e){}ssave();},
say=(m,t,e=$$('dialog[open] [role=status]').pop()||$('#status'))=>{T(e,m);if(t){cl(e,'toast',!0);clearTimeout(say.t);say.t=setTimeout(()=>cl(e,'toast',!1),2e3);}},
cards=()=>$$('.card',F).filter(e=>!e.hidden&&!has(e,'card--gone')),
sib=(e,d,l=cards())=>l[l.indexOf(e)+d],
pos=()=>{var v=$$('article',F).filter(e=>!e.hidden),n=$('.end-card',F)?v.length:-1;v.forEach((e,i)=>{at(e,'aria-posinset',i+1);at(e,'aria-setsize',n);});},
sig=(s,k,m,n=now())=>P.on&&ev(p=>rec(p,s,k,n,VS,m)),
like=(s,b)=>{var i=i8(s),y=!P.like[i],m=y?1:-1,n=now();ev(p=>{rec(p,s,y?'like':'unlike',n,VS);y?p.like[i]=n:delete p.like[i];});ad(tk(s),.35*m);ad('o:'+s.o,.15*m);ad('s:'+s.s,.1*m);if(y)S1.lk[s.top]=1;[b].concat($$('.act-like',s.el)).forEach(x=>{if(x){at(x,'aria-pressed',y);y&&!RM&&x.animate([{transform:'scale(1)'},{transform:'scale(1.25)'},{transform:'scale(1)'}],160);}});flush();want();},
share=s=>{var u=ROOT+'story/'+s.id+'.html',n=now();ev(p=>rec(p,s,'share',n,VS));flush();navigator.share?navigator.share({title:hl(s),url:u}).catch(()=>0):(navigator.clipboard?navigator.clipboard.writeText(u):Promise.reject()).then(()=>say('Link copied',1),()=>say("Couldn't copy the link: "+u,1));},
goRec=s=>{sig(s,'go');ad(tk(s),.25);ad('o:'+s.o,.1);flush();},
why=s=>{var c=P.on?C:ctx(fresh(),0,B,VS),p=c.p,l=lab(s.top),a=x=>c.be*aff(p,x,c.rb,c.n),g=0,gh=0,k,ts,to,mx;
if(s.slot==null)k=$$('.card',F).map(e=>e.$).filter(x=>!x.t&&!x.el.hidden),arrange(k,Object.assign({},c,{guards:1})),k.forEach(x=>score(x,c));k=s.k||[];
if(!s.t&&(s.slot=='g'||s.er<=3))return s.n>=4?'Reported by '+s.n+' outlets: one of the biggest stories in this edition.':'One of the top stories in this edition.';
if(s.slot=='u')return'Something different: a top '+l+' story.';
if(k[3]>0&&k[3]>=M.max(k[1],k[2],k[4])&&S1.lk[s.top])return'Because you liked a story about '+l+'.';
if(k[2]>0)return'Because you asked for more '+l+'.';
if(k[4]>0)return'An update on a story you opened on '+new Date(T0+p.seen[s.prev.slice(0,8)][1]*6e4).toLocaleDateString('en-GB',{weekday:'short',timeZone:'Asia/Singapore'})+'.';
s.g.forEach(e=>{g+=e[1]*a('g:'+e[0]);gh+=e[1];});g=gh?g/gh:0;ts=.4*a('s:'+s.s);to=.3*a('o:'+s.o);mx=M.max(g,ts,to);
return mx>0?'Because you often open '+(mx==g?l+' stories.':mx==ts?SN[s.s]+' stories.':'stories from '+s.gon+'.'):s.t?'From '+s.lbl+"'s edition, not seen yet.":'Ranked by importance in this edition.';},
onm=s=>{var n=$('.src-name',s.el);return n?n.textContent:s.gon;},
sheet=(s,b)=>{var d=tpl('tpl-sheet'),w=mq('(min-width:601px)'),lk=$('[data-m=like]',d),r;cl(d,'pop',w);T($('.sheet-hl',d),hl(s));T($('[data-m=ni] .t',d),lab(s.top));T($('[data-m=ds] .t',d),onm(s));lk.hidden=!NH;T($('span',lk),P.like[i8(s)]?'Unlike':'Like');
on(d,'click',e=>{var m=e.target.closest('[data-m]'),k=m&&m.dataset.m,y=$('.sheet-why',d);if(k=='why'){T(y,why(s)+' Learned only in this browser.');y.hidden=!1;y.focus();return;}if(m||out(e,d))d.close();if(k=='ni'||k=='ds'){if(V&&V.open)V.close();collapse(s,k=='ni');}else k=='share'?share(s):k=='manage'?manage():k=='like'&&like(s);});
on(d,'close',()=>{d.remove();at(b,'aria-expanded',!1);if(!$('dialog[open]')&&!b.closest('.card--gone')&&!(D.activeElement&&D.activeElement.closest('.card--gone')))b.focus({preventScroll:!0});});
BD.append(d);d.showModal();at(b,'aria-expanded',!0);
if(w){r=b.getBoundingClientRect();d.style.left=M.max(8,r.right-d.offsetWidth)+'px';d.style.top=(r.bottom+d.offsetHeight+8>innerHeight?M.max(8,r.top-d.offsetHeight-4):r.bottom+4)+'px';}},
blw=e=>{var p=e.previousElementSibling;while(p&&p.hidden)p=p.previousElementSibling;return(p||F).getBoundingClientRect().top>innerHeight;},
collapse=(s,ni)=>{var el=s.el,i=i8(s),t=s.top,n=now(),hid=[],h0=el.offsetHeight,msg=ni?'Got it. Fewer stories about '+lab(t)+'.':'Got it. No more stories from '+onm(s)+'.',note=h('p','gone-note',msg),u=h('button','undo','Undo');
ev(p=>{if(ni)p.x[t]=[clip(stp(p,t,n)-1,-2,2),n],p.gone[i]=n;else p.hide[s.o]=n;});
if(ni)ad(tk(s),-.8),NB.push(t);else $$('.card',F).forEach(e=>{var o=e.$;if(o!=s&&o.o==s.o&&!e.dataset.near&&!e.hidden&&!(o.er<=3&&!o.t))e.hidden=!0,hid.push(e);});
cl(el,'card--gone',!0);u.type='button';note.style.display='flex';note.append(u);el.append(note);RM||el.animate([{height:h0+'px'},{height:el.offsetHeight+'px'}],200);say(msg);u.focus();pos();flush();want();
on(u,'click',()=>{var m=now();ev(p=>{if(ni)p.x[t]=[clip(stp(p,t,m)+1,-2,2),m],delete p.gone[i];else delete p.hide[s.o];});if(ni)ad(tk(s),.8),delete S1.bar[t],NB=NB.filter(x=>x!=t);hid.forEach(e=>{if(blw(e))e.hidden=!1;});note.remove();cl(el,'card--gone',!1);$('.card-hl a',el).focus();pos();flush();want();});},
RR=0,RT,
want=()=>{clearTimeout(RT);RT=setTimeout(rr,M.max(300,RR+2e3-Date.now()));},
rr=()=>{var y=scrollY;requestAnimationFrame(()=>requestAnimationFrame(()=>{if(scrollY!=y){RT=setTimeout(rr,300);return;}RR=Date.now();if(!F||!P.on||V&&V.open)return;C=ctx(P,S1.a,B,VS);C.bar=S1.bar;C.nb=NB;guards($$('.card',F).map(e=>e.$).filter(s=>!s.t),C);var all=cards().map(e=>(e.$.nr=!!e.dataset.near,e.$));[2,4].forEach((m,j)=>{var bl=all.filter(s=>CA.compareDocumentPosition(s.el)&m),an=bl.length&&bl[bl.length-1].el.nextElementSibling,o=tail(bl,all,C,j),fr=D.createDocumentFragment();if(o)o.forEach(s=>fr.append(s.el)),F.insertBefore(fr,an),NB=[],all=cards().map(e=>e.$);});pos();flush();}));},
DONE=[],NE=0,BUSY,FIN,LD,
TR=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting))more();},{rootMargin:'0px 0px 200% 0px'}),
more=rs=>{var ks=rs||pickEds(EL,B,FL,DONE),fail=()=>(BUSY=0,at(F,'aria-busy',!1),end(1));if(BUSY||FIN)return Promise.resolve();if(!ks.length||NE>=120)return end();BUSY=1;
if(!LD)LD=h('article','loader'),LD.append(h('p',0,'Loading earlier stories…')),at(LD,'aria-label','Loading earlier stories'),LD.tabIndex=-1,F.append(LD),TR.observe(LD);
at(F,'aria-busy',!0);
return Promise.all(ks.map(k=>(k=k.pop?k[0]:k,fetch(ROOT+'ed/'+k+'.json').then(r=>{if(!r.ok)throw 0;return r.json();}).then(j=>(DONE.push(k),j))))).then(js=>new Promise((ok,no)=>idle(()=>{try{var sts=[],ix=id=>S1.order.indexOf(id),all=cards(),o,n,put;
js.forEach(j=>{if(j&&j.v===1&&AR(j.s))j.s.forEach(x=>{if(x&&typeof x.id=='string'&&AR(x.go)){x.t=j.built;x.k=j.k;var s=mk(x);s.j=x;s.lbl=j.label;sts.push(s);}});});
C=ctx(P,S1.a,B,VS);
o=rs?sts.filter(s=>ix(s.id)>=0).sort((a,b)=>ix(a.id)-ix(b.id)):early(sts,C,FL,120-NE,$$('.card',F).map(e=>e.id.slice(2)),all.slice(-7).map(e=>e.$),all.length+1);
n=o.length;NE+=n;
put=()=>{try{o.splice(0,20).forEach(s=>{s.el=render(s.j);s.el.$=s;F.insertBefore(s.el,LD);watch(s.el);});if(o.length)return requestAnimationFrame(put);BUSY=0;S1.er=DONE;at(F,'aria-busy',!1);pos();flush();if(!n&&!rs)return ok(more());TR.unobserve(LD);TR.observe(LD);ok();}catch(e){no(e);}};put();}catch(e){no(e);}}))).catch(fail);},
end=x=>{var e=tpl('tpl-end'),t=h('h2',0,x?"Earlier stories couldn't load. They are on the section pages.":"That's the whole week."),io;FIN=1;t.id='h-end';e.prepend(t);T($('.end-next',e),'Next edition at '+FD.next+' SGT.');on($('.end-manage',e),'click',manage);
if(LD){TR.unobserve(LD);if(LD.getBoundingClientRect().top<=innerHeight)e.style.minHeight=LD.offsetHeight+'px',(io=new IntersectionObserver(es=>{if(es[0].boundingClientRect.top>innerHeight)io.disconnect(),e.style.minHeight='';})).observe(e);LD.replaceWith(e);}else F.append(e);pos();return Promise.resolve();},
render=j=>{var m=cardModel(j),e=tpl('tpl-card'),q=c=>$('.card-'+c,e),md=q('media'),im=$('img',md),t=$('time',e),hh=h('h2','card-hl'),a=h('a',0,m.hl),id=j.id,d=m.data,k,sm=$('.src-more',e),sr=q('src');
e.className=m.cls;e.id='c-'+id;for(k in d)if(d[k]!==''&&d[k]!=null)e.dataset[k]=d[k];at(e,'aria-labelledby','h-'+id);at(e,'aria-describedby','g-'+id);
sr.prepend.apply(sr,m.m.map(z=>(z=h('span','mono'+(z.length>2?' mono--3':''),z),at(z,'aria-hidden',!0),z)));T($('.src-name',e),m.on);m.more?T(sm,m.more):sm.remove();md.dataset.outlet=m.on;
if(!m.img)im.remove();else{im.src=m.img;if(m.ss)im.srcset=sd(m.ss);else if(j.f=='sm')im.sizes='96px',im.width=im.height=96;else im.removeAttribute('sizes');}
hh.id='h-'+id;a.href=m.href;hh.append(a);md.after(hh);
m.hk?T(q('hook'),m.hk):q('hook').remove();T(q('gist'),m.gi);q('gist').id='g-'+id;m.why?T(q('why'),m.why):q('why').remove();t.dateTime=m.dt;T(t,m.tm);m.cr?T(q('credit'),m.cr):q('credit').remove();acts(e);return e;},
grid=()=>mq('(min-width:601px)'),VI=new Set(),TM={},CUR,
NEAR=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.dataset.near=1,NEAR.unobserve(e.target);}),{rootMargin:'0px 0px 100% 0px'}),
IO=new IntersectionObserver(es=>{es.forEach(e=>{var el=e.target,s=el.$,id=s.id,g=grid(),t=s.top,n;if(e.intersectionRatio>=.6){VI.add(el);el.dataset.on=1;TM[id]||(TM[id]=setTimeout(()=>imp(s,g?.5:1),g?2e3:1500));}else{VI.delete(el);clearTimeout(TM[id]);TM[id]=0;if(!e.isIntersecting&&e.boundingClientRect.top<0&&el.dataset.on&&!IMP[id]){delete el.dataset.on;n=S1.gl[t]=(S1.gl[t]||0)+1;if(n>2&&n<6)ad(tk(s),-.1);}}});cur();},{threshold:[0,.6]}),
imp=(s,m)=>{var sn=P.seen[i8(s)],d;if(sn&&sn[1]==VS&&sn[0]&&!IMP[s.id])IMP[s.id]=1;d=m-(IMP[s.id]||0);if(!D.hidden&&d>0)IMP[s.id]=m,sig(s,'imp',d);},
cur=()=>{var c=cards().find(e=>VI.has(e)),a,b;if(c==CUR||!(CUR=c))return;a=sib(c,1);b=a&&sib(a,1);c.dataset.near=1;if(a)a.dataset.near=1;[a,b].forEach((x,i)=>{var m=x&&$('img',x);if(m&&(!i||!SD&&m.srcset))m.loading='eager';});},
acts=el=>{var a=$('.card-act',el),f;if(!a||a.firstChild)return;f=$('#tpl-act').content.cloneNode(1);NH?$('.act-like',f).remove():at($('.act-like',f),'aria-pressed',!!P.like[el.id.slice(2,10)]);at($('.act-more',f),'aria-label','More options for: '+$('.card-hl',el).textContent.trim());a.append(f);},
watch=el=>{NEAR.observe(el);IO.observe(el);},
V,VC,VO,VT,VP,VTM,VD,VM,VF=0,
vok=()=>!NV&&mq('(min-width:1024px) and (hover:hover) and (pointer:fine)'),
vopen=(s,push)=>{if(!V){V=tpl('tpl-viewer');BD.append(V);V.h=h('h2');V.h.id='v-h';V.h.tabIndex=-1;$('.card-src',V).after(V.h);
on(V,'close',vdone);
on(V,'click',e=>{var b=e.target.closest('[data-v]'),k=b&&b.dataset.v;k=='like'?like(VC,b):k=='share'?share(VC):k=='more'?sheet(VC,b):k?+k?vstep(+k):V.close():out(e,V)&&V.close();});
on(V,'keydown',e=>{if(e.altKey||e.ctrlKey||e.metaKey)return;if(e.key=='ArrowLeft')vstep(-1);if(e.key=='ArrowRight')vstep(1);});
on($('.v-go',V),'click',()=>goRec(VC));}
VP=push;VO=s;VD=0;VM=push&&!S1.o[s.id];if(push){history.pushState({dbv:1},'','#v-'+s.id);if(VM)S1.o[s.id]=1,sig(s,'open'),ad(tk(s),.25),ad('s:'+s.s,.1);flush();}V.showModal();vshow(s);},
vshow=s=>{var e=s.el,q=c=>$(c,V),im=$('img',e),vi=q('.v-media img'),cr=$('.card-credit',e),wy=$('.card-why',e),lk=q('[data-v=like]'),g=q('.v-go');vend();VC=s;VT=Date.now();
q('.card-src').replaceWith($('.card-src',e).cloneNode(1));q('.v-media').hidden=!im;if(im)vi.sizes=VSZ,vi.srcset=im.srcset,vi.src=im.src;T(q('.v-cr'),cr?cr.textContent.replace(' · ',''):'');T(V.h,hl(s));
T(q('.v-meta'),'First reported '+$('time',e).textContent+' SGT'+(s.n>1?' · '+s.n+' sources':''));T(q('.v-gist'),$('.card-gist',e).textContent);q('.v-why').hidden=!wy;if(wy)T(q('.v-why-t'),wy.textContent);
g.href=s.go;T(g.firstChild,'Read at '+s.gon+' ↗');lk.hidden=NH;at(lk,'aria-pressed',!!P.like[i8(s)]);q('.v-story').href=$('.card-hl a',e).href;q('.v-prev').hidden=!sib(e,-1);q('.v-next').hidden=!sib(e,1)&&!!FIN;
RM||q('.v-body').animate([{opacity:0},{opacity:1}],120);V.h.focus();
[sib(e,-1),sib(e,1)].forEach(x=>{var m=x&&$('img',x),i;if(m)i=new Image(),i.sizes=VSZ,i.srcset=m.srcset,i.src=m.src;});VTM=setTimeout(()=>imp(s,1),1500);},
vend=()=>{var s=VC,d=Date.now()-VT;if(!s)return;clearTimeout(VTM);VC=0;if(s==VO)VD+=d;if(d>=3e4)sig(s,'read'),ad(tk(s),.25);},
vstep=d=>{var x=sib(VC.el,d),nb=$('.v-next',V);if(x)vshow(x.$),history.replaceState({dbv:1},'','#v-'+x.$.id);else if(d>0&&!FIN)nb.disabled=!0,more().then(()=>{nb.disabled=!1;if(VC&&sib(VC.el,1))vstep(1);});},
vdone=()=>{var s=VC,fin=()=>{var r=s.el.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight)s.el.scrollIntoView({block:'nearest'});$('.card-hl a',s.el).focus({preventScroll:!0});want();};vend();if(VM&&VD<5e3)sig(VO,'mis');if(/^#v-/.test(location.hash)&&VP){if(s)VF=fin;history.back();}else{if(/^#v-/.test(location.hash))history.replaceState(null,'',location.pathname+location.search);if(s)setTimeout(fin);}flush();},
manage=()=>{var d=tpl('tpl-manage'),t=h('h2',0,'Manage feed'),sw=$('.m-on',d),ul=$('.m-hid',d),un=$('.m-undo',d),op=D.activeElement,no=()=>{$('.m-none',d).hidden=!!ul.firstChild;};
t.id='m-h';d.prepend(t);sw.checked=!!P.on;on(sw,'change',()=>{ev(p=>{p.on=sw.checked?1:0;});flush();});
Object.keys(P.hide).forEach(o=>{var c=$$('.card').find(e=>e.dataset.o==o),li=h('li',0,(c?$('.src-name',c).textContent:o)+' '),b=h('button',0,'Show again');b.type='button';li.append(b);ul.append(li);on(b,'click',()=>{ev(p=>{delete p.hide[o];});flush();li.remove();no();});});no();
on($('.m-forget',d),'click',()=>{var a,b,o=P.on,ok;try{a=localStorage.getItem(K);localStorage.removeItem(K);}catch(e){}try{b=sessionStorage.getItem(KS);sessionStorage.removeItem(KS);}catch(e){}P=fresh();P.on=o;Q=[];S1=sload();ok=o?!raw():save(P);say(ok?'Forgotten.':"This browser's storage couldn't be cleared.");if(!ok)return;un.hidden=!1;un.focus();clearTimeout(un.t);un.t=setTimeout(()=>{un.hidden=!0;},1e4);
un.onclick=()=>{try{a?localStorage.setItem(K,a):localStorage.removeItem(K);}catch(e){}try{if(b)sessionStorage.setItem(KS,b);}catch(e){}P=load();S1=sload();sw.checked=!!P.on;un.hidden=!0;say('Restored.');};});
on(d,'click',e=>{if(e.target.closest('.m-x')||out(e,d))d.close();});on(d,'close',()=>{d.remove();if(op)op.focus();});BD.append(d);d.showModal();},
dwell=()=>{if(!SP)return;var s=SP.s;SP.d+=Date.now()-SP.t;SP.t=Date.now();if(SP.m==null&&SP.d<5e3)SP.m=1,sig(s,'mis');else if(SP.m&&SP.d>=5e3)SP.m=0,sig(s,'unmis');if(!SP.r&&SP.d>=3e4)SP.r=1,sig(s,'read'),ad(tk(s),.25);};
on(D,'visibilitychange',()=>{if(D.hidden)dwell(),flush();else if(SP)SP.t=Date.now();});
on(W,'pagehide',()=>{dwell();flush();});
on(W,'popstate',()=>{var f=VF;VF=0;if(f)setTimeout(f);else if(V&&V.open)V.close();});
on(W,'pageshow',e=>{if(e.persisted&&F)P=load(),S1=sload(),want();});
S1=sload();
if(F)try{front();}finally{cl(HT,'rk',!1);}else story();
function front(){var all=$$('.card',F).map(e=>e.$=mk(e.dataset,e)),ix=id=>S1.order.indexOf(id),hs=location.hash.slice(1),o,ld,nl,a,z,fr=D.createDocumentFragment(),v1;
all.forEach(s=>{if(removed(s,P))s.el.hidden=!0;});C=ctx(P,S1.a,B,VS);guards(all,C);
$('.caught-more',CA).hidden=!pickEds(EL,B,FL,[]).length;
if(has(HT,'rk')&&P.on){o=all.filter(s=>!s.el.hidden);o=S1.order?o.sort((x,y)=>(ix(x.id)+1||1e9)-(ix(y.id)+1||1e9)):arrange(o,Object.assign(C,{guards:1}));o.forEach(s=>fr.append(s.el));F.insertBefore(fr,CA);
ld=$('.card--lead',F);nl=o[0]&&o[0].el;if(nl&&nl!=ld){if(ld)cl(ld,'card--lead',!1),a=$('img[srcset]',ld),a&&(a.sizes=$('img',$('#tpl-card').content).getAttribute('sizes'));cl(nl,'card--lead',!0);a=$('img[srcset]',nl);if(a)a.sizes=LEAD;}
o.forEach((s,i)=>{var m=$('img',s.el);if(m)m.loading=i<3?'eager':'lazy',i?m.removeAttribute('fetchpriority'):at(m,'fetchpriority','high');});}
pos();cl(HT,'rk',!1);
if(SD)$$('img[srcset]',F).forEach(m=>{if(!m.complete)m.srcset=sd(m.srcset);});
$$('.card',F).forEach((e,i)=>{if(i<8)acts(e);watch(e);});idle(()=>all.forEach(s=>acts(s.el)));TR.observe(CA);
F.addEventListener('error',e=>{var m=e.target,c=m.closest&&m.closest('.card--lg');if(c&&c.getBoundingClientRect().top>innerHeight)m.remove(),cl(c,'card--lg',!1),cl(c,'card--sm',!0),c.dataset.f=c.$.f='sm';},!0);
F.addEventListener('click',e=>{var t=e.target,b=t.closest('button[data-a]'),c=t.closest('.card'),s=c&&c.$,a=t.closest('.card-hl a');if(b&&s)b.dataset.a=='like'?like(s,b):sheet(s,b);else if(a&&s){if(vok()&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey&&!e.altKey&&!e.button)e.preventDefault(),vopen(s,1);else S1.last=s.id,S1.y=M.round(c.getBoundingClientRect().top),flush();}});
F.addEventListener('keydown',e=>{var k=e.key,a=D.activeElement.closest('article'),l,i;if(a&&(k=='PageDown'||k=='PageUp')){l=$$('article',F).filter(x=>!x.hidden);i=l[l.indexOf(a)+(k=='PageDown'?1:-1)];if(i)e.preventDefault(),i.focus();}});
z=()=>{var x=/^[cv]-/.test(hs)&&D.getElementById('c-'+hs.slice(2)),L=S1.last&&S1.y!=null&&D.getElementById('c-'+S1.last);if(x)x.scrollIntoView();else if(L&&((W.performance&&performance.getEntriesByType&&performance.getEntriesByType('navigation')[0])||{}).type=='back_forward'){try{history.scrollRestoration='manual';}catch(e){}scrollTo(0,L.getBoundingClientRect().top+scrollY-S1.y);}};
if(S1.order&&S1.er.length)more(S1.er).then(z);else z();if(S1.last)want();S1.ed=ED;
D.addEventListener('DOMContentLoaded',()=>{var sl=$('.manage-slot'),m=h('button','quiet','Manage feed');m.type='button';on(m,'click',manage);if(sl)sl.append(m);v1=/^v-/.test(hs)&&D.getElementById('c-'+hs.slice(2));if(v1&&vok())vopen(v1.$,0);});}
function story(){var A=$('article.story'),s,sl,lb,sb,st,c;if(!A)return;s=mk(A.dataset,A);if(!$('#status'))st=h('p','sr'),st.id='status',at(st,'role','status'),BD.append(st);
c=!S1.o[s.id];if(c)S1.o[s.id]=1,sig(s,'open'),ad(tk(s),.25),ad('s:'+s.s,.1),flush();SP={s,t:Date.now(),d:0,m:c?null:0};
lb=$('.story-act .act-like');sb=$('.story-act .act-share');if(lb){at(lb,'aria-pressed',!!P.like[i8(s)]);on(lb,'click',()=>like(s,lb));lb.hidden=NH;}if(sb)on(sb,'click',()=>share(s)),sb.hidden=!1;st=$('a.read');if(st)on(st,'click',()=>goRec(s));}
})();
