import { useEffect, useRef } from "react";
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
      .fp-root{font-family:'Orbitron',monospace;color:#fff;display:flex;flex-direction:column;height:100%;background:radial-gradient(ellipse at 50% -10%,#193d0f 0%,#0a1f07 50%,#040c03 100%);overflow:hidden;}
      .fp-hud{display:flex;gap:6px;padding:5px 12px;flex-shrink:0}
      .fp-hbox{flex:1;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:4px 6px;text-align:center}
      .fp-hl{font-size:7px;letter-spacing:1.5px;color:rgba(255,255,255,.4);margin-bottom:2px}
      .fp-hv{font-size:13px;font-weight:700;line-height:1}
      .fp-cbar{display:flex;align-items:center;gap:6px;padding:2px 12px 4px;flex-shrink:0}
      .fp-cmul{font-size:12px;font-weight:700;color:#fb923c;min-width:30px}
      .fp-ctrack{flex:1;height:5px;background:rgba(255,255,255,.06);border-radius:10px;overflow:hidden}
      .fp-cfill{height:100%;width:0%;background:linear-gradient(90deg,#fb923c,#ef4444);border-radius:10px;transition:width .35s}
      .fp-ibar{font-size:11px;text-align:center;padding:2px 12px 3px;flex-shrink:0;min-height:18px;font-weight:700;letter-spacing:1px}
      .fp-reel-wrap{flex:1;display:flex;align-items:center;justify-content:center;padding:6px 10px;min-height:0;overflow:hidden}
      .fp-reel-frame{background:#0a0a10;border-radius:14px;padding:6px;border:2px solid rgba(255,255,255,.1);box-shadow:0 0 0 1px rgba(0,0,0,.8),inset 0 1px 0 rgba(255,255,255,.06),0 4px 30px rgba(0,0,0,.8)}
      .fp-reel-row{display:flex;gap:4px}
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
      /* Bonus overlay */
      .fp-bonus{display:none;position:fixed;inset:0;z-index:400;flex-direction:column;align-items:center;justify-content:flex-start;overflow-y:auto;background:radial-gradient(ellipse at 50% 0%,#1a4d00 0%,#061500 60%,#020900 100%)}
      .fp-bonus.open{display:flex}
      .fp-bonus-title{font-size:22px;font-weight:900;letter-spacing:2px;line-height:1;padding:14px 16px 4px;text-align:center;background:linear-gradient(135deg,#4ade80,#fbbf24);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
      .fp-bonus-sub{font-size:10px;letter-spacing:3px;margin-top:3px;opacity:.7;text-align:center;color:#4ade80}
      .fp-jf-lives{display:flex;gap:8px;justify-content:center;margin:6px 0}
      .fp-jf-life{width:28px;height:28px;border-radius:50%;background:#2d5a00;border:2px solid #4ade80;font-size:14px;display:flex;align-items:center;justify-content:center;transition:all .3s}
      .fp-jf-life.lost{background:#3d0000;border-color:#ef4444;filter:grayscale(1)}
      .fp-jf-total{font-size:26px;font-weight:900;font-family:'Orbitron',monospace;color:#4ade80;margin:2px 14px;min-height:36px}
      .fp-jf-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding:0 14px;width:100%;max-width:360px;margin-top:4px}
      .fp-jf-card{aspect-ratio:1;border-radius:12px;border:2px solid rgba(255,255,255,.15);background:linear-gradient(135deg,#1a3d00,#0d2000);cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:28px;transition:transform .15s,box-shadow .15s;position:relative;overflow:hidden}
      .fp-jf-card:active{transform:scale(.94)}
      .fp-jf-card.revealed{cursor:default;animation:fpCardFlip .35s ease}
      .fp-jf-card.prize{background:linear-gradient(135deg,#1a4d1a,#0d280d);border-color:#4ade80;box-shadow:0 0 15px rgba(74,222,128,.3)}
      .fp-jf-card.empty{background:linear-gradient(135deg,#4d1a00,#280d00);border-color:#ef4444;box-shadow:0 0 15px rgba(239,68,68,.3)}
      .fp-jf-card.jackpot{background:linear-gradient(135deg,#4d4400,#282200);border-color:gold;box-shadow:0 0 25px rgba(255,215,0,.5);animation:fpJackpot 1s ease infinite alternate}
      .fp-card-val{font-size:10px;font-weight:900;font-family:'Orbitron',monospace;text-align:center;padding:0 2px;color:#ccc}
      @keyframes fpCardFlip{0%{transform:rotateY(90deg);opacity:0}100%{transform:rotateY(0);opacity:1}}
      @keyframes fpJackpot{from{box-shadow:0 0 15px gold}to{box-shadow:0 0 40px gold,0 0 60px rgba(255,215,0,.4)}}
      .fp-collect{padding:12px 40px;border:none;border-radius:12px;font-size:14px;font-weight:900;font-family:'Orbitron',monospace;letter-spacing:1.5px;cursor:pointer;margin:10px 0 14px;background:linear-gradient(135deg,#4ade80,#16a34a);color:#000}
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

      <!-- Bonus overlay -->
      <div class="fp-bonus" id="fp-bonus-fruit">
        <div class="fp-bonus-title">🧃 JUICE FACTORY</div>
        <div class="fp-bonus-sub">PICK FRUITS · AVOID EMPTY SLOTS</div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 14px 0;width:100%">
          <div style="font-size:11px;color:rgba(255,255,255,.5)">LIVES</div>
          <div style="font-size:11px;color:rgba(255,255,255,.5)">WIN</div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:0 14px;width:100%">
          <div class="fp-jf-lives" id="fp-jf-lives"></div>
          <div class="fp-jf-total" id="fp-jf-total">$0.00</div>
        </div>
        <div class="fp-jf-grid" id="fp-jf-grid"></div>
        <button class="fp-collect" id="fp-jf-collect" style="display:none" onclick="window._fpJfCollect()">✅ COLLECT</button>
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

    function pick(syms: typeof GSYMS): string {
      let r=Math.random(),c=0;
      for(const s of syms){c+=s.w;if(r<c)return s.id;}
      return syms[syms.length-1].id;
    }
    function getsym(syms: typeof GSYMS, id: string) {
      return syms.find(s=>s.id===id)||syms[syms.length-1];
    }

    class Reel {
      syms: typeof GSYMS;
      rows: number;
      cW: number;
      cH: number;
      N: number;
      strip: number[];
      pos: number;
      vel: number;
      spinning: boolean;
      raf_: number | null;
      result: string[];
      cvs: HTMLCanvasElement;
      ctx: CanvasRenderingContext2D;
      _cache: HTMLCanvasElement[];
      _winClr: string | null;

      constructor(container: HTMLElement, syms: typeof GSYMS, rows: number, cellW: number, cellH: number) {
        this.syms=syms; this.rows=rows; this.cW=cellW; this.cH=cellH;
        this.N=40;
        this.strip=Array.from({length:this.N},()=>this._ridx());
        this.pos=0; this.vel=0; this.spinning=false; this.raf_=null;
        this.result=[]; this._winClr=null;
        const c=document.createElement('canvas');
        c.style.display='block'; c.style.borderRadius='6px';
        c.style.width=cellW+'px'; c.style.height=(rows*cellH)+'px';
        c.width=Math.round(cellW*DPR); c.height=Math.round(rows*cellH*DPR);
        container.appendChild(c);
        this.cvs=c; this.ctx=c.getContext('2d')!;
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
        if(sym.lbl==='WILD') {
          const wg=cx.createLinearGradient(0,0,w,0);
          wg.addColorStop(0,'#ffd700'); wg.addColorStop(.5,'#fff'); wg.addColorStop(1,'#ffd700');
          cx.font=`${Math.floor(h*.42)}px serif`;
          cx.shadowColor=sym.glow; cx.shadowBlur=h*.3;
          cx.fillStyle='#fff'; cx.textAlign='center'; cx.textBaseline='middle';
          cx.fillText(sym.icon,w/2,h*.44);
          cx.shadowBlur=0; cx.fillStyle=wg;
          cx.font=`900 ${Math.floor(h*.18)}px Orbitron,monospace`;
          cx.fillText('WILD',w/2,h*.78);
        } else if(sym.lbl==='BONUS') {
          cx.font=`${Math.floor(h*.42)}px serif`;
          cx.fillStyle='#fff'; cx.textAlign='center'; cx.textBaseline='middle';
          cx.fillText(sym.icon,w/2,h*.44);
          cx.shadowBlur=0; cx.fillStyle='#4ade80';
          cx.font=`900 ${Math.floor(h*.16)}px Orbitron,monospace`;
          cx.fillText('BONUS',w/2,h*.8);
        } else if(sym.lbl==='★') {
          cx.font=`${Math.floor(h*.52)}px serif`;
          cx.fillStyle='#fff'; cx.textAlign='center'; cx.textBaseline='middle';
          cx.fillText(sym.icon,w/2,h*.52);
        } else {
          cx.font=`${Math.floor(h*.52)}px serif`;
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
            const e=ease(t);
            this.pos=((startPos+dist*Math.min(e,1.03))%sH+sH)%sH;
            this._draw();
            if(t<1){requestAnimationFrame(frame);}
            else{this.pos=snapPos;this.result=resultIds;this._draw();resolve();}
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

      highlightRows(rows: number[], clr='#ffd700') {
        this._winClr=clr; this._draw(rows);
      }
      clearHighlight() { this._winClr=null; this._draw(); }
    }

    // Grid builder
    function makeGrid(stageId: string, cols: number, rows: number, syms: typeof GSYMS): Reel[] {
      const stage=document.getElementById(stageId)!;
      stage.innerHTML='';
      // Compute cell size from WIDTH only (clientHeight unreliable in flex layouts)
      const sw = Math.min(window.innerWidth, stage.clientWidth||window.innerWidth) - 24;
      const byCols = Math.floor((sw - (cols-1)*4) / cols);
      // Max from height: reserve 230px for chrome (nav+hud+cbar+ibar+controls)
      const maxH = Math.floor((window.innerHeight - 230 - (rows-1)*4) / rows);
      const px = Math.min(byCols, maxH, 46);
      const frame=document.createElement('div'); frame.className='fp-reel-frame';
      const row=document.createElement('div'); row.className='fp-reel-row';
      const reels:Reel[]=[];
      for(let c=0;c<cols;c++){
        const col=document.createElement('div'); col.className='fp-rcol';
        row.appendChild(col); reels.push(new Reel(col,syms,rows,px,px));
      }
      frame.appendChild(row); stage.appendChild(frame); return reels;
    }

    // UI helpers
    let _tt: ReturnType<typeof setTimeout>|null=null;
    function toast(msg:string,bg='rgba(10,30,10,.95)',clr='#4ade80') {
      const t=document.getElementById('fp-toast')!;
      t.textContent=msg; t.style.background=bg; t.style.color=clr;
      t.classList.add('on');
      if(_tt)clearTimeout(_tt);
      _tt=setTimeout(()=>t.classList.remove('on'),2600);
    }
    function flash(clr='rgba(255,255,100,.12)'){
      const f=document.getElementById('fp-flash')!;
      f.style.background=clr; f.classList.remove('go');
      void (f as HTMLElement).offsetWidth; f.classList.add('go');
    }
    function bigWin(l1:string,l2:string,c1:string,c2:string,amt:number){
      document.getElementById('fp-bwl1')!.textContent=l1;
      (document.getElementById('fp-bwl1')! as HTMLElement).style.cssText=`color:${c1};text-shadow:0 0 40px ${c1},0 0 80px ${c2}`;
      document.getElementById('fp-bwl2')!.textContent=l2;
      (document.getElementById('fp-bwl2')! as HTMLElement).style.cssText=`color:${c2};text-shadow:0 0 30px ${c2}`;
      document.getElementById('fp-bwamt')!.textContent='$'+amt.toFixed(2);
      document.getElementById('fp-bwin')!.classList.add('show');
    }

    function makeBets(id:string, state:{bet:number}) {
      const row=document.getElementById(id)!;
      row.innerHTML='';
      BETS.forEach(b=>{
        const btn=document.createElement('button');
        btn.className='fp-chip';
        btn.textContent=b<1?('.'+String(Math.round(b*100)).padStart(2,'0')):'$'+b;
        if(b===state.bet)btn.classList.add('on');
        btn.onclick=()=>{
          state.bet=b;
          row.querySelectorAll('.fp-chip').forEach((x:Element)=>x.classList.remove('on'));
          btn.classList.add('on');
        };
        row.appendChild(btn);
      });
    }

    // Game state
    const G={bal:balanceRef.current, bet:1, fs:0, busy:false, reels:[] as Reel[]};

    function uG() {
      document.getElementById('fp-gb')!.textContent='$'+G.bal.toFixed(2);
      if(G.fs>0){
        document.getElementById('fp-gfb')!.style.display='';
        document.getElementById('fp-gf')!.textContent=String(G.fs);
      } else {
        document.getElementById('fp-gfb')!.style.display='none';
      }
      onBalanceChange(G.bal);
    }

    // BFS cluster logic
    function gBfs(grid:string[][],r:number,c:number):string[] {
      const id=grid[r][c]; if(!id||id==='sct')return[];
      const vis=new Set([`${r},${c}`]),q=[`${r},${c}`];
      while(q.length){
        const[cr,cc]=q.shift()!.split(',').map(Number);
        for(const[dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]){
          const nr=cr+dr,nc=cc+dc,k=`${nr},${nc}`;
          if(nr<0||nr>=7||nc<0||nc>=7||vis.has(k))continue;
          const ni=grid[nr][nc];
          if(ni===id||ni==='wld'){vis.add(k);q.push(k);}
        }
      }
      return vis.size>=5?[...vis]:[];
    }

    function gClusters(grid:string[][]){
      const vis=new Set<string>(),out:Array<{id:string,cells:string[]}>=[];
      for(let r=0;r<7;r++) for(let c=0;c<7;c++){
        const k=`${r},${c}`; if(vis.has(k))continue;
        const id=grid[r][c]; if(!id||id==='sct'||id==='wld'){vis.add(k);continue;}
        const cl=gBfs(grid,r,c); cl.forEach(x=>vis.add(x));
        if(cl.length)out.push({id,cells:cl});
      }
      return out;
    }

    function gGrid():string[][] {
      return Array.from({length:7},(_,r)=>Array.from({length:7},(_,c)=>G.reels[c].getVisible()[r]));
    }

    async function gCascade():Promise<number> {
      let g=gGrid(),win=0,multi=1,cnt=0;
      for(;;){
        const clusters=gClusters(g); if(!clusters.length)break;
        const boom=new Set<string>();
        clusters.forEach(({id,cells})=>{
          cells.forEach(k=>boom.add(k));
          win+=getsym(GSYMS,id).v*G.bet*cells.length*multi;
        });
        for(let c=0;c<7;c++){
          const rows=[...boom].filter(k=>+k.split(',')[1]===c).map(k=>+k.split(',')[0]);
          if(rows.length)G.reels[c].highlightRows(rows,'#ffd700');
        }
        await sleep(340);
        G.reels.forEach(r=>r.clearHighlight());
        for(let c=0;c<7;c++){
          const survivors=g.map((row,r)=>boom.has(`${r},${c}`)?null:row[c]).filter((v):v is string=>!!v);
          while(survivors.length<7)survivors.unshift(pick(GSYMS));
          G.reels[c].strip.splice(0,survivors.length,...survivors.map(id=>GSYMS.findIndex(s=>s.id===id)));
          G.reels[c].pos=0; G.reels[c].result=survivors;
          G.reels[c].stop(survivors).catch(()=>{});
        }
        cnt++; multi=Math.min(multi*2,32);
        document.getElementById('fp-gm')!.textContent=String(multi);
        document.getElementById('fp-gj')!.style.width=Math.min(cnt/5*100,100)+'%';
        await sleep(540);
        g=gGrid();
      }
      return win;
    }

    // Bonus: Juice Factory
    const JF_PRIZES = [
      {type:'prize',icon:'💰',val:3,w:.16},{type:'prize',icon:'💰',val:5,w:.13},
      {type:'prize',icon:'💰',val:8,w:.11},{type:'prize',icon:'💰',val:12,w:.09},
      {type:'prize',icon:'💰',val:20,w:.06},{type:'multi',icon:'⚡',val:2,w:.10},
      {type:'multi',icon:'⚡',val:3,w:.07},{type:'multi',icon:'⚡',val:5,w:.05},
      {type:'jackpot',icon:'🏆',val:50,w:.04},{type:'empty',icon:'💀',val:0,w:.19},
    ];
    function jfPick(){
      let r=Math.random(),c=0;
      for(const p of JF_PRIZES){c+=p.w;if(r<c)return{...p};}
      return{...JF_PRIZES[JF_PRIZES.length-1]};
    }

    let _jfResolve: ((v:number)=>void)|null=null;

    function jfBonus(bet:number):Promise<number> {
      return new Promise(resolve=>{
        const overlay=document.getElementById('fp-bonus-fruit')!;
        overlay.classList.add('open');
        const livesEl=document.getElementById('fp-jf-lives')!;
        const totalEl=document.getElementById('fp-jf-total')!;
        const gridEl=document.getElementById('fp-jf-grid')!;
        const collectBtn=document.getElementById('fp-jf-collect')!;
        _jfResolve=resolve;

        let lives=3,total=0,multi=1,active=true;
        const cards=Array.from({length:16},jfPick);
        let prizeCount=cards.filter(c=>c.type==='prize').length;
        for(let i=0;prizeCount<3&&i<cards.length;i++){
          if(cards[i].type==='empty'){cards[i]={type:'prize',icon:'💰',val:3,w:0};prizeCount++;}
        }

        livesEl.innerHTML='';
        for(let i=0;i<3;i++){
          const d=document.createElement('div');
          d.className='fp-jf-life'; d.textContent='🍊';
          livesEl.appendChild(d);
        }

        gridEl.innerHTML='';
        cards.forEach((_,i)=>{
          const card=document.createElement('div');
          card.className='fp-jf-card';
          card.innerHTML='<span style="font-size:32px">❓</span>';
          card.onclick=()=>{
            if(!active||card.classList.contains('revealed'))return;
            const data=cards[i];
            card.classList.add('revealed');
            card.innerHTML='';
            const ico=document.createElement('span');
            ico.style.fontSize='30px'; ico.textContent=data.icon;
            card.appendChild(ico);

            if(data.type==='jackpot'){
              card.classList.add('jackpot');
              total+=data.val*bet*multi;
              totalEl.textContent='$'+total.toFixed(2);
              const val=document.createElement('div');
              val.className='fp-card-val'; val.style.color='gold';
              val.textContent='JACKPOT! +$'+(data.val*bet*multi).toFixed(2);
              card.appendChild(val);
            } else if(data.type==='multi'){
              card.classList.add('prize');
              multi*=data.val;
              const val=document.createElement('div');
              val.className='fp-card-val'; val.style.color='#fbbf24';
              val.textContent='x'+data.val+' MULT!';
              card.appendChild(val);
            } else if(data.type==='prize'){
              card.classList.add('prize');
              total+=data.val*bet*multi;
              totalEl.textContent='$'+total.toFixed(2);
              const val=document.createElement('div');
              val.className='fp-card-val';
              val.textContent='+$'+(data.val*bet*multi).toFixed(2);
              card.appendChild(val);
            } else {
              // empty
              card.classList.add('empty');
              lives--;
              const lifeEls=livesEl.querySelectorAll('.fp-jf-life');
              if(lifeEls[3-lives]) lifeEls[3-lives].classList.add('lost');
              const val=document.createElement('div');
              val.className='fp-card-val'; val.style.color='#ef4444';
              val.textContent='EMPTY!';
              card.appendChild(val);
              if(lives<=0){
                active=false;
                // reveal all remaining
                setTimeout(()=>{
                  gridEl.querySelectorAll('.fp-jf-card:not(.revealed)').forEach((c,idx)=>{
                    const realIdx=[...gridEl.children].indexOf(c);
                    const d=cards[realIdx];
                    (c as HTMLElement).classList.add('revealed');
                    c.innerHTML=`<span style="font-size:28px">${d.icon}</span>`;
                  });
                  collectBtn.style.display='';
                },300);
              }
            }
            // check all revealed
            const allRevealed=[...gridEl.querySelectorAll('.fp-jf-card')].every(c=>c.classList.contains('revealed'));
            if(allRevealed||!active) collectBtn.style.display='';
          };
          gridEl.appendChild(card);
        });

        collectBtn.style.display='none';
      });
    }

    (window as any)._fpJfCollect = () => {
      document.getElementById('fp-bonus-fruit')!.classList.remove('open');
      if(_jfResolve){
        const totalEl=document.getElementById('fp-jf-total')!;
        const v=parseFloat(totalEl.textContent?.replace('$',''))||0;
        _jfResolve(Math.max(v,G.bet));
        _jfResolve=null;
      }
    };

    // Main spin
    async function spinFruit() {
      if(G.busy)return;
      const fr=G.fs>0;
      if(!fr&&G.bal<G.bet){toast('Недостаточно средств!');return;}
      G.busy=true;
      const spinBtn=document.getElementById('fp-gspin') as HTMLButtonElement;
      spinBtn.disabled=true;
      document.getElementById('fp-gw')!.textContent='—';
      document.getElementById('fp-gi')!.textContent='';
      document.getElementById('fp-gm')!.textContent='1';
      document.getElementById('fp-gj')!.style.width='0%';
      if(!fr){G.bal-=G.bet;}else{G.fs--;}
      uG();

      // Fetch RTP from server
      let rtpFactor = 0.45;
      try {
        const s = await fetch('/api/admin/settings').then(r=>r.json()).catch(()=>null);
        if(s?.fruitPartyRtpPercent) rtpFactor = s.fruitPartyRtpPercent / 100;
      } catch(e){}

      // RTP-biased symbol pick: if random < rtp, use higher-value symbols
      const pickBiased = () => {
        if(Math.random() < rtpFactor * 0.6) {
          // Bias toward higher value symbols
          const highVal = GSYMS.filter(s => s.v > 0.4);
          if(highVal.length) return pick(highVal);
        }
        return pick(GSYMS);
      };

      G.reels.forEach(r=>r.start());
      const res=G.reels.map(()=>Array.from({length:7},()=>Math.random()<rtpFactor?pickBiased():pick(GSYMS)));
      for(let c=0;c<7;c++){await sleep(80+c*90); await G.reels[c].stop(res[c]);}

      // Record bet on server
      try {
        await apiRequest("POST", "/api/bets", {
          gameType: "fruitparty",
          amount: G.bet,
          isWin: false,
          payout: 0,
          multiplier: 1,
        });
      } catch(e){}

      const scats=res.flat().filter(id=>id==='sct').length;
      if(scats>=4){
        G.fs+=10; uG();
        document.getElementById('fp-gi')!.textContent='⭐ +10 FREE SPINS!';
        (document.getElementById('fp-gi')! as HTMLElement).style.color='gold';
        flash('rgba(255,215,0,.2)'); await sleep(600);
      }
      const gBons=res.flat().filter(id=>id==='bon').length;
      if(gBons>=3){
        const bw=await jfBonus(G.bet);
        G.bal+=bw;
        document.getElementById('fp-gw')!.textContent='$'+bw.toFixed(2);
        uG(); flash('rgba(74,222,128,.2)');
        bigWin('🧃 JUICE','FACTORY!','#4ade80','#fbbf24',bw);
      }

      const w=await gCascade();
      if(w>0){
        G.bal+=w;
        document.getElementById('fp-gw')!.textContent='$'+w.toFixed(2);
        uG(); flash('rgba(100,255,100,.12)');
        if(w>=G.bet*8) bigWin('🍒 BIG WIN','!','#ff6b9d','#ffd700',w);
        else toast(`🍒 WIN $${w.toFixed(2)}`,'rgba(5,25,5,.95)','#4ade80');
      }
      G.busy=false; spinBtn.disabled=false;
      spinBtn.textContent=G.fs>0?`🎁 FREE SPIN (${G.fs})`:'🍒  SPIN';
    }

    // Init
    setTimeout(()=>{
      G.reels=makeGrid('fp-gs',7,7,GSYMS);
      makeBets('fp-gbets',G);
      document.getElementById('fp-gspin')!.onclick=spinFruit;
    },100);

    return () => {
      style.remove();
      delete (window as any)._fpJfCollect;
    };
  }, []);

  return (
    <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', flexDirection:'column', background:'#040c03' }}>
      {/* Header */}
      <div style={{
        display:'flex', alignItems:'center', padding:'10px 14px',
        background:'rgba(0,0,0,.5)', borderBottom:'1px solid rgba(255,255,255,.08)',
        flexShrink:0, zIndex:10
      }}>
        <button onClick={onBack} style={{
          background:'none', border:'none', color:'#fff', cursor:'pointer',
          display:'flex', alignItems:'center', gap:6, fontFamily:'Orbitron,monospace',
          fontSize:12, fontWeight:700, letterSpacing:1
        }}>
          <ArrowLeft size={18}/> BACK
        </button>
        <div style={{ flex:1, textAlign:'center', fontFamily:'Orbitron,monospace', fontWeight:900, fontSize:14, letterSpacing:2, color:'#f97316' }}>
          🍒 FRUIT PARTY
        </div>
      </div>
      <div ref={containerRef} style={{ flex:1, minHeight:0, position:'relative' }} />
    </div>
  );
}
