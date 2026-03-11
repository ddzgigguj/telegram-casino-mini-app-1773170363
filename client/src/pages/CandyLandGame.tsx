import { useRef, useEffect } from "react";
import { useTelegram } from "@/components/TelegramProvider";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft } from "lucide-react";

interface CandyLandGameProps {
  balance: number;
  onBalanceChange: (newBalance: number) => void;
  onBack: () => void;
}

export function CandyLandGame({ balance, onBalanceChange, onBack }: CandyLandGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const balanceRef = useRef(balance);

  useEffect(() => { balanceRef.current = balance; }, [balance]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.getElementById("orbitron-font")) {
      const link = document.createElement("link");
      link.id = "orbitron-font";
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap";
      document.head.appendChild(link);
    }

    const style = document.createElement("style");
    style.textContent = `
      .cl-root{font-family:'Orbitron',monospace;color:#fff;display:flex;flex-direction:column;position:absolute;inset:0;background:radial-gradient(ellipse at 50% -10%,#5a0a5a 0%,#2a0535 50%,#100218 100%);overflow:hidden;}
      .cl-hud{display:flex;gap:6px;padding:5px 12px;flex-shrink:0}
      .cl-hbox{flex:1;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:4px 6px;text-align:center}
      .cl-hl{font-size:7px;letter-spacing:1.5px;color:rgba(255,255,255,.4);margin-bottom:2px}
      .cl-hv{font-size:13px;font-weight:700;line-height:1}
      .cl-ibar{font-size:11px;text-align:center;padding:2px 12px 3px;flex-shrink:0;min-height:18px;font-weight:700;letter-spacing:1px}
      .cl-reel-wrap{flex:1;display:flex;align-items:center;justify-content:center;padding:4px;overflow:hidden;min-height:0}
      .cl-reel-frame{background:#0a0a10;border-radius:14px;padding:4px;border:2px solid rgba(244,114,182,.2);box-shadow:0 0 0 1px rgba(0,0,0,.8),inset 0 1px 0 rgba(244,114,182,.08),0 4px 30px rgba(0,0,0,.8)}
      .cl-reel-row{display:flex;gap:2px}
      .cl-rcol{position:relative;border-radius:8px;overflow:hidden}
      .cl-ctrl{padding:5px 12px 10px;flex-shrink:0;background:rgba(0,0,0,.2)}
      .cl-brow{display:flex;gap:5px;margin-bottom:7px;justify-content:center}
      .cl-chip{width:40px;height:40px;border-radius:50%;border:2px solid rgba(244,114,182,.25);background:rgba(244,114,182,.05);color:#f472b6;font-size:9px;font-weight:700;cursor:pointer;transition:all .15s;font-family:'Orbitron',monospace;display:flex;align-items:center;justify-content:center}
      .cl-chip.on{border-color:#f472b6;background:#f472b6;color:#000;box-shadow:0 0 12px #f472b6,0 0 25px rgba(244,114,182,.3);transform:scale(1.08)}
      .cl-sbtn{width:100%;height:50px;border:none;border-radius:25px;font-size:15px;font-weight:700;font-family:'Orbitron',monospace;letter-spacing:1px;cursor:pointer;background:linear-gradient(135deg,#f472b6,#fbbf24);color:#000;box-shadow:0 0 20px rgba(244,114,182,.3);border:2px solid rgba(255,255,255,.3);position:relative;overflow:hidden}
      .cl-sbtn:disabled{opacity:.35;cursor:default;pointer-events:none}
      .cl-sbtn::before{content:'';position:absolute;top:0;left:-100%;width:50%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.15),transparent);animation:clShimmer 2.5s infinite}
      @keyframes clShimmer{0%{left:-100%}100%{left:200%}}
      .cl-flash{position:fixed;inset:0;pointer-events:none;z-index:50;opacity:0}
      .cl-flash.go{animation:clFlash .5s ease}
      @keyframes clFlash{0%,100%{opacity:0}25%{opacity:1}}
      .cl-bigwin{display:none;position:fixed;inset:0;z-index:100;align-items:center;justify-content:center;flex-direction:column}
      .cl-bigwin.show{display:flex}
      .cl-bigwin::before{content:'';position:absolute;inset:0;background:rgba(0,0,0,.92)}
      .cl-bwc{position:relative;z-index:1;text-align:center;animation:clBwPop .4s cubic-bezier(.17,.89,.32,1.4)}
      @keyframes clBwPop{from{transform:scale(.3);opacity:0}to{transform:scale(1);opacity:1}}
      .cl-bwl1{font-size:42px;font-weight:900;line-height:1}
      .cl-bwl2{font-size:42px;font-weight:900;line-height:1;margin-bottom:14px}
      .cl-bwamt{font-size:32px;color:#ffd700;font-weight:700}
      .cl-bwx{margin-top:20px;padding:12px 36px;border:2px solid rgba(244,114,182,.4);background:transparent;color:#f472b6;font-family:'Orbitron',monospace;font-weight:700;font-size:12px;border-radius:8px;cursor:pointer;letter-spacing:2px;position:relative;z-index:1}
      .cl-toast{position:fixed;bottom:90px;left:50%;transform:translateX(-50%) translateY(15px);padding:9px 18px;border-radius:20px;font-size:13px;font-weight:700;white-space:nowrap;z-index:200;opacity:0;transition:all .3s;backdrop-filter:blur(12px);border:1px solid rgba(244,114,182,.15)}
      .cl-toast.on{opacity:1;transform:translateX(-50%) translateY(0)}
      /* Candy Wheel bonus */
      .cl-bonus{display:none;position:fixed;inset:0;z-index:400;flex-direction:column;align-items:center;justify-content:flex-start;overflow-y:auto;background:radial-gradient(ellipse at 50% 0%,#5a0a5a 0%,#2a0535 60%,#0d0118 100%)}
      .cl-bonus.open{display:flex}
      .cl-cw-wheel-wrap{position:relative;width:260px;height:260px;margin:8px auto 0}
      .cl-cw-canvas{border-radius:50%;box-shadow:0 0 0 4px rgba(255,255,255,.15),0 0 40px rgba(244,114,182,.3),0 0 80px rgba(244,114,182,.1)}
      .cl-cw-pointer{position:absolute;top:-14px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:12px solid transparent;border-right:12px solid transparent;border-top:24px solid #fff;filter:drop-shadow(0 2px 6px rgba(0,0,0,.8))}
      .cl-cw-spins{display:flex;gap:8px;justify-content:center;margin:6px 0}
      .cl-cw-dot{width:12px;height:12px;border-radius:50%;background:#222;border:2px solid rgba(255,255,255,.2);transition:all .3s}
      .cl-cw-dot.used{background:rgba(255,255,255,.15)}
      .cl-cw-dot.active{background:#f472b6;border-color:#f472b6;box-shadow:0 0 8px #f472b6}
      .cl-cw-results{width:100%;max-width:340px;padding:0 14px;display:flex;flex-direction:column;gap:5px;max-height:120px;overflow-y:auto}
      .cl-cw-result-item{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);border-radius:8px;padding:4px 12px;display:flex;justify-content:space-between;align-items:center;font-size:11px;animation:clCardFlip .25s ease}
      @keyframes clCardFlip{0%{transform:rotateY(90deg);opacity:0}100%{transform:rotateY(0);opacity:1}}
      .cl-cw-spin-btn{padding:13px 50px;border:none;border-radius:14px;font-size:15px;font-weight:900;font-family:'Orbitron',monospace;letter-spacing:1.5px;cursor:pointer;background:linear-gradient(135deg,#f472b6,#fbbf24);color:#000;box-shadow:0 0 20px rgba(244,114,182,.4);margin:8px 0}
      .cl-cw-spin-btn:disabled{opacity:.35;cursor:default}
      .cl-cw-total{font-size:26px;font-weight:900;font-family:'Orbitron',monospace;color:#fbbf24;margin:2px 0}
      .cl-collect{padding:12px 40px;border:none;border-radius:12px;font-size:14px;font-weight:900;font-family:'Orbitron',monospace;letter-spacing:1.5px;cursor:pointer;margin:6px 0 14px;background:linear-gradient(135deg,#f472b6,#fbbf24);color:#000}
    `;
    document.head.appendChild(style);

    container.innerHTML = `
      <div class="cl-root" id="cl-root">
        <div class="cl-hud">
          <div class="cl-hbox"><div class="cl-hl">BALANCE</div><div class="cl-hv" id="cl-kb" style="color:#ffe4f0">$${balanceRef.current.toFixed(2)}</div></div>
          <div class="cl-hbox" id="cl-kfb" style="display:none;background:rgba(255,215,0,.15);border-color:gold"><div class="cl-hl">FREE</div><div class="cl-hv" id="cl-kf" style="color:gold">0</div></div>
          <div class="cl-hbox"><div class="cl-hl">WIN</div><div class="cl-hv" id="cl-kw" style="color:#b9ff74">—</div></div>
        </div>
        <div class="cl-ibar" id="cl-ki"></div>
        <div class="cl-reel-wrap" id="cl-ks"></div>
        <div class="cl-ctrl">
          <div class="cl-brow" id="cl-kbets"></div>
          <button class="cl-sbtn" id="cl-kspin">🍭 &nbsp;SPIN!</button>
        </div>
      </div>

      <div class="cl-bigwin" id="cl-bwin">
        <div class="cl-bwc">
          <div class="cl-bwl1" id="cl-bwl1"></div>
          <div class="cl-bwl2" id="cl-bwl2"></div>
          <div class="cl-bwamt" id="cl-bwamt"></div>
        </div>
        <button class="cl-bwx" onclick="document.getElementById('cl-bwin').classList.remove('show')">COLLECT</button>
      </div>
      <div class="cl-flash" id="cl-flash"></div>
      <div class="cl-toast" id="cl-toast"></div>

      <!-- Candy Wheel Bonus -->
      <div class="cl-bonus" id="cl-bonus-candy">
        <div style="width:100%;text-align:center;padding:12px 16px 4px">
          <div style="font-size:22px;font-weight:900;letter-spacing:2px;background:linear-gradient(135deg,#f472b6,#fbbf24);-webkit-background-clip:text;-webkit-text-fill-color:transparent">CANDY WHEEL</div>
          <div style="font-size:10px;letter-spacing:3px;margin-top:2px;opacity:.7;color:#f472b6">SPIN FOR MULTIPLIERS</div>
        </div>
        <div class="cl-cw-wheel-wrap">
          <canvas id="cl-cw-canvas" class="cl-cw-canvas"></canvas>
          <div class="cl-cw-pointer"></div>
        </div>
        <div class="cl-cw-spins" id="cl-cw-spins"></div>
        <div class="cl-cw-total" id="cl-cw-total">$0.00</div>
        <button class="cl-cw-spin-btn" id="cl-cw-spin-btn">🍭 SPIN!</button>
        <div class="cl-cw-results hide-scrollbar" id="cl-cw-results"></div>
        <button class="cl-collect" id="cl-cw-collect" style="display:none" onclick="window._clCwCollect()">✅ COLLECT</button>
      </div>
    `;

    const $ = (id: string) => document.getElementById(id);
    const DPR = window.devicePixelRatio || 1;
    const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

    const KSYMS = [
      {id:'wld',icon:'🍭',lbl:'WILD',glow:'#f472b6',b0:'#3d002a',b1:'#1a0012',brd:'rgba(244,114,182,.4)',w:.028,v:0},
      {id:'sct',icon:'🎟️',lbl:'FREE',glow:'#ffd700',b0:'#332f00',b1:'#1a1800',brd:'rgba(255,255,180,.3)',w:.022,v:0},
      {id:'bon',icon:'🎡',lbl:'BONUS',glow:'#60a5fa',b0:'#001a3d',b1:'#000d1a',brd:'rgba(96,165,250,.4)',w:.035,v:0},
      {id:'hrt',icon:'💖',lbl:'',glow:'#ff4444',b0:'#280500',b1:'#140200',brd:'rgba(255,80,80,.25)',w:.108,v:.85},
      {id:'str',icon:'⭐',lbl:'',glow:'#fbbf24',b0:'#292400',b1:'#141200',brd:'rgba(255,220,0,.2)',w:.170,v:.25},
      {id:'dmd',icon:'💎',lbl:'',glow:'#22d3ee',b0:'#00252a',b1:'#001215',brd:'rgba(34,211,238,.25)',w:.148,v:.50},
      {id:'jwl',icon:'🔮',lbl:'',glow:'#a855f7',b0:'#18082a',b1:'#0c0415',brd:'rgba(168,85,247,.3)',w:.168,v:.40},
      {id:'glw',icon:'🌟',lbl:'',glow:'#4ade80',b0:'#002814',b1:'#00140a',brd:'rgba(74,222,128,.25)',w:.182,v:.30},
      {id:'flw',icon:'🌸',lbl:'',glow:'#f472b6',b0:'#2d0015',b1:'#15000a',brd:'rgba(244,114,182,.2)',w:.174,v:.20},
    ];
    const BETS = [0.10,0.20,0.50,1,2,5,10,20];

    class Reel {
      syms: typeof KSYMS; rows: number; cW: number; cH: number; N: number;
      strip: number[]; pos: number; vel: number; spinning: boolean; raf_: number|null;
      result: string[]; cvs: HTMLCanvasElement; ctx: CanvasRenderingContext2D;
      _cache: HTMLCanvasElement[]; _winClr: string|null;

      constructor(container: HTMLElement, syms: typeof KSYMS, rows: number, cellW: number, cellH: number) {
        this.syms=syms; this.rows=rows; this.cW=cellW; this.cH=cellH; this.N=40;
        this.strip=Array.from({length:this.N},()=>this._ridx());
        this.pos=0; this.vel=0; this.spinning=false; this.raf_=null; this.result=[]; this._winClr=null;
        const c=document.createElement('canvas');
        c.style.display='block'; c.style.borderRadius='6px';
        c.style.width=cellW+'px'; c.style.height=(rows*cellH)+'px';
        c.width=Math.round(cellW*DPR); c.height=Math.round(rows*cellH*DPR);
        container.appendChild(c); this.cvs=c; this.ctx=c.getContext('2d')!; this.ctx.scale(DPR,DPR);
        this._cache=syms.map(s=>this._bake(s)); this._draw([]);
      }

      _ridx(){let r=Math.random(),c=0;for(let i=0;i<this.syms.length;i++){c+=this.syms[i].w;if(r<c)return i;}return this.syms.length-1;}

      _rr(cx: CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number) {
        cx.beginPath();cx.moveTo(x+r,y);cx.lineTo(x+w-r,y);cx.arcTo(x+w,y,x+w,y+r,r);
        cx.lineTo(x+w,y+h-r);cx.arcTo(x+w,y+h,x+w-r,y+h,r);
        cx.lineTo(x+r,y+h);cx.arcTo(x,y+h,x,y+h-r,r);
        cx.lineTo(x,y+r);cx.arcTo(x,y,x+r,y,r);cx.closePath();
      }

      _bake(sym: typeof KSYMS[0]) {
        const oc=document.createElement('canvas');
        oc.width=Math.round(this.cW*DPR); oc.height=Math.round(this.cH*DPR);
        const cx=oc.getContext('2d')!; cx.scale(DPR,DPR);
        const w=this.cW,h=this.cH,pad=3,r=8;
        cx.save(); cx.beginPath(); this._rr(cx,pad,pad,w-pad*2,h-pad*2,r);
        const bg=cx.createLinearGradient(0,pad,0,h-pad);
        bg.addColorStop(0,sym.b0); bg.addColorStop(1,sym.b1);
        cx.fillStyle=bg; cx.fill();
        cx.strokeStyle=sym.brd||'rgba(255,255,255,.08)'; cx.lineWidth=1.5; cx.stroke();
        cx.shadowColor=sym.glow; cx.shadowBlur=h*.35;
        const fontStack = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji'";
        if(sym.lbl==='WILD'||sym.lbl==='FREE'||sym.lbl==='BONUS'){
          cx.font=`${Math.floor(h*.42)}px ${fontStack}`; cx.fillStyle='#fff';
          cx.textAlign='center'; cx.textBaseline='middle'; cx.fillText(sym.icon,w/2,h*.44);
          cx.shadowBlur=0;
          const lclr=sym.lbl==='WILD'?'#f472b6':sym.lbl==='FREE'?'gold':'#60a5fa';
          cx.fillStyle=lclr; cx.font=`900 ${Math.floor(h*.17)}px Orbitron, monospace`;
          cx.fillText(sym.lbl,w/2,h*.78);
        } else {
          cx.font=`${Math.floor(h*.52)}px ${fontStack}`; cx.fillStyle='#fff';
          cx.textAlign='center'; cx.textBaseline='middle'; cx.fillText(sym.icon,w/2,h*.52);
        }
        cx.restore();
        cx.save(); cx.beginPath(); this._rr(cx,pad,pad,w-pad*2,(h-pad*2)*.42,r);
        const shine=cx.createLinearGradient(0,pad,0,h*.42);
        shine.addColorStop(0,'rgba(255,255,255,.18)'); shine.addColorStop(1,'rgba(255,255,255,0)');
        cx.fillStyle=shine; cx.fill(); cx.restore();
        return oc;
      }

      _draw(winCells: number[]=[]) {
        const ctx=this.ctx,W=this.cW,H=this.rows*this.cH;
        ctx.clearRect(0,0,W,H);
        const sH=this.N*this.cH,norm=((this.pos%sH)+sH)%sH;
        const si=Math.floor(norm/this.cH),frac=norm%this.cH;
        for(let i=-1;i<=this.rows+1;i++){
          const idx=(si+i+this.N*100)%this.N,y=Math.round(i*this.cH-frac);
          if(y+this.cH>0&&y<H) ctx.drawImage(this._cache[this.strip[idx]],0,y);
        }
        if(winCells&&winCells.length){
          for(const r of winCells){
            if(r<0||r>=this.rows)continue;
            ctx.save(); ctx.strokeStyle=this._winClr||'#f472b6';
            ctx.shadowColor=this._winClr||'#f472b6'; ctx.shadowBlur=12; ctx.lineWidth=2.5;
            this._rr(ctx,3,r*this.cH+3,W-6,this.cH-6,6); ctx.stroke(); ctx.restore();
          }
        }
        if(this.spinning&&this.vel>10){const a=Math.min(.45,(this.vel-10)/35);ctx.fillStyle=`rgba(0,0,0,${a})`;ctx.fillRect(0,0,W,H);}
        const tg=ctx.createLinearGradient(0,0,0,H*.22);
        tg.addColorStop(0,'rgba(0,0,0,.75)'); tg.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=tg; ctx.fillRect(0,0,W,H*.22);
        const bgg=ctx.createLinearGradient(0,H*.78,0,H);
        bgg.addColorStop(0,'rgba(0,0,0,0)'); bgg.addColorStop(1,'rgba(0,0,0,.75)');
        ctx.fillStyle=bgg; ctx.fillRect(0,H*.78,W,H*.22);
      }

      start(){
        if(this.spinning)return; this.spinning=true; this.vel=2;
        let prev:number|null=null;
        const run=(ts:number)=>{
          if(!this.spinning)return; if(!prev)prev=ts;
          const dt=Math.min(ts-prev,50); prev=ts;
          this.vel=Math.min(this.vel+dt*.3,22);
          const sH=this.N*this.cH; this.pos=((this.pos+this.vel)%sH+sH)%sH;
          this._draw(); this.raf_=requestAnimationFrame(run);
        };
        this.raf_=requestAnimationFrame(run);
      }

      stop(resultIds: string[]): Promise<void> {
        return new Promise(resolve=>{
          if(this.raf_!==null)cancelAnimationFrame(this.raf_);
          this.spinning=false;
          const sH=this.N*this.cH,cH=this.cH,curVel=Math.max(this.vel,8),startPos=this.pos;
          const snapCell=Math.round((startPos+Math.max(6,Math.ceil(curVel/1.5))*cH)/cH)%this.N;
          for(let i=0;i<resultIds.length;i++){const si=this.syms.findIndex(s=>s.id===resultIds[i]);this.strip[(snapCell+i)%this.N]=si>=0?si:0;}
          const snapPos=(snapCell*cH)%sH;
          let dist=snapPos-startPos; if(dist<0)dist+=sH; if(dist<cH*3)dist+=sH;
          const dur=Math.max(480,dist/curVel*1.8); let t0:number|null=null;
          const ease=(t:number)=>t<.8?1-Math.pow(1-t/.8,3):1+Math.sin((t-.8)/.2*Math.PI)*.025*(1-(t-.8)/.2*.5);
          const frame=(ts:number)=>{
            if(!t0)t0=ts; const t=Math.min((ts-t0)/dur,1);
            this.pos=((startPos+dist*Math.min(ease(t),1.03))%sH+sH)%sH; this._draw();
            if(t<1){requestAnimationFrame(frame);}else{this.pos=snapPos;this.result=resultIds;this._draw();resolve();}
          };
          requestAnimationFrame(frame);
        });
      }

      getVisible(): string[] {
        const sH=this.N*this.cH,norm=((this.pos%sH)+sH)%sH,si=Math.floor(norm/this.cH)%this.N;
        return Array.from({length:this.rows},(_,i)=>this.syms[this.strip[(si+i)%this.N]].id);
      }

      highlightRows(rows:number[],clr='#f472b6'){this._winClr=clr;this._draw(rows);}
      clearHighlight(){this._winClr=null;this._draw();}
    }

    function makeGrid(stageId:string, cols:number, rows:number, syms:typeof KSYMS, _?:number):Reel[]{
      const stage=document.getElementById(stageId)!; stage.innerHTML='';
      const wrap = document.getElementById(stageId)?.parentElement;
      const availW = window.innerWidth - 24;
      const availH = wrap ? wrap.clientHeight - 10 : (window.innerHeight - 250);
      const px = Math.min(Math.floor(availW / cols), Math.floor(availH / rows), 50);
      const frame=document.createElement('div'); frame.className='cl-reel-frame';
      const row=document.createElement('div'); row.className='cl-reel-row';
      const reels:Reel[]=[];
      for(let c=0;c<cols;c++){const col=document.createElement('div');col.className='cl-rcol';row.appendChild(col);reels.push(new Reel(col,syms,rows,px,px));}
      frame.appendChild(row); stage.appendChild(frame); return reels;
    }

    let _tt:ReturnType<typeof setTimeout>|null=null;
    function toast(msg:string,bg='rgba(20,0,18,.95)',clr='#f472b6'){
      const t=document.getElementById('cl-toast')!;
      t.textContent=msg; t.style.background=bg; t.style.color=clr;
      t.classList.add('on'); if(_tt)clearTimeout(_tt);
      _tt=setTimeout(()=>t.classList.remove('on'),2600);
    }
    function flash(clr='rgba(244,114,182,.18)'){
      const f=document.getElementById('cl-flash')!;
      f.style.background=clr; f.classList.remove('go'); void (f as HTMLElement).offsetWidth; f.classList.add('go');
    }
    function bigWin(l1:string,l2:string,c1:string,c2:string,amt:number){
      document.getElementById('cl-bwl1')!.textContent=l1;
      (document.getElementById('cl-bwl1')! as HTMLElement).style.cssText=`color:${c1};text-shadow:0 0 40px ${c1}`;
      document.getElementById('cl-bwl2')!.textContent=l2;
      (document.getElementById('cl-bwl2')! as HTMLElement).style.cssText=`color:${c2};text-shadow:0 0 30px ${c2}`;
      document.getElementById('cl-bwamt')!.textContent='$'+amt.toFixed(2);
      document.getElementById('cl-bwin')!.classList.add('show');
    }

    function makeBets(id:string,state:{bet:number}){
      const row=document.getElementById(id)!; row.innerHTML='';
      BETS.forEach(b=>{
        const btn=document.createElement('button'); btn.className='cl-chip';
        btn.textContent=b<1?('.'+String(Math.round(b*100)).padStart(2,'0')):'$'+b;
        if(b===state.bet)btn.classList.add('on');
        btn.onclick=()=>{state.bet=b;row.querySelectorAll('.cl-chip').forEach((x:Element)=>x.classList.remove('on'));btn.classList.add('on');};
        row.appendChild(btn);
      });
    }

    const K={bal:balanceRef.current, bet:1, fs:0, busy:false, reels:[] as Reel[], totalMul:1, mmap:{} as Record<string,number>};

    function uK(){
      document.getElementById('cl-kb')!.textContent='$'+K.bal.toFixed(2);
      if(K.fs>0){document.getElementById('cl-kfb')!.style.display='';document.getElementById('cl-kf')!.textContent=String(K.fs);}
      else document.getElementById('cl-kfb')!.style.display='none';
      onBalanceChange(K.bal);
    }

    function kGrid():string[][]{return Array.from({length:5},(_,r)=>Array.from({length:6},(_,c)=>K.reels[c].getVisible()[r]));}

    function kBfs(grid:string[][],r:number,c:number):string[]{
      const id=grid[r][c]; if(!id||id==='tkt'||id==='wld')return[];
      const vis=new Set([`${r},${c}`]),q=[`${r},${c}`];
      while(q.length){
        const[cr,cc]=q.shift()!.split(',').map(Number);
        for(const[dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]){
          const nr=cr+dr,nc=cc+dc,k=`${nr},${nc}`;
          if(nr<0||nr>=5||nc<0||nc>=6||vis.has(k))continue;
          const ni=grid[nr][nc];
          if(ni===id||ni==='wld'){vis.add(k);q.push(k);}
        }
      }
      return vis.size>=8?[...vis]:[];
    }

    function kClusters(grid:string[][]){
      const vis=new Set<string>(),out:Array<{id:string,cells:string[]}>=[];
      for(let r=0;r<5;r++)for(let c=0;c<6;c++){
        if(vis.has(`${r},${c}`))continue;
        const cluster=kBfs(grid,r,c);
        if(cluster.length){cluster.forEach(k=>vis.add(k));out.push({id:grid[r][c],cells:cluster});}
      }
      return out;
    }

    async function spin(){
      if(K.busy)return;
      if(K.fs<=0 && K.bal<K.bet){toast('INSUFFICIENT FUNDS','#200010','#f472b6');return;}
      K.busy=true; if(K.fs<=0){K.bal-=K.bet;uK();}else{K.fs--;uK();}
      document.getElementById('cl-kspin')!.setAttribute('disabled','true');
      document.getElementById('cl-ki')!.textContent='MIXING FLAVORS...';
      K.reels.forEach(r=>r.start());
      
      try {
        const res=await apiRequest("POST","/api/slots/spin",{gameId:'candyland',bet:K.bet,isFree:K.fs>=0});
        await sleep(800);
        for(let i=0;i<K.reels.length;i++){await K.reels[i].stop(res.reels[i]);await sleep(120);}
        await sleep(300);

        let grid=kGrid(),clusters=kClusters(grid),totalWin=0,scatters=0,bonuses=0;
        grid.flat().forEach(s=>{if(s==='sct')scatters++;if(s==='bon')bonuses++;});

        if(clusters.length){
          let win=0;
          for(const c of clusters){
            const sym=KSYMS.find(s=>s.id===c.id)!;
            const mult=sym.v||0.5;
            const cwin=K.bet*mult*(c.cells.length/8);
            win+=cwin;
            K.reels.forEach((r,idx)=>r.highlightRows(c.cells.filter(k=>Number(k.split(',')[1])===idx).map(k=>Number(k.split(',')[0]))));
          }
          totalWin=win; K.bal+=win; uK();
          document.getElementById('cl-kw')!.textContent='$'+win.toFixed(2);
          if(win>=K.bet*20)bigWin('CANDY','EXPLOSION','#f472b6','#fbbf24',win);
          else if(win>=K.bet*5)bigWin('SWEET','VICTORY','#f472b6','#fff',win);
          await sleep(2000); K.reels.forEach(r=>r.clearHighlight());
        }

        if(scatters>=3){
          flash('#f472b6'); toast('FREE SPINS UNLOCKED!');
          await sleep(1000); K.fs+=scatters*3; uK();
        }

        if(bonuses>=3){
          await sleep(500);
          window._clCwStart(K.bet);
        } else {
          K.busy=false; document.getElementById('cl-kspin')!.removeAttribute('disabled');
          document.getElementById('cl-ki')!.textContent='';
        }
      } catch(e){
        console.error(e); toast('NETWORK ERROR');
        K.busy=false; document.getElementById('cl-kspin')!.removeAttribute('disabled');
        K.reels.forEach(r=>r.stop(Array(5).fill('hrt')));
      }
    }

    // ── Bonus Game ──
    const cwSects=[{v:0,l:'MISS',c:'#333'},{v:2,l:'x2',c:'#f472b6'},{v:5,l:'x5',c:'#fbbf24'},{v:10,l:'x10',c:'#60a5fa'},{v:0,l:'MISS',c:'#333'},{v:3,l:'x3',c:'#f472b6'},{v:20,l:'x20',c:'#4ade80'},{v:50,l:'JACKPOT',c:'gold'}];
    let cwState={bet:0,total:0,spins:3,busy:false};
    window._clCwStart=(bet:number)=>{
      cwState={bet,total:0,spins:3,busy:false};
      document.getElementById('cl-bonus-candy')!.classList.add('open');
      document.getElementById('cl-cw-total')!.textContent='$0.00';
      document.getElementById('cl-cw-results')!.innerHTML='';
      document.getElementById('cl-cw-collect')!.style.display='none';
      uCwSpins(); drawCw(0);
    };
    function uCwSpins(){
      const c=$('cl-cw-spins')!; c.innerHTML='';
      for(let i=0;i<3;i++){
        const d=document.createElement('div'); d.className='cl-cw-dot'+(i<3-cwState.spins?' used':(i===3-cwState.spins?' active':''));
        c.appendChild(d);
      }
    }
    function drawCw(ang:number){
      const cvs=$('cl-cw-canvas') as HTMLCanvasElement; if(!cvs)return;
      const ctx=cvs.getContext('2d')!;
      const size=260*DPR; cvs.width=size; cvs.height=size;
      ctx.scale(DPR,DPR); ctx.translate(130,130); ctx.rotate(ang);
      const r=125;
      cwSects.forEach((s,i)=>{
        const a=Math.PI*2/cwSects.length;
        ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0,r,i*a,(i+1)*a);
        ctx.fillStyle=s.c; ctx.fill(); ctx.strokeStyle='rgba(255,255,255,.2)'; ctx.lineWidth=2; ctx.stroke();
        ctx.save(); ctx.rotate(i*a+a/2); ctx.fillStyle='#fff'; ctx.font='900 12px Orbitron,monospace';
        ctx.textAlign='right'; ctx.fillText(s.l,r-15,5); ctx.restore();
      });
      ctx.beginPath(); ctx.arc(0,0,15,0,Math.PI*2); ctx.fillStyle='#fff'; ctx.fill();
    }
    async function cwSpin(){
      if(cwState.busy||cwState.spins<=0)return;
      cwState.busy=true; cwState.spins--; uCwSpins();
      document.getElementById('cl-cw-spin-btn')!.setAttribute('disabled','true');
      const target=Math.floor(Math.random()*cwSects.length);
      const full=Math.PI*2, sect=full/cwSects.length;
      const endAng=full*6 + (full - (target*sect + sect/2));
      let start=performance.now();
      const anim=(now:number)=>{
        const t=Math.min((now-start)/4000,1);
        const ease=1-Math.pow(1-t,3); drawCw(endAng*ease);
        if(t<1)requestAnimationFrame(anim);
        else{
          const res=cwSects[target];
          if(res.v>0){
            const win=cwState.bet*res.v; cwState.total+=win;
            document.getElementById('cl-cw-total')!.textContent='$'+cwState.total.toFixed(2);
            const item=document.createElement('div'); item.className='cl-cw-result-item';
            item.innerHTML=`<span>${res.l}</span><span>+$${win.toFixed(2)}</span>`;
            document.getElementById('cl-cw-results')!.prepend(item);
          }
          cwState.busy=false;
          if(cwState.spins>0)document.getElementById('cl-cw-spin-btn')!.removeAttribute('disabled');
          else document.getElementById('cl-cw-collect')!.style.display='block';
        }
      };
      requestAnimationFrame(anim);
    }
    window._clCwCollect=async ()=>{
      K.bal+=cwState.total; uK();
      document.getElementById('cl-bonus-candy')!.classList.remove('open');
      K.busy=false; document.getElementById('cl-kspin')!.removeAttribute('disabled');
      document.getElementById('cl-ki')!.textContent='';
    };

    K.reels=makeGrid('cl-ks',6,5,KSYMS);
    makeBets('cl-kbets',K);
    document.getElementById('cl-kspin')!.onclick=spin;
    document.getElementById('cl-cw-spin-btn')!.onclick=cwSpin;

    return () => {
      K.reels.forEach(r=>{if(r.raf_)cancelAnimationFrame(r.raf_)});
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
