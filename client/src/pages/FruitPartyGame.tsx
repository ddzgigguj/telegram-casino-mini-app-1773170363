import { useRef, useEffect } from "react";
import { useTelegram } from "@/components/TelegramProvider";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft } from "lucide-react";

interface FruitPartyGameProps {
  balance: number;
  onBalanceChange: (newBalance: number) => void;
  onBack: () => void;
}

export function FruitPartyGame({ balance, onBalanceChange, onBack }: FruitPartyGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const balanceRef = useRef(balance);
  const { user } = useTelegram();

  useEffect(() => {
    balanceRef.current = balance;
  }, [balance]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Inject font
    if (!document.getElementById("orbitron-font")) {
      const link = document.createElement("link");
      link.id = "orbitron-font";
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap";
      document.head.appendChild(link);
    }

    container.innerHTML = "";

    // ── Styles ──
    const style = document.createElement("style");
    style.textContent = `
      .fp-root{font-family:'Orbitron',monospace;color:#fff;display:flex;flex-direction:column;position:absolute;inset:0;background:radial-gradient(ellipse at 50% -10%,#193d0f 0%,#0a1f07 50%,#040c03 100%);overflow:hidden;}
      .fp-hud{display:flex;gap:6px;padding:5px 12px;flex-shrink:0}
      .fp-hbox{flex:1;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:4px 6px;text-align:center}
      .fp-hl{font-size:7px;letter-spacing:1.5px;color:rgba(255,255,255,.4);margin-bottom:2px}
      .fp-hv{font-size:13px;font-weight:700;line-height:1}
      .fp-cbar{display:flex;align-items:center;gap:6px;padding:2px 12px 4px;flex-shrink:0}
      .fp-cmul{font-size:12px;font-weight:700;color:#fb923c;min-width:30px}
      .fp-ctrack{flex:1;height:5px;background:rgba(255,255,255,.06);border-radius:10px;overflow:hidden}
      .fp-cfill{height:100%;width:0%;background:linear-gradient(90deg,#fb923c,#ef4444);border-radius:10px;transition:width .35s}
      .fp-ibar{font-size:11px;text-align:center;padding:2px 12px 3px;flex-shrink:0;min-height:18px;font-weight:700;letter-spacing:1px}
      .fp-reel-wrap{flex:1;display:flex;align-items:center;justify-content:center;padding:4px;min-height:0;overflow:hidden;max-height:none;}
      .fp-reel-frame{background:#0a0a10;border-radius:14px;padding:4px;border:2px solid rgba(255,255,255,.1);box-shadow:0 0 0 1px rgba(0,0,0,.8),inset 0 1px 0 rgba(255,255,255,.06),0 4px 30px rgba(0,0,0,.8)}
      .fp-reel-row{display:flex;gap:2px}
      .fp-rcol{position:relative;border-radius:8px;overflow:hidden}
      .fp-ctrl{padding:5px 12px 10px;flex-shrink:0}
      .fp-brow{display:flex;gap:5px;margin-bottom:7px;justify-content:center}
      .fp-chip{width:40px;height:40px;border-radius:50%;border:2px solid rgba(255,255,255,.18);background:rgba(255,255,255,.05);color:#aaa;font-size:9px;font-weight:700;cursor:pointer;transition:all .15s;font-family:'Orbitron',monospace;display:flex;align-items:center;justify-content:center}
      .fp-chip.on{border-color:#f97316;background:#f97316;color:#000;box-shadow:0 0 12px #f97316,0 0 25px rgba(0,0,0,.5);transform:scale(1.08)}
      .fp-sbtn{width:100%;height:50px;border:none;border-radius:12px;font-size:15px;font-weight:700;font-family:'Orbitron',monospace;letter-spacing:1px;cursor:pointer;background:linear-gradient(135deg,#f97316,#dc2626);color:#fff;box-shadow:0 0 20px rgba(249,115,22,.3);position:relative;overflow:hidden;}
      .fp-sbtn:disabled{opacity:.35;cursor:default;pointer-events:none}
      .fp-sbtn::before{content:'';position:absolute;top:0;left:-100%;width:50%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.15),transparent);animation:fpShimmer 2.5s infinite}
      @keyframes fpShimmer{0%{left:-100%}100%{left:200%}}
      .fp-flash{position:fixed;inset:0;pointer-events:none;z-index:50;opacity:0}
      .fp-flash.go{animation:fpFlash .5s ease}
      @keyframes fpFlash{0%,100%{opacity:0}25%{opacity:1}}
      .fp-bigwin{display:none;position:fixed;inset:0;z-index:100;align-items:center;justify-content:center;flex-direction:column}
      .fp-bigwin.show{display:flex}
      .fp-bigwin::before{content:'';position:absolute;inset:0;background:rgba(0,0,0,.92)}
      .fp-bwc{position:relative;z-index:1;text-align:center;animation:fpBwPop .4s cubic-bezier(.17,.89,.32,1.4)}
      @keyframes fpBwPop{from{transform:scale(.3);opacity:0}to{transform:scale(1);opacity:1}}
      .fp-bwl1{font-size:42px;font-weight:900;line-height:1}
      .fp-bwl2{font-size:42px;font-weight:900;line-height:1;margin-bottom:14px}
      .fp-bwamt{font-size:32px;color:#ffd700;font-weight:700}
      .fp-bwx{margin-top:20px;padding:12px 36px;border:2px solid rgba(255,255,255,.3);background:transparent;color:#fff;font-family:'Orbitron',monospace;font-weight:700;font-size:12px;border-radius:8px;cursor:pointer;letter-spacing:2px;position:relative;z-index:1}
      .fp-toast{position:fixed;bottom:90px;left:50%;transform:translateX(-50%) translateY(15px);padding:9px 18px;border-radius:20px;font-size:13px;font-weight:700;white-space:nowrap;z-index:200;opacity:0;transition:all .3s;backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.12)}
      .fp-toast.on{opacity:1;transform:translateX(-50%) translateY(0)}
    `;
    document.head.appendChild(style);

    // ── HTML ──
    container.innerHTML = `
      <div class="fp-root" id="fp-root">
        <div class="fp-hud">
          <div class="fp-hbox"><div class="fp-hl">BALANCE</div><div class="fp-hv" id="fp-gb" style="color:#fbbf24">$${balanceRef.current.toFixed(2)}</div></div>
          <div class="fp-hbox" id="fp-gfb" style="display:none;border-color:rgba(255,215,0,.3)"><div class="fp-hl">FREE</div><div class="fp-hv" id="fp-gf" style="color:gold">0</div></div>
          <div class="fp-hbox"><div class="fp-hl">WIN</div><div class="fp-hv" id="fp-gw" style="color:#4ade80">—</div></div>
        </div>
        <div class="fp-cbar">
          <div class="fp-cmul">x<span id="fp-gm">1</span></div>
          <div class="fp-ctrack"><div class="fp-cfill" id="fp-gj"></div></div>
          <span style="font-size:13px">🧃</span>
        </div>
        <div class="fp-ibar" id="fp-gi"></div>
        <div class="fp-reel-wrap" id="fp-gs"></div>
        <div class="fp-ctrl">
          <div class="fp-brow" id="fp-gbets"></div>
          <button class="fp-sbtn" id="fp-gspin">🍒 &nbsp;SPIN</button>
        </div>
      </div>

      <div class="fp-flash" id="fp-flash"></div>
      <div class="fp-bigwin" id="fp-bwin">
        <div class="fp-bwc">
          <div class="fp-bwl1" id="fp-bwl1"></div>
          <div class="fp-bwl2" id="fp-bwl2"></div>
          <div class="fp-bwamt" id="fp-bwamt"></div>
        </div>
        <button class="fp-bwx" onclick="document.getElementById('fp-bwin').classList.remove('show')">COLLECT</button>
      </div>
      <div class="fp-toast" id="fp-toast"></div>
    `;

    // ── Game Logic ──
    const $ = (id: string) => document.getElementById(id);
    const DPR = window.devicePixelRatio || 1;
    const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

    const GSYMS = [
      {id:'wld',icon:'🍎',lbl:'WILD',glow:'#ffd700',b0:'#332200',b1:'#1a1100',brd:'rgba(255,200,0,.4)',w:.028,v:0},
      {id:'sct',icon:'⭐',lbl:'★',glow:'#ffffff',b0:'#332f00',b1:'#1a1800',brd:'rgba(255,255,180,.3)',w:.022,v:0},
      {id:'bon',icon:'🍀',lbl:'BONUS',glow:'#00ff44',b0:'#003320',b1:'#001910',brd:'rgba(0,255,68,.5)',w:.035,v:0},
      {id:'ch',icon:'🍒',lbl:'',glow:'#ff2255',b0:'#2a0010',b1:'#150008',brd:'rgba(255,50,100,.3)',w:.108,v:.85},
      {id:'lm',icon:'🍋',lbl:'',glow:'#ffe600',b0:'#292400',b1:'#141200',brd:'rgba(255,220,0,.2)',w:.170,v:.25},
      {id:'or',icon:'🍊',lbl:'',glow:'#ff8800',b0:'#291500',b1:'#140a00',brd:'rgba(255,140,0,.2)',w:.148,v:.50},
      {id:'gr',icon:'🍇',lbl:'',glow:'#9b59b6',b0:'#18082a',b1:'#0c0415',brd:'rgba(150,60,200,.3)',w:.168,v:.40},
      {id:'wm',icon:'🍉',lbl:'',glow:'#2ecc71',b0:'#002814',b1:'#00140a',brd:'rgba(0,200,100,.25)',w:.182,v:.30},
      {id:'sb',icon:'🍓',lbl:'',glow:'#ff4444',b0:'#280500',b1:'#140200',brd:'rgba(255,80,80,.25)',w:.174,v:.20},
    ];
    const BETS = [0.10,0.20,0.50,1,2,5,10,20];

    class Reel {
      syms: typeof GSYMS; rows: number; cW: number; cH: number; N: number;
      strip: number[]; pos: number; vel: number; spinning: boolean; raf_: number|null;
      result: string[]; cvs: HTMLCanvasElement; ctx: CanvasRenderingContext2D;
      _cache: HTMLCanvasElement[]; _winClr: string|null;

      constructor(container: HTMLElement, syms: typeof GSYMS, rows: number, cellW: number, cellH: number) {
        this.syms=syms; this.rows=rows; this.cW=cellW; this.cH=cellH; this.N=40;
        this.strip=Array.from({length:this.N},()=>this._ridx());
        this.pos=0; this.vel=0; this.spinning=false; this.raf_=null; this.result=[]; this._winClr=null;
        const c=document.createElement('canvas');
        c.style.display='block'; c.style.borderRadius='6px';
        c.style.width=cellW+'px'; c.style.height=(rows*cellH)+'px';
        c.width=Math.round(cellW*DPR); c.height=Math.round(rows*cellH*DPR);
        container.appendChild(c); this.cvs=c; this.ctx=c.getContext('2d')!;
        this.ctx.scale(DPR,DPR);
        this._cache=syms.map(s=>this._bake(s));
        this._draw([]);
      }

      _ridx() {
        let r=Math.random(),c=0;
        for(let i=0;i<this.syms.length;i++){c+=this.syms[i].w;if(r<c)return i;}
        return this.syms.length-1;
      }

      _rr(cx: CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number|number[]) {
        const rr=typeof r==='number'?[r,r,r,r]:r as number[];
        const[tl,tr,br,bl]=rr;
        cx.beginPath();
        cx.moveTo(x+tl,y); cx.lineTo(x+w-tr,y); cx.arcTo(x+w,y,x+w,y+tr,tr);
        cx.lineTo(x+w,y+h-br); cx.arcTo(x+w,y+h,x+w-br,y+h,br);
        cx.lineTo(x+bl,y+h); cx.arcTo(x,y+h,x,y+h-bl,bl);
        cx.lineTo(x,y+tl); cx.arcTo(x,y,x+tl,y,tl); cx.closePath();
      }

      _bake(sym: typeof GSYMS[0]) {
        const oc=document.createElement('canvas');
        oc.width=Math.round(this.cW*DPR); oc.height=Math.round(this.cH*DPR);
        const cx=oc.getContext('2d')!;
        cx.scale(DPR,DPR);
        const w=this.cW,h=this.cH,pad=3,r=8;
        cx.save();
        cx.beginPath(); this._rr(cx,pad,pad,w-pad*2,h-pad*2,r);
        const bg=cx.createLinearGradient(0,pad,0,h-pad);
        bg.addColorStop(0,sym.b0); bg.addColorStop(1,sym.b1);
        cx.fillStyle=bg; cx.fill();
        cx.strokeStyle=sym.brd||'rgba(255,255,255,.08)';
        cx.lineWidth=1.5; cx.stroke();
        cx.shadowColor=sym.glow; cx.shadowBlur=h*.35;
        const fontStack = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji'";
        if(sym.lbl==='WILD') {
          const wg=cx.createLinearGradient(0,0,w,0);
          wg.addColorStop(0,'#ffd700'); wg.addColorStop(.5,'#fff'); wg.addColorStop(1,'#ffd700');
          cx.font=`${Math.floor(h*.45)}px ${fontStack}`;
          cx.shadowColor=sym.glow; cx.shadowBlur=h*.3;
          cx.fillStyle='#fff'; cx.textAlign='center'; cx.textBaseline='middle';
          cx.fillText(sym.icon,w/2,h*.44);
          cx.shadowBlur=0; cx.fillStyle=wg;
          cx.font=`900 ${Math.floor(h*.18)}px Orbitron, monospace`;
          cx.fillText('WILD',w/2,h*.78);
        } else if(sym.lbl==='BONUS') {
          cx.font=`${Math.floor(h*.45)}px ${fontStack}`;
          cx.fillStyle='#fff'; cx.textAlign='center'; cx.textBaseline='middle';
          cx.fillText(sym.icon,w/2,h*.44);
          cx.shadowBlur=0; cx.fillStyle='#4ade80';
          cx.font=`900 ${Math.floor(h*.16)}px Orbitron, monospace`;
          cx.fillText('BONUS',w/2,h*.8);
        } else {
          cx.font=`${Math.floor(h*.55)}px ${fontStack}`;
          cx.fillStyle='#fff'; cx.textAlign='center'; cx.textBaseline='middle';
          cx.fillText(sym.icon,w/2,h*.52);
        }
        cx.restore();
        cx.save();
        cx.beginPath(); this._rr(cx,pad,pad,w-pad*2,(h-pad*2)*.42,[r,r,0,0]);
        const shine=cx.createLinearGradient(0,pad,0,h*.42);
        shine.addColorStop(0,'rgba(255,255,255,.18)');
        shine.addColorStop(1,'rgba(255,255,255,0)');
        cx.fillStyle=shine; cx.fill(); cx.restore();
        return oc;
      }

      _draw(winCells: number[]=[]) {
        const ctx=this.ctx,W=this.cW,H=this.rows*this.cH;
        ctx.clearRect(0,0,W,H);
        const sH=this.N*this.cH;
        const norm=((this.pos%sH)+sH)%sH;
        const si=Math.floor(norm/this.cH),frac=norm%this.cH;
        for(let i=-1;i<=this.rows+1;i++){
          const idx=(si+i+this.N*100)%this.N;
          const y=Math.round(i*this.cH-frac);
          if(y+this.cH>0&&y<H) ctx.drawImage(this._cache[this.strip[idx]],0,y);
        }
        if(winCells&&winCells.length){
          for(const r of winCells){
            if(r<0||r>=this.rows)continue;
            const y=r*this.cH+3;
            ctx.save();
            ctx.strokeStyle=this._winClr||'#ffd700';
            ctx.shadowColor=this._winClr||'#ffd700';
            ctx.shadowBlur=12; ctx.lineWidth=2.5;
            this._rr(ctx,3,y,W-6,this.cH-6,6);
            ctx.stroke(); ctx.restore();
          }
        }
        if(this.spinning&&this.vel>10){
          const a=Math.min(.45,(this.vel-10)/35);
          ctx.fillStyle=`rgba(0,0,0,${a})`; ctx.fillRect(0,0,W,H);
        }
        const tg=ctx.createLinearGradient(0,0,0,H*.22);
        tg.addColorStop(0,'rgba(0,0,0,.75)'); tg.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=tg; ctx.fillRect(0,0,W,H*.22);
        const bg=ctx.createLinearGradient(0,H*.78,0,H);
        bg.addColorStop(0,'rgba(0,0,0,0)'); bg.addColorStop(1,'rgba(0,0,0,.75)');
        ctx.fillStyle=bg; ctx.fillRect(0,H*.78,W,H*.22);
      }

      start() {
        if(this.spinning)return;
        this.spinning=true; this.vel=2;
        let prev: number|null=null;
        const run=(ts:number)=>{
          if(!this.spinning)return;
          if(!prev)prev=ts;
          const dt=Math.min(ts-prev,50); prev=ts;
          this.vel=Math.min(this.vel+dt*.3,22);
          const sH=this.N*this.cH;
          this.pos=((this.pos+this.vel)%sH+sH)%sH;
          this._draw();
          this.raf_=requestAnimationFrame(run);
        };
        this.raf_=requestAnimationFrame(run);
      }

      stop(resultIds: string[]): Promise<void> {
        return new Promise(resolve=>{
          if(this.raf_!==null) cancelAnimationFrame(this.raf_);
          this.spinning=false;
          const sH=this.N*this.cH,cH=this.cH;
          const curVel=Math.max(this.vel,8);
          const startPos=this.pos;
          const travelCells=Math.max(6,Math.ceil(curVel/1.5));
          const rawEnd=startPos+travelCells*cH;
          const snapCell=Math.round(rawEnd/cH)%this.N;
          for(let i=0;i<resultIds.length;i++){
            const si=this.syms.findIndex(s=>s.id===resultIds[i]);
            this.strip[(snapCell+i)%this.N]=si>=0?si:0;
          }
          const snapPos=(snapCell*cH)%sH;
          let dist=snapPos-startPos; if(dist<0)dist+=sH;
          if(dist<cH*3)dist+=sH;
          const dur=Math.max(480,dist/curVel*1.8);
          let t0: number|null=null;
          const ease=(t:number)=>{
            if(t<.8){return 1-Math.pow(1-t/.8,3);}
            else{const p=(t-.8)/.2;return 1+Math.sin(p*Math.PI)*.025*(1-p*.5);}
          };
          const frame=(ts:number)=>{
            if(!t0)t0=ts;
            const t=Math.min((ts-t0)/dur,1);
            this.pos=((startPos+dist*Math.min(ease(t),1.03))%sH+sH)%sH;
            this._draw();
            if(t<1){requestAnimationFrame(frame);}
            else{this.pos=snapPos; this.result=resultIds; this._draw(); resolve();}
          };
          requestAnimationFrame(frame);
        });
      }

      getVisible(): string[] {
        const sH=this.N*this.cH;
        const norm=((this.pos%sH)+sH)%sH;
        const si=Math.floor(norm/this.cH)%this.N;
        return Array.from({length:this.rows},(_,i)=>this.syms[this.strip[(si+i)%this.N]].id);
      }

      highlightRows(rows: number[], clr='#fbbf24') {
        this._winClr=clr; this._draw(rows);
      }
      clearHighlight() { this._winClr=null; this._draw(); }
    }

    // Grid builder
    function makeGrid(stageId: string, cols: number, rows: number, syms: typeof GSYMS, _?: number): Reel[] {
      const stage=document.getElementById(stageId)!;
      stage.innerHTML='';
      const wrap = document.getElementById(stageId)?.parentElement;
      const availW = window.innerWidth - 24;
      const availH = wrap ? wrap.clientHeight - 10 : (window.innerHeight - 250);
      const px = Math.min(Math.floor(availW / cols), Math.floor(availH / rows), 52);
      const frame=document.createElement('div'); frame.className='fp-reel-frame';
      const row=document.createElement('div'); row.className='fp-reel-row';
      const reels:Reel[]=[];
      for(let c=0;c<cols;c++){
        const col=document.createElement('div'); col.className='fp-rcol';
        row.appendChild(col); reels.push(new Reel(col,syms,rows,px,px));
      }
      frame.appendChild(row); stage.appendChild(frame); return reels;
    }

    let _tt: ReturnType<typeof setTimeout> | null = null;
    function toast(msg: string, bg='rgba(0,0,0,.92)', clr='#fff') {
      const t=$('fp-toast')!;
      t.textContent=msg; t.style.background=bg; t.style.color=clr;
      t.classList.add('on'); if(_tt)clearTimeout(_tt);
      _tt=setTimeout(()=>t.classList.remove('on'),2600);
    }
    function flash(clr='rgba(255,255,255,.15)') {
      const f=$('fp-flash')!; f.style.background=clr;
      f.classList.remove('go'); void (f as HTMLElement).offsetWidth; f.classList.add('go');
    }
    function bigWin(l1: string, l2: string, amt: number) {
      $('fp-bwl1')!.textContent=l1; $('fp-bwl2')!.textContent=l2;
      $('fp-bwamt')!.textContent='$'+amt.toFixed(2);
      $('fp-bwin')!.classList.add('show');
    }

    function makeBets(id: string, state: {bet: number}) {
      const row=$(id)!; row.innerHTML='';
      BETS.forEach(b=>{
        const btn=document.createElement('button'); btn.className='fp-chip';
        btn.textContent=b<1?('.'+String(Math.round(b*100)).padStart(2,'0')):'$'+b;
        if(b===state.bet) btn.classList.add('on');
        btn.onclick=()=>{
          state.bet=b; row.querySelectorAll('.fp-chip').forEach((x: any)=>x.classList.remove('on'));
          btn.classList.add('on');
        };
        row.appendChild(btn);
      });
    }

    const G = { bal: balanceRef.current, bet: 1, fs: 0, busy: false, reels: [] as Reel[], totalMul: 1 };

    function uG() {
      $('fp-gb')!.textContent='$'+G.bal.toFixed(2);
      if(G.fs>0){ $('fp-gfb')!.style.display=''; $('fp-gf')!.textContent=String(G.fs); }
      else $('fp-gfb')!.style.display='none';
      onBalanceChange(G.bal);
    }

    function gGrid(): string[][] {
      return Array.from({length: 5}, (_, r) => Array.from({length: 6}, (_, c) => G.reels[c].getVisible()[r]));
    }

    function gBfs(grid: string[][], r: number, c: number): string[] {
      const id=grid[r][c]; if(!id||id==='sct'||id==='bon'||id==='wld')return[];
      const vis=new Set([`${r},${c}`]), q=[`${r},${c}`];
      while(q.length){
        const[cr,cc]=q.shift()!.split(',').map(Number);
        for(const[dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]){
          const nr=cr+dr,nc=cc+dc,k=`${nr},${nc}`;
          if(nr<0||nr>=5||nc<0||nc>=6||vis.has(k))continue;
          const ni=grid[nr][nc];
          if(ni===id||ni==='wld'){ vis.add(k); q.push(k); }
        }
      }
      return vis.size>=8?[...vis]:[];
    }

    function gClusters(grid: string[][]) {
      const vis=new Set<string>(), out: Array<{id: string, cells: string[]}> = [];
      for(let r=0;r<5;r++)for(let c=0;c<6;c++){
        if(vis.has(`${r},${c}`))continue;
        const cluster=gBfs(grid,r,c);
        if(cluster.length){ cluster.forEach(k=>vis.add(k)); out.push({id:grid[r][c], cells:cluster}); }
      }
      return out;
    }

    async function spin() {
      if(G.busy)return;
      if(G.fs<=0 && G.bal<G.bet){ toast('NOT ENOUGH BALANCE','#3d0000','#ef4444'); return; }
      G.busy=true; if(G.fs<=0){ G.bal-=G.bet; uG(); } else { G.fs--; uG(); }
      $('fp-gspin')!.setAttribute('disabled','true');
      $('fp-gi')!.textContent='LINK ESTABLISHED...';
      G.reels.forEach(r=>r.start());
      
      try {
        const res=await apiRequest("POST","/api/slots/spin",{gameId:'fruitparty',bet:G.bet,isFree:G.fs>=0});
        await sleep(800);
        for(let i=0;i<G.reels.length;i++){ await G.reels[i].stop(res.reels[i]); await sleep(120); }
        await sleep(300);

        let grid=gGrid(), clusters=gClusters(grid), totalWin=0, scatters=0;
        grid.flat().forEach(s=>{ if(s==='sct')scatters++; });

        if(clusters.length){
          let win=0;
          for(const c of clusters){
            const sym=GSYMS.find(s=>s.id===c.id)!;
            const mult=sym.v||0.5;
            const cwin=G.bet*mult*(c.cells.length/8)*G.totalMul;
            win+=cwin;
            G.reels.forEach((r,idx)=>r.highlightRows(c.cells.filter(k=>Number(k.split(',')[1])===idx).map(k=>Number(k.split(',')[0]))));
          }
          totalWin=win; G.bal+=win; uG();
          $('fp-gw')!.textContent='$'+win.toFixed(2);
          if(win>=G.bet*20) bigWin('FRUIT','EXPLOSION',win);
          else if(win>=G.bet*5) bigWin('JUICY','WIN',win);
          await sleep(2000); G.reels.forEach(r=>r.clearHighlight());
        }

        if(scatters>=3){
          flash('#fbbf24'); toast('FREE SPINS ACQUIRED!');
          await sleep(1000); G.fs+=scatters*3; uG();
        }

        G.busy=false; $('fp-gspin')!.removeAttribute('disabled');
        $('fp-gi')!.textContent='';
      } catch(e){
        console.error(e); toast('CONNECTION ERROR');
        G.busy=false; $('fp-gspin')!.removeAttribute('disabled');
        G.reels.forEach(r=>r.stop(Array(5).fill('ch')));
      }
    }

    G.reels=makeGrid('fp-gs',6,5,GSYMS);
    makeBets('fp-gbets',G);
    $('fp-gspin')!.onclick=spin;

    return () => {
      G.reels.forEach(r=>{if(r.raf_)cancelAnimationFrame(r.raf_)});
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black z-50">
      <div className="absolute top-4 left-4 z-50">
        <button 
          onClick={onBack}
          className="p-2 bg-black/40 border border-white/10 rounded-full text-white/70 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
      </div>
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
