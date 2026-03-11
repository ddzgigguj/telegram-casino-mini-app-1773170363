import { useEffect, useRef } from "react";
import { useTelegram } from "@/components/TelegramProvider";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft } from "lucide-react";

interface NeonNightsGameProps {
  balance: number;
  onBalanceChange: (newBalance: number) => void;
  onBack: () => void;
}

export function NeonNightsGame({ balance, onBalanceChange, onBack }: NeonNightsGameProps) {
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
      .nn-root{font-family:'Orbitron',monospace;color:#fff;display:flex;flex-direction:column;height:100%;background:#04000e;overflow:hidden;position:relative}
      .nn-root::before{content:'';position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,245,212,.012) 3px,rgba(0,245,212,.012) 4px);pointer-events:none}
      .nn-hud{display:flex;gap:6px;padding:5px 12px;flex-shrink:0;position:relative;z-index:1}
      .nn-hbox{flex:1;background:rgba(0,245,212,.04);border:1px solid rgba(0,245,212,.15);border-radius:8px;padding:4px 6px;text-align:center}
      .nn-hl{font-size:7px;letter-spacing:1.5px;color:#00f5d4;margin-bottom:2px;opacity:.7}
      .nn-hv{font-size:13px;font-weight:700;line-height:1}
      .nn-ibar{font-size:11px;text-align:center;padding:2px 12px 3px;flex-shrink:0;min-height:18px;font-weight:700;letter-spacing:1px;position:relative;z-index:1}
      .nn-reel-wrap{flex:1;display:flex;align-items:center;justify-content:center;padding:6px 10px;min-height:0;overflow:hidden;position:relative;z-index:1}
      .nn-reel-frame{background:#0a0a10;border-radius:14px;padding:6px;border:2px solid rgba(0,245,212,.2);box-shadow:0 0 0 1px rgba(0,0,0,.8),inset 0 1px 0 rgba(0,245,212,.06),0 4px 30px rgba(0,0,0,.8),0 0 40px rgba(0,245,212,.05)}
      .nn-reel-row{display:flex;gap:4px}
      .nn-rcol{position:relative;border-radius:8px;overflow:hidden}
      .nn-ctrl{padding:5px 12px 10px;flex-shrink:0;border-top:1px solid rgba(0,245,212,.1);position:relative;z-index:1}
      .nn-brow{display:flex;gap:5px;margin-bottom:7px;justify-content:center}
      .nn-chip{width:40px;height:40px;border-radius:50%;border:2px solid rgba(0,245,212,.25);background:rgba(0,245,212,.05);color:#00f5d4;font-size:9px;font-weight:700;cursor:pointer;transition:all .15s;font-family:'Orbitron',monospace;display:flex;align-items:center;justify-content:center}
      .nn-chip.on{border-color:#00f5d4;background:#00f5d4;color:#000;box-shadow:0 0 12px #00f5d4,0 0 25px rgba(0,245,212,.3);transform:scale(1.08)}
      .nn-sbtn{width:100%;height:50px;border:none;border-radius:12px;font-size:15px;font-weight:700;font-family:'Orbitron',monospace;letter-spacing:1px;cursor:pointer;background:linear-gradient(135deg,#00f5d4,#7209b7);color:#000;box-shadow:0 0 20px rgba(0,245,212,.25);border:1px solid rgba(0,245,212,.4);position:relative;overflow:hidden}
      .nn-sbtn:disabled{opacity:.35;cursor:default;pointer-events:none}
      .nn-sbtn::before{content:'';position:absolute;top:0;left:-100%;width:50%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.15),transparent);animation:nnShimmer 2.5s infinite}
      @keyframes nnShimmer{0%{left:-100%}100%{left:200%}}
      .nn-flash{position:fixed;inset:0;pointer-events:none;z-index:50;opacity:0}
      .nn-flash.go{animation:nnFlash .5s ease}
      @keyframes nnFlash{0%,100%{opacity:0}25%{opacity:1}}
      .nn-bigwin{display:none;position:fixed;inset:0;z-index:100;align-items:center;justify-content:center;flex-direction:column}
      .nn-bigwin.show{display:flex}
      .nn-bigwin::before{content:'';position:absolute;inset:0;background:rgba(0,0,0,.92)}
      .nn-bwc{position:relative;z-index:1;text-align:center;animation:nnBwPop .4s cubic-bezier(.17,.89,.32,1.4)}
      @keyframes nnBwPop{from{transform:scale(.3);opacity:0}to{transform:scale(1);opacity:1}}
      .nn-bwl1{font-size:40px;font-weight:900;line-height:1}
      .nn-bwl2{font-size:40px;font-weight:900;line-height:1;margin-bottom:14px}
      .nn-bwamt{font-size:30px;color:#ffd700;font-weight:700}
      .nn-bwx{margin-top:20px;padding:12px 36px;border:2px solid rgba(0,245,212,.4);background:transparent;color:#00f5d4;font-family:'Orbitron',monospace;font-weight:700;font-size:12px;border-radius:8px;cursor:pointer;letter-spacing:2px;position:relative;z-index:1}
      .nn-toast{position:fixed;bottom:90px;left:50%;transform:translateX(-50%) translateY(15px);padding:9px 18px;border-radius:20px;font-size:13px;font-weight:700;white-space:nowrap;z-index:200;opacity:0;transition:all .3s;backdrop-filter:blur(12px);border:1px solid rgba(0,245,212,.2)}
      .nn-toast.on{opacity:1;transform:translateX(-50%) translateY(0)}
      /* Bonus */
      .nn-bonus{display:none;position:fixed;inset:0;z-index:400;flex-direction:column;align-items:center;justify-content:flex-start;overflow-y:auto;background:#03000f}
      .nn-bonus.open{display:flex}
      .nn-bonus-scanline{position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,245,212,.015) 3px,rgba(0,245,212,.015) 4px);pointer-events:none}
      .nn-hs-fws{display:flex;gap:6px;justify-content:center;margin-bottom:8px}
      .nn-hs-fw{width:30px;height:30px;border-radius:6px;background:#0a0a14;border:2px solid rgba(255,7,58,.4);font-size:14px;display:flex;align-items:center;justify-content:center;transition:all .3s}
      .nn-hs-fw.hit{background:#200008;border-color:#ff073a;box-shadow:0 0 12px #ff073a}
      .nn-hs-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;padding:0 12px;width:100%;max-width:380px}
      .nn-hs-node{aspect-ratio:1;border-radius:8px;border:1.5px solid rgba(0,245,212,.25);background:linear-gradient(135deg,#040020,#020010);cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:20px;transition:transform .12s,box-shadow .2s;position:relative;overflow:hidden}
      .nn-hs-node:active:not(.revealed){transform:scale(.93)}
      .nn-hs-node.revealed{cursor:default}
      .nn-hs-node.credits{border-color:#00f5d4;background:linear-gradient(135deg,#001520,#000c14);box-shadow:0 0 12px rgba(0,245,212,.25);animation:nnCardFlip .3s ease}
      .nn-hs-node.multi{border-color:#ffd700;background:linear-gradient(135deg,#151000,#0a0800);box-shadow:0 0 12px rgba(255,215,0,.3);animation:nnCardFlip .3s ease}
      .nn-hs-node.firewall{border-color:#ff073a;background:linear-gradient(135deg,#150003,#0a0002);box-shadow:0 0 15px rgba(255,7,58,.4);animation:nnCardFlip .3s ease}
      .nn-nval{font-size:9px;font-weight:900;font-family:'Orbitron',monospace;margin-top:1px;letter-spacing:.5px}
      .nn-hs-trace{width:100%;max-width:380px;padding:6px 12px;font-size:10px;color:#00f5d4;font-family:'Orbitron',monospace;letter-spacing:1px;min-height:20px;text-align:center;opacity:.7}
      @keyframes nnCardFlip{0%{transform:rotateY(90deg);opacity:0}100%{transform:rotateY(0);opacity:1}}
      .nn-hs-total{font-size:26px;font-weight:900;font-family:'Orbitron',monospace;color:#00f5d4;margin:2px 14px;min-height:36px}
      .nn-collect{padding:12px 40px;border:none;border-radius:12px;font-size:14px;font-weight:900;font-family:'Orbitron',monospace;letter-spacing:1.5px;cursor:pointer;margin:10px 0 14px;background:linear-gradient(135deg,#00f5d4,#7209b7);color:#000}
    `;
    document.head.appendChild(style);

    container.innerHTML = `
      <div class="nn-root" id="nn-root">
        <div class="nn-hud">
          <div class="nn-hbox"><div class="nn-hl">CREDITS</div><div class="nn-hv" id="nn-cb" style="color:#ffd60a">$${balanceRef.current.toFixed(2)}</div></div>
          <div class="nn-hbox" id="nn-cfb" style="display:none;border-color:rgba(0,245,212,.3)"><div class="nn-hl">FREE</div><div class="nn-hv" id="nn-cf" style="color:#00f5d4">0</div></div>
          <div class="nn-hbox"><div class="nn-hl">WIN</div><div class="nn-hv" id="nn-cw" style="color:#00ff88">—</div></div>
        </div>
        <div class="nn-ibar" id="nn-ci"></div>
        <div class="nn-reel-wrap" id="nn-cs"></div>
        <div class="nn-ctrl">
          <div class="nn-brow" id="nn-cbets"></div>
          <button class="nn-sbtn" id="nn-cspin">⚡ &nbsp;ENGAGE</button>
        </div>
      </div>

      <!-- Bonus: Hack the System -->
      <div class="nn-bonus" id="nn-bonus-cyber">
        <div class="nn-bonus-scanline"></div>
        <div style="position:relative;z-index:1;width:100%;text-align:center;padding:14px 16px 4px">
          <div style="font-size:22px;font-weight:900;letter-spacing:2px;color:#00f5d4;text-shadow:0 0 20px #00f5d4">⚡ HACK THE SYSTEM</div>
          <div style="font-size:10px;letter-spacing:3px;margin-top:3px;color:#f72585;opacity:.8">PICK TERMINALS · AVOID FIREWALLS</div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 14px 0">
            <div style="font-size:11px;color:#00f5d4">FIREWALLS</div>
            <div style="font-size:11px;color:#00f5d4">CREDITS</div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding:0 14px">
            <div class="nn-hs-fws" id="nn-hs-fws"></div>
            <div class="nn-hs-total" id="nn-hs-total">$0.00</div>
          </div>
          <div class="nn-hs-trace" id="nn-hs-trace">SYSTEM READY. SELECT A TERMINAL...</div>
        </div>
        <div class="nn-hs-grid" id="nn-hs-grid" style="position:relative;z-index:1"></div>
        <button class="nn-collect" id="nn-hs-collect" style="display:none;position:relative;z-index:1" onclick="window._nnHsCollect()">⬆ EXTRACT CREDITS</button>
      </div>

      <div class="nn-flash" id="nn-flash"></div>
      <div class="nn-bigwin" id="nn-bwin">
        <div class="nn-bwc">
          <div class="nn-bwl1" id="nn-bwl1"></div>
          <div class="nn-bwl2" id="nn-bwl2"></div>
          <div class="nn-bwamt" id="nn-bwamt"></div>
        </div>
        <button class="nn-bwx" onclick="document.getElementById('nn-bwin').classList.remove('show')">COLLECT</button>
      </div>
      <div class="nn-toast" id="nn-toast"></div>
    `;

    const $ = (id: string) => document.getElementById(id);
    const DPR = window.devicePixelRatio || 1;
    const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

    const CSYMS = [
      {id:'skl',icon:'💀',lbl:'WILD',glow:'#ff073a',b0:'#200005',b1:'#0f0002',brd:'rgba(255,10,60,.5)',w:.028,v:0},
      {id:'bot',icon:'🤖',lbl:'SCAN',glow:'#00f5d4',b0:'#001820',b1:'#000c14',brd:'rgba(0,245,212,.4)',w:.038,v:0},
      {id:'bon',icon:'💿',lbl:'HACK',glow:'#ff073a',b0:'#1a0010',b1:'#0d0008',brd:'rgba(255,7,58,.5)',w:.038,v:0},
      {id:'sev',icon:'7',lbl:'7',glow:'#ff073a',b0:'#1e0008',b1:'#0f0004',brd:'rgba(255,30,80,.4)',w:.110,v:12},
      {id:'dia',icon:'◆',lbl:'',glow:'#00c8ff',b0:'#000c1e',b1:'#000610',brd:'rgba(0,200,255,.35)',w:.135,v:8},
      {id:'btc',icon:'₿',lbl:'',glow:'#ffd700',b0:'#1a1200',b1:'#0d0900',brd:'rgba(255,215,0,.3)',w:.155,v:6},
      {id:'bar',icon:'BAR',lbl:'BAR',glow:'#c0c0c0',b0:'#141414',b1:'#0a0a0a',brd:'rgba(180,180,180,.3)',w:.180,v:4},
      {id:'neo',icon:'⚡',lbl:'',glow:'#00ff88',b0:'#00160a',b1:'#000c05',brd:'rgba(0,255,136,.25)',w:.354,v:2},
    ];
    const BETS = [0.10,0.20,0.50,1,2,5,10,20];

    function pick(syms: typeof CSYMS): string {
      let r=Math.random(),c=0;
      for(const s of syms){c+=s.w;if(r<c)return s.id;}
      return syms[syms.length-1].id;
    }
    function getsym(syms: typeof CSYMS, id: string) {
      return syms.find(s=>s.id===id)||syms[syms.length-1];
    }

    class Reel {
      syms: typeof CSYMS; rows: number; cW: number; cH: number; N: number;
      strip: number[]; pos: number; vel: number; spinning: boolean;
      raf_: number|null; result: string[]; cvs: HTMLCanvasElement;
      ctx: CanvasRenderingContext2D; _cache: HTMLCanvasElement[]; _winClr: string|null;

      constructor(container: HTMLElement, syms: typeof CSYMS, rows: number, cellW: number, cellH: number) {
        this.syms=syms; this.rows=rows; this.cW=cellW; this.cH=cellH; this.N=40;
        this.strip=Array.from({length:this.N},()=>this._ridx());
        this.pos=0; this.vel=0; this.spinning=false; this.raf_=null; this.result=[]; this._winClr=null;
        const c=document.createElement('canvas');
        c.style.display='block'; c.style.borderRadius='6px';
        c.style.width=cellW+'px'; c.style.height=(rows*cellH)+'px';
        c.width=Math.round(cellW*DPR); c.height=Math.round(rows*cellH*DPR);
        container.appendChild(c);
        this.cvs=c; this.ctx=c.getContext('2d')!; this.ctx.scale(DPR,DPR);
        this._cache=syms.map(s=>this._bake(s)); this._draw([]);
      }

      _ridx(){let r=Math.random(),c=0;for(let i=0;i<this.syms.length;i++){c+=this.syms[i].w;if(r<c)return i;}return this.syms.length-1;}

      _rr(cx: CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number) {
        cx.beginPath();cx.moveTo(x+r,y);cx.lineTo(x+w-r,y);cx.arcTo(x+w,y,x+w,y+r,r);
        cx.lineTo(x+w,y+h-r);cx.arcTo(x+w,y+h,x+w-r,y+h,r);
        cx.lineTo(x+r,y+h);cx.arcTo(x,y+h,x,y+h-r,r);
        cx.lineTo(x,y+r);cx.arcTo(x,y,x+r,y,r);cx.closePath();
      }

      _bake(sym: typeof CSYMS[0]) {
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
        if(sym.icon==='7'){
          cx.shadowColor='#ff073a'; cx.shadowBlur=h*.5;
          cx.font=`900 ${Math.floor(h*.58)}px Orbitron,monospace`;
          cx.textAlign='center'; cx.textBaseline='middle';
          const g7=cx.createLinearGradient(0,h*.2,0,h*.8);
          g7.addColorStop(0,'#ff5555'); g7.addColorStop(1,'#cc0022');
          cx.fillStyle=g7; cx.fillText('7',w/2,h*.52);
        } else if(sym.icon==='◆'){
          cx.beginPath(); cx.moveTo(w/2,h*.15); cx.lineTo(w*.78,h*.5); cx.lineTo(w/2,h*.85); cx.lineTo(w*.22,h*.5); cx.closePath();
          const dg=cx.createLinearGradient(w*.22,h*.15,w*.78,h*.85);
          dg.addColorStop(0,'#7ee8fa'); dg.addColorStop(.5,'#80ff72'); dg.addColorStop(1,'#00c8ff');
          cx.fillStyle=dg; cx.fill(); cx.strokeStyle='rgba(255,255,255,.5)'; cx.lineWidth=1; cx.stroke();
        } else if(sym.icon==='₿'){
          cx.font=`900 ${Math.floor(h*.54)}px serif`;
          cx.textAlign='center'; cx.textBaseline='middle';
          const bg2=cx.createLinearGradient(0,h*.2,0,h*.8);
          bg2.addColorStop(0,'#ffd700'); bg2.addColorStop(1,'#ff8c00');
          cx.fillStyle=bg2; cx.fillText('₿',w/2,h*.52);
        } else if(sym.icon==='BAR'){
          cx.beginPath(); this._rr(cx,w*.12,h*.28,w*.76,h*.44,4);
          const bar=cx.createLinearGradient(0,h*.28,0,h*.72);
          bar.addColorStop(0,'#e0e0e0'); bar.addColorStop(.5,'#c0c0c0'); bar.addColorStop(1,'#888');
          cx.fillStyle=bar; cx.fill(); cx.strokeStyle='rgba(255,255,255,.4)'; cx.lineWidth=1; cx.stroke();
          cx.shadowBlur=0; cx.fillStyle='#222';
          cx.font=`900 ${Math.floor(h*.22)}px Orbitron,monospace`;
          cx.textAlign='center'; cx.textBaseline='middle'; cx.fillText('BAR',w/2,h*.5);
        } else if(sym.lbl==='WILD'){
          cx.font=`${Math.floor(h*.42)}px serif`; cx.fillStyle='#fff';
          cx.textAlign='center'; cx.textBaseline='middle'; cx.fillText(sym.icon,w/2,h*.44);
          cx.shadowBlur=0; const wg=cx.createLinearGradient(0,0,w,0);
          wg.addColorStop(0,'#ff073a'); wg.addColorStop(.5,'#fff'); wg.addColorStop(1,'#ff073a');
          cx.fillStyle=wg; cx.font=`900 ${Math.floor(h*.18)}px Orbitron,monospace`;
          cx.fillText('WILD',w/2,h*.78);
        } else if(sym.lbl==='SCAN'||sym.lbl==='HACK'){
          cx.font=`${Math.floor(h*.4)}px serif`; cx.fillStyle='#fff';
          cx.textAlign='center'; cx.textBaseline='middle'; cx.fillText(sym.icon,w/2,h*.44);
          cx.shadowBlur=0;
          cx.font=`900 ${Math.floor(h*.17)}px Orbitron,monospace`;
          cx.fillStyle=sym.lbl==='SCAN'?'#00f5d4':'#ff073a';
          cx.fillText(sym.lbl,w/2,h*.78);
        } else {
          cx.font=`${Math.floor(h*.52)}px serif`; cx.fillStyle='#fff';
          cx.textAlign='center'; cx.textBaseline='middle'; cx.fillText(sym.icon,w/2,h*.52);
        }
        cx.restore(); return oc;
      }

      _draw(winCells: number[]=[]) {
        const ctx=this.ctx,W=this.cW,H=this.rows*this.cH;
        ctx.clearRect(0,0,W,H);
        const sH=this.N*this.cH,norm=((this.pos%sH)+sH)%sH;
        const si=Math.floor(norm/this.cH),frac=norm%this.cH;
        for(let i=-1;i<=this.rows+1;i++){
          const idx=(si+i+this.N*100)%this.N, y=Math.round(i*this.cH-frac);
          if(y+this.cH>0&&y<H) ctx.drawImage(this._cache[this.strip[idx]],0,y);
        }
        if(winCells&&winCells.length){
          for(const r of winCells){
            if(r<0||r>=this.rows)continue;
            ctx.save(); ctx.strokeStyle=this._winClr||'#00f5d4';
            ctx.shadowColor=this._winClr||'#00f5d4'; ctx.shadowBlur=12; ctx.lineWidth=2.5;
            this._rr(ctx,3,r*this.cH+3,W-6,this.cH-6,6); ctx.stroke(); ctx.restore();
          }
        }
        if(this.spinning&&this.vel>10){const a=Math.min(.45,(this.vel-10)/35);ctx.fillStyle=`rgba(0,0,0,${a})`;ctx.fillRect(0,0,W,H);}
        const tg=ctx.createLinearGradient(0,0,0,H*.22);
        tg.addColorStop(0,'rgba(0,0,0,.75)'); tg.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=tg; ctx.fillRect(0,0,W,H*.22);
        const bg=ctx.createLinearGradient(0,H*.78,0,H);
        bg.addColorStop(0,'rgba(0,0,0,0)'); bg.addColorStop(1,'rgba(0,0,0,.75)');
        ctx.fillStyle=bg; ctx.fillRect(0,H*.78,W,H*.22);
      }

      start(){
        if(this.spinning)return; this.spinning=true; this.vel=2;
        let prev: number|null=null;
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
          const travelCells=Math.max(6,Math.ceil(curVel/1.5));
          const snapCell=Math.round((startPos+travelCells*cH)/cH)%this.N;
          for(let i=0;i<resultIds.length;i++){const si=this.syms.findIndex(s=>s.id===resultIds[i]);this.strip[(snapCell+i)%this.N]=si>=0?si:0;}
          const snapPos=(snapCell*cH)%sH;
          let dist=snapPos-startPos; if(dist<0)dist+=sH; if(dist<cH*3)dist+=sH;
          const dur=Math.max(480,dist/curVel*1.8); let t0: number|null=null;
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

      highlightRows(rows: number[], clr='#00f5d4'){this._winClr=clr;this._draw(rows);}
      clearHighlight(){this._winClr=null;this._draw();}
    }

    function makeGrid(stageId: string, cols: number, rows: number, syms: typeof CSYMS): Reel[] {
      const stage=document.getElementById(stageId)!; stage.innerHTML='';
      const sw = Math.min(window.innerWidth, stage.clientWidth||window.innerWidth) - 24;
      const byCols = Math.floor((sw - (cols-1)*4) / cols);
      const maxH = Math.floor((window.innerHeight - 220 - (rows-1)*4) / rows);
      const px = Math.min(byCols, maxH, 58);
      const frame=document.createElement('div'); frame.className='nn-reel-frame';
      const row=document.createElement('div'); row.className='nn-reel-row';
      const reels:Reel[]=[];
      for(let c=0;c<cols;c++){const col=document.createElement('div');col.className='nn-rcol';row.appendChild(col);reels.push(new Reel(col,syms,rows,px,px));}
      frame.appendChild(row); stage.appendChild(frame); return reels;
    }

    let _tt: ReturnType<typeof setTimeout>|null=null;
    function toast(msg:string,bg='rgba(0,5,20,.95)',clr='#00f5d4'){
      const t=document.getElementById('nn-toast')!;
      t.textContent=msg; t.style.background=bg; t.style.color=clr;
      t.classList.add('on'); if(_tt)clearTimeout(_tt);
      _tt=setTimeout(()=>t.classList.remove('on'),2600);
    }
    function flash(clr='rgba(0,245,212,.1)'){
      const f=document.getElementById('nn-flash')!;
      f.style.background=clr; f.classList.remove('go'); void (f as HTMLElement).offsetWidth; f.classList.add('go');
    }
    function bigWin(l1:string,l2:string,c1:string,c2:string,amt:number){
      document.getElementById('nn-bwl1')!.textContent=l1;
      (document.getElementById('nn-bwl1')! as HTMLElement).style.cssText=`color:${c1};text-shadow:0 0 40px ${c1}`;
      document.getElementById('nn-bwl2')!.textContent=l2;
      (document.getElementById('nn-bwl2')! as HTMLElement).style.cssText=`color:${c2};text-shadow:0 0 30px ${c2}`;
      document.getElementById('nn-bwamt')!.textContent='$'+amt.toFixed(2);
      document.getElementById('nn-bwin')!.classList.add('show');
    }

    function makeBets(id:string, state:{bet:number}){
      const row=document.getElementById(id)!; row.innerHTML='';
      BETS.forEach(b=>{
        const btn=document.createElement('button'); btn.className='nn-chip';
        btn.textContent=b<1?('.'+String(Math.round(b*100)).padStart(2,'0')):'$'+b;
        if(b===state.bet)btn.classList.add('on');
        btn.onclick=()=>{state.bet=b;row.querySelectorAll('.nn-chip').forEach((x:Element)=>x.classList.remove('on'));btn.classList.add('on');};
        row.appendChild(btn);
      });
    }

    const C={bal:balanceRef.current, bet:1, fs:0, busy:false, reels:[] as Reel[], sticky:{} as Record<string,number>};

    const CLINES=[
      [[1,0],[1,1],[1,2],[1,3],[1,4]],[[0,0],[0,1],[0,2],[0,3],[0,4]],
      [[2,0],[2,1],[2,2],[2,3],[2,4]],[[3,0],[3,1],[3,2],[3,3],[3,4]],
      [[0,0],[1,1],[2,2],[1,3],[0,4]],[[3,0],[2,1],[1,2],[2,3],[3,4]],
      [[0,0],[1,1],[1,2],[1,3],[0,4]],[[3,0],[2,1],[2,2],[2,3],[3,4]],
      [[1,0],[0,1],[0,2],[0,3],[1,4]],[[2,0],[3,1],[3,2],[3,3],[2,4]],
    ] as [number,number][][];

    function cGrid():string[][]{return Array.from({length:4},(_,r)=>Array.from({length:5},(_,c)=>C.reels[c].getVisible()[r]));}

    function cPay(g:string[][]){
      let tot=0; const wc:string[]=[];
      for(const ln of CLINES){
        const ids=ln.map(([r,c])=>g[r][c]);
        let ms=ids[0]==='skl'?(ids.find(s=>s!=='skl')||'skl'):ids[0];
        let cnt=0; for(const s of ids){if(s===ms||s==='skl')cnt++;else break;}
        if(cnt>=3){
          const s=getsym(CSYMS,ms); const p=cnt===3?s.v:cnt===4?s.v*3:s.v*10;
          if(p>0){tot+=p*C.bet;ln.slice(0,cnt).forEach(([r,c])=>{const k=`${r}_${c}`;if(!wc.includes(k))wc.push(k);});}
        }
      }
      return{tot,wc};
    }

    function uC(){
      document.getElementById('nn-cb')!.textContent='$'+C.bal.toFixed(2);
      if(C.fs>0){document.getElementById('nn-cfb')!.style.display='';document.getElementById('nn-cf')!.textContent=String(C.fs);}
      else document.getElementById('nn-cfb')!.style.display='none';
      onBalanceChange(C.bal);
    }

    // Hack the System bonus
    const HS_NODES = [
      {type:'credits',icon:'💾',val:3,w:.13},{type:'credits',icon:'💾',val:5,w:.11},
      {type:'credits',icon:'💾',val:8,w:.09},{type:'credits',icon:'💾',val:12,w:.07},
      {type:'credits',icon:'💾',val:20,w:.05},{type:'multi',icon:'⭐',val:2,w:.10},
      {type:'multi',icon:'⭐',val:3,w:.07},{type:'multi',icon:'⭐',val:5,w:.04},
      {type:'firewall',icon:'🔥',val:0,w:.34},
    ];
    function hsPick(){let r=Math.random(),c=0;for(const p of HS_NODES){c+=p.w;if(r<c)return{...p};}return{...HS_NODES[HS_NODES.length-1]};}

    let _hsResolve:((v:number)=>void)|null=null;

    function hsBonus(bet:number):Promise<number>{
      return new Promise(resolve=>{
        const overlay=document.getElementById('nn-bonus-cyber')!;
        overlay.classList.add('open'); _hsResolve=resolve;
        const fwsEl=document.getElementById('nn-hs-fws')!;
        const totalEl=document.getElementById('nn-hs-total')!;
        const gridEl=document.getElementById('nn-hs-grid')!;
        const collectBtn=document.getElementById('nn-hs-collect')!;
        const traceEl=document.getElementById('nn-hs-trace')!;

        let firewalls=0,maxFw=3,multi=1,total=0,active=true;
        const nodes=Array.from({length:20},hsPick);
        let fwCount=nodes.filter(n=>n.type==='firewall').length;
        if(fwCount>maxFw){
          let excess=fwCount-maxFw;
          for(let i=0;i<nodes.length&&excess>0;i++){
            if(nodes[i].type==='firewall'){nodes[i]={type:'credits',icon:'💾',val:3,w:0};excess--;}
          }
        }

        fwsEl.innerHTML='';
        for(let i=0;i<maxFw;i++){const d=document.createElement('div');d.className='nn-hs-fw';d.textContent='🛡️';fwsEl.appendChild(d);}

        gridEl.innerHTML='';
        nodes.forEach((_,i)=>{
          const node=document.createElement('div'); node.className='nn-hs-node';
          node.innerHTML='<span style="font-size:20px">📟</span>';
          node.onclick=()=>{
            if(!active||node.classList.contains('revealed'))return;
            const data=nodes[i]; node.classList.add('revealed'); node.innerHTML='';
            const ico=document.createElement('span'); ico.style.fontSize='20px'; ico.textContent=data.icon;
            node.appendChild(ico);

            if(data.type==='firewall'){
              node.classList.add('firewall'); firewalls++;
              const fwEls=fwsEl.querySelectorAll('.nn-hs-fw');
              if(fwEls[firewalls-1])fwEls[firewalls-1].classList.add('hit');
              traceEl.textContent=`⚠️ FIREWALL DETECTED! (${firewalls}/${maxFw})`;
              const val=document.createElement('div'); val.className='nn-nval'; val.style.color='#ff073a'; val.textContent='BLOCKED';
              node.appendChild(val);
              if(firewalls>=maxFw){
                active=false;
                traceEl.textContent='🚨 SYSTEM LOCKDOWN — EXTRACTING...';
                setTimeout(()=>{
                  gridEl.querySelectorAll('.nn-hs-node:not(.revealed)').forEach(n=>{
                    const realIdx=[...gridEl.children].indexOf(n);
                    const d=nodes[realIdx];
                    (n as HTMLElement).classList.add('revealed');
                    n.innerHTML=`<span style="font-size:18px">${d.icon}</span>`;
                  });
                  collectBtn.style.display='';
                },300);
              }
            } else if(data.type==='multi'){
              node.classList.add('multi'); multi*=data.val;
              traceEl.textContent=`🌟 MULTIPLIER x${multi} ACTIVATED!`;
              const val=document.createElement('div'); val.className='nn-nval'; val.style.color='#ffd700'; val.textContent='x'+data.val;
              node.appendChild(val);
            } else {
              node.classList.add('credits'); total+=data.val*bet*multi;
              totalEl.textContent='$'+total.toFixed(2);
              traceEl.textContent=`✅ +$${(data.val*bet*multi).toFixed(2)} EXTRACTED`;
              const val=document.createElement('div'); val.className='nn-nval'; val.style.color='#00f5d4'; val.textContent='+$'+(data.val*bet*multi).toFixed(2);
              node.appendChild(val);
            }
            const allRev=[...gridEl.querySelectorAll('.nn-hs-node')].every(n=>n.classList.contains('revealed'));
            if(allRev||!active) collectBtn.style.display='';
          };
          gridEl.appendChild(node);
        });

        collectBtn.style.display='none';
      });
    }

    (window as any)._nnHsCollect = () => {
      document.getElementById('nn-bonus-cyber')!.classList.remove('open');
      if(_hsResolve){
        const v=parseFloat(document.getElementById('nn-hs-total')?.textContent?.replace('$','')||'0')||0;
        _hsResolve(Math.max(v,C.bet));
        _hsResolve=null;
      }
    };

    async function spinCyber(){
      if(C.busy)return;
      const fr=C.fs>0;
      if(!fr&&C.bal<C.bet){toast('Недостаточно средств!');return;}
      C.busy=true;
      const spinBtn=document.getElementById('nn-cspin') as HTMLButtonElement;
      spinBtn.disabled=true;
      document.getElementById('nn-cw')!.textContent='—';
      document.getElementById('nn-ci')!.textContent='';
      if(!fr){C.bal-=C.bet;}else{C.fs--;}
      uC();

      // Fetch RTP from server
      let rtpFactor = 0.45;
      try {
        const s = await fetch('/api/admin/settings').then(r=>r.json()).catch(()=>null);
        if(s?.neonNightsRtpPercent) rtpFactor = s.neonNightsRtpPercent / 100;
      } catch(e){}

      // Decrement stickies
      Object.keys(C.sticky).forEach(k=>{C.sticky[k]--;if(C.sticky[k]<=0)delete C.sticky[k];});

      // RTP-biased pick
      const pickBiased = () => {
        if(Math.random() < rtpFactor * 0.5) {
          const highVal = CSYMS.filter(s => s.v >= 4);
          if(highVal.length) return pick(highVal);
        }
        return pick(CSYMS);
      };

      C.reels.forEach(r=>r.start());
      const res=C.reels.map(()=>Array.from({length:4},()=>Math.random()<rtpFactor*0.8?pickBiased():pick(CSYMS)));
      for(let c=0;c<5;c++){await sleep(70+c*100); await C.reels[c].stop(res[c]);}

      // New sticky skulls
      for(let c=0;c<5;c++) for(let r=0;r<4;r++){
        if(res[c][r]==='skl'&&!C.sticky[`${c}_${r}`]){
          C.sticky[`${c}_${r}`]=3;
          C.reels[c].highlightRows([r],'#ff073a');
        }
      }

      try {
        await apiRequest("POST", "/api/bets", {
          gameType: "neonnights", amount: C.bet, isWin: false, payout: 0, multiplier: 1,
        });
      } catch(e){}

      let sc=0; res.flat().forEach(id=>{if(id==='bot')sc++;});
      if(sc>=3){
        C.fs+=8; uC();
        document.getElementById('nn-ci')!.textContent='🤖 SYSTEM BREACH! +8 FREE';
        (document.getElementById('nn-ci')! as HTMLElement).style.color='#00f5d4';
        flash('rgba(0,245,212,.1)'); await sleep(500);
      }
      const cBons=res.flat().filter(id=>id==='bon').length;
      if(cBons>=3){
        const bw=await hsBonus(C.bet);
        C.bal+=bw; document.getElementById('nn-cw')!.textContent='$'+bw.toFixed(2);
        uC(); flash('rgba(0,245,212,.2)');
        bigWin('💿 HACK','COMPLETE!','#00f5d4','#f72585',bw);
      }

      const g=cGrid(); const{tot,wc}=cPay(g);
      if(wc.length){
        for(let c=0;c<5;c++){
          const rows=wc.filter(k=>+k.split('_')[1]===c).map(k=>+k.split('_')[0]);
          if(rows.length)C.reels[c].highlightRows(rows,'#00f5d4');
        }
        await sleep(900); C.reels.forEach(r=>r.clearHighlight());
      }
      if(tot>0){
        C.bal+=tot; document.getElementById('nn-cw')!.textContent='$'+tot.toFixed(2);
        uC(); flash('rgba(0,245,212,.1)');
        if(tot>=C.bet*10) bigWin('SYSTEM','OVERLOAD','#00f5d4','#f72585',tot);
        else toast(`⚡ WIN $${tot.toFixed(2)}`,'rgba(0,5,20,.95)','#00f5d4');
      }
      C.busy=false; spinBtn.disabled=false;
      spinBtn.textContent=C.fs>0?`⚡ FREE [${C.fs}]`:'⚡  ENGAGE';
    }

    setTimeout(()=>{
      C.reels=makeGrid('nn-cs',5,4,CSYMS);
      makeBets('nn-cbets',C);
      document.getElementById('nn-cspin')!.onclick=spinCyber;
    },100);

    return () => {
      style.remove();
      delete (window as any)._nnHsCollect;
    };
  }, []);

  return (
    <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', flexDirection:'column', background:'#04000e' }}>
      <div style={{
        display:'flex', alignItems:'center', padding:'10px 14px',
        background:'rgba(0,0,0,.7)', borderBottom:'1px solid rgba(0,245,212,.15)',
        flexShrink:0, zIndex:10
      }}>
        <button onClick={onBack} style={{
          background:'none', border:'none', color:'#00f5d4', cursor:'pointer',
          display:'flex', alignItems:'center', gap:6, fontFamily:'Orbitron,monospace',
          fontSize:12, fontWeight:700, letterSpacing:1
        }}>
          <ArrowLeft size={18}/> BACK
        </button>
        <div style={{ flex:1, textAlign:'center', fontFamily:'Orbitron,monospace', fontWeight:900, fontSize:14, letterSpacing:2, color:'#00f5d4' }}>
          ⚡ NEON NIGHTS
        </div>
      </div>
      <div ref={containerRef} style={{ flex:1, minHeight:0, position:'relative' }} />
    </div>
  );
}
