import { useEffect, useRef } from "react";
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
      .cl-root{font-family:'Orbitron',monospace;color:#fff;display:flex;flex-direction:column;height:100%;background:radial-gradient(ellipse at 50% -10%,#5a0a5a 0%,#2a0535 50%,#100218 100%);overflow:hidden;}
      .cl-hud{display:flex;gap:6px;padding:5px 12px;flex-shrink:0}
      .cl-hbox{flex:1;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:4px 6px;text-align:center}
      .cl-hl{font-size:7px;letter-spacing:1.5px;color:rgba(255,255,255,.4);margin-bottom:2px}
      .cl-hv{font-size:13px;font-weight:700;line-height:1}
      .cl-ibar{font-size:11px;text-align:center;padding:2px 12px 3px;flex-shrink:0;min-height:18px;font-weight:700;letter-spacing:1px}
      .cl-reel-wrap{flex:1;display:flex;align-items:center;justify-content:center;padding:6px 10px;min-height:0;overflow:hidden}
      .cl-reel-frame{background:#0a0a10;border-radius:14px;padding:6px;border:2px solid rgba(244,114,182,.2);box-shadow:0 0 0 1px rgba(0,0,0,.8),inset 0 1px 0 rgba(244,114,182,.08),0 4px 30px rgba(0,0,0,.8)}
      .cl-reel-row{display:flex;gap:4px}
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
      .cl-cw-result-item{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);border-radius:8px;padding:6px 12px;display:flex;justify-content:space-between;align-items:center;font-size:11px;animation:clCardFlip .25s ease}
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

      <!-- Candy Wheel Bonus -->
      <div class="cl-bonus" id="cl-bonus-candy">
        <div style="width:100%;text-align:center;padding:12px 16px 4px">
          <div style="font-size:22px;font-weight:900;letter-spacing:2px;color:#fff;text-shadow:0 0 20px #f472b6">🎡 CANDY WHEEL</div>
          <div style="font-size:10px;letter-spacing:3px;margin-top:3px;color:rgba(255,255,255,.6)">SPIN THE WHEEL · COLLECT MULTIPLIERS</div>
          <div style="margin-top:4px;font-size:11px;color:rgba(255,255,255,.5)">TOTAL WIN</div>
          <div class="cl-cw-total" id="cl-cw-total">$0.00</div>
        </div>
        <div class="cl-cw-wheel-wrap">
          <div class="cl-cw-pointer"></div>
          <canvas id="cl-cw-canvas" class="cl-cw-canvas" width="260" height="260"></canvas>
        </div>
        <div class="cl-cw-spins" id="cl-cw-spins"></div>
        <div class="cl-cw-results" id="cl-cw-results"></div>
        <button class="cl-cw-spin-btn" id="cl-cw-spin-btn" onclick="window._clCwSpin()">🎰 SPIN!</button>
        <button class="cl-collect" id="cl-cw-collect" style="display:none" onclick="window._clCwCollect()">🍭 COLLECT SWEETS!</button>
      </div>

      <div class="cl-flash" id="cl-flash"></div>
      <div class="cl-bigwin" id="cl-bwin">
        <div class="cl-bwc">
          <div class="cl-bwl1" id="cl-bwl1"></div>
          <div class="cl-bwl2" id="cl-bwl2"></div>
          <div class="cl-bwamt" id="cl-bwamt"></div>
        </div>
        <button class="cl-bwx" onclick="document.getElementById('cl-bwin').classList.remove('show')">COLLECT</button>
      </div>
      <div class="cl-toast" id="cl-toast"></div>
    `;

    const $ = (id: string) => document.getElementById(id);
    const DPR = window.devicePixelRatio || 1;
    const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

    const KSYMS = [
      {id:'wld',icon:'⭐',lbl:'WILD',glow:'#ffffff',b0:'#2a2a00',b1:'#151500',brd:'rgba(255,255,150,.4)',w:.038,v:0},
      {id:'tkt',icon:'🎫',lbl:'FREE',glow:'#ffd700',b0:'#2a1800',b1:'#1a0e00',brd:'rgba(255,200,0,.4)',w:.028,v:0},
      {id:'bon',icon:'🎰',lbl:'BONUS',glow:'#ff6eb4',b0:'#1f001f',b1:'#0f000f',brd:'rgba(255,110,180,.5)',w:.038,v:0},
      {id:'lol',icon:'🍭',lbl:'',glow:'#ff6eb4',b0:'#200010',b1:'#100008',brd:'rgba(255,100,180,.4)',w:.058,v:1.5},
      {id:'bea',icon:'🐻',lbl:'',glow:'#ffd93d',b0:'#201400',b1:'#100a00',brd:'rgba(255,200,50,.25)',w:.092,v:.80},
      {id:'hrt',icon:'💝',lbl:'',glow:'#ff4757',b0:'#200008',b1:'#100004',brd:'rgba(255,60,80,.3)',w:.118,v:.60},
      {id:'cup',icon:'🧁',lbl:'',glow:'#ff9ff3',b0:'#200020',b1:'#100010',brd:'rgba(255,150,255,.25)',w:.138,v:.50},
      {id:'cnd',icon:'🍬',lbl:'',glow:'#f368e0',b0:'#1e001e',b1:'#0f000f',brd:'rgba(243,104,224,.25)',w:.162,v:.40},
      {id:'cok',icon:'🍪',lbl:'',glow:'#feca57',b0:'#201800',b1:'#100c00',brd:'rgba(254,200,80,.25)',w:.182,v:.30},
      {id:'dnt',icon:'🍩',lbl:'',glow:'#ff9f43',b0:'#201000',b1:'#100800',brd:'rgba(255,160,60,.25)',w:.184,v:.20},
    ];
    const MVALS = [2,3,5,8,10,15,20,25,50,100];
    const BETS = [0.10,0.20,0.50,1,2,5,10,20];

    function pick(syms: typeof KSYMS): string {
      let r=Math.random(),c=0;
      for(const s of syms){c+=s.w;if(r<c)return s.id;}
      return syms[syms.length-1].id;
    }
    function getsym(syms: typeof KSYMS, id: string) {
      return syms.find(s=>s.id===id)||syms[syms.length-1];
    }

    class Reel {
      syms: typeof KSYMS; rows: number; cW: number; cH: number; N: number;
      strip: number[]; pos: number; vel: number; spinning: boolean;
      raf_: number|null; result: string[]; cvs: HTMLCanvasElement;
      ctx: CanvasRenderingContext2D; _cache: HTMLCanvasElement[]; _winClr: string|null;

      constructor(container: HTMLElement, syms: typeof KSYMS, rows: number, cellW: number, cellH: number) {
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
        if(sym.lbl==='WILD'||sym.lbl==='FREE'||sym.lbl==='BONUS'){
          cx.font=`${Math.floor(h*.42)}px serif`; cx.fillStyle='#fff';
          cx.textAlign='center'; cx.textBaseline='middle'; cx.fillText(sym.icon,w/2,h*.44);
          cx.shadowBlur=0;
          const lclr=sym.lbl==='WILD'?'#ffd700':sym.lbl==='FREE'?'gold':'#f472b6';
          cx.fillStyle=lclr; cx.font=`900 ${Math.floor(h*.17)}px Orbitron,monospace`;
          cx.fillText(sym.lbl,w/2,h*.78);
        } else {
          cx.font=`${Math.floor(h*.52)}px serif`; cx.fillStyle='#fff';
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

    function makeGrid(stageId:string,cols:number,rows:number,syms:typeof KSYMS):Reel[]{
      const stage=document.getElementById(stageId)!; stage.innerHTML='';
      const sw = Math.min(window.innerWidth, stage.clientWidth||window.innerWidth) - 24;
      const byCols = Math.floor((sw - (cols-1)*4) / cols);
      const maxH = Math.floor((window.innerHeight - 225 - (rows-1)*4) / rows);
      const px = Math.min(byCols, maxH, 52);
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
      for(let r=0;r<5;r++) for(let c=0;c<6;c++){
        const k=`${r},${c}`; if(vis.has(k))continue;
        const id=grid[r][c]; if(!id||id==='tkt'||id==='wld'){vis.add(k);continue;}
        const cl=kBfs(grid,r,c); cl.forEach(x=>vis.add(x));
        if(cl.length)out.push({id,cells:cl});
      }
      return out;
    }

    function attachMul(reels:Reel[]){
      K.mmap={};
      reels.forEach((reel,c)=>{
        const vis=reel.getVisible();
        vis.forEach((id,r)=>{
          if(id==='lol'){
            const m=MVALS[Math.floor(Math.random()*5)]; K.mmap[`${r}_${c}`]=m;
            const ctx=reel.ctx,cH=reel.cH,cW=reel.cW;
            ctx.save();
            ctx.fillStyle='#ff073a'; ctx.beginPath();
            ctx.roundRect?ctx.roundRect(cW-20,r*cH+1,19,14,4):ctx.rect(cW-20,r*cH+1,19,14);
            ctx.fill();
            ctx.fillStyle='#fff'; ctx.font=`700 9px Orbitron,monospace`;
            ctx.textAlign='center'; ctx.textBaseline='middle';
            ctx.fillText('x'+m,cW-10.5,r*cH+8); ctx.restore();
          }
        });
      });
    }

    async function kCascade():Promise<number>{
      let g=kGrid(),win=0,cnt=0;
      for(;;){
        const clusters=kClusters(g); if(!clusters.length)break;
        const boom=new Set<string>(); let cMul=1;
        clusters.forEach(({id,cells})=>{
          cells.forEach(k=>boom.add(k));
          win+=getsym(KSYMS,id).v*K.bet*cells.length;
          cells.forEach(k=>{const[r,c]=k.split(',').map(Number);const m=K.mmap[`${r}_${c}`];if(m)cMul*=m;});
        });
        if(cMul>1){
          win*=cMul; K.totalMul*=cMul;
          document.getElementById('cl-ki')!.textContent=`✨ MULTIPLIER x${K.totalMul}`;
          (document.getElementById('cl-ki')! as HTMLElement).style.color='gold';
        }
        for(let c=0;c<6;c++){
          const rows=[...boom].filter(k=>+k.split(',')[1]===c).map(k=>+k.split(',')[0]);
          if(rows.length)K.reels[c].highlightRows(rows,'#f472b6');
        }
        await sleep(340);
        K.reels.forEach(r=>r.clearHighlight());
        for(let c=0;c<6;c++){
          const surv=g.map((row,r)=>boom.has(`${r},${c}`)?null:row[c]).filter((v):v is string=>!!v);
          while(surv.length<5)surv.unshift(pick(KSYMS));
          K.reels[c].stop(surv).catch(()=>{});
        }
        cnt++; await sleep(540);
        attachMul(K.reels); g=kGrid();
      }
      return win;
    }

    // Candy Wheel bonus
    const CW_SEGS=[
      {label:'x2',val:2,type:'cash',color:'#f97316',txt:'#000'},
      {label:'x5',val:5,type:'cash',color:'#ec4899',txt:'#fff'},
      {label:'x10',val:10,type:'cash',color:'#a855f7',txt:'#fff'},
      {label:'+SPIN',val:0,type:'extra',color:'#fbbf24',txt:'#000'},
      {label:'x20',val:20,type:'cash',color:'#ef4444',txt:'#fff'},
      {label:'x3',val:3,type:'cash',color:'#f472b6',txt:'#000'},
      {label:'x15',val:15,type:'cash',color:'#8b5cf6',txt:'#fff'},
      {label:'SWEET!',val:50,type:'cash',color:'#ffd700',txt:'#000'},
    ];
    const CW_ARC=Math.PI*2/CW_SEGS.length;

    interface CwState {
      bet:number; angle:number; spinsLeft:number; maxSpins:number;
      total:number; spinning:boolean; lastSeg:number|undefined;
      resolve:((v:number)=>void)|null;
    }
    let _cw:CwState={bet:1,angle:0,spinsLeft:3,maxSpins:3,total:0,spinning:false,lastSeg:undefined,resolve:null};

    function cwDraw(angle:number){
      const cvs=document.getElementById('cl-cw-canvas') as HTMLCanvasElement;
      if(!cvs)return;
      const ctx=cvs.getContext('2d')!,W=cvs.width,H=cvs.height,cx=W/2,cy=H/2,R=W/2-4;
      ctx.clearRect(0,0,W,H);
      CW_SEGS.forEach((seg,i)=>{
        const a0=angle+i*CW_ARC-Math.PI/2,a1=a0+CW_ARC;
        ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,R,a0,a1); ctx.closePath();
        ctx.fillStyle=seg.color; ctx.fill();
        ctx.strokeStyle='rgba(0,0,0,.35)'; ctx.lineWidth=2; ctx.stroke();
        ctx.save(); ctx.translate(cx,cy); ctx.rotate(a0+CW_ARC/2);
        ctx.textAlign='right'; ctx.fillStyle=seg.txt;
        ctx.font=`900 ${seg.label.length>4?11:14}px Orbitron,monospace`;
        ctx.shadowColor='rgba(0,0,0,.6)'; ctx.shadowBlur=4;
        ctx.fillText(seg.label,R-10,5); ctx.restore();
      });
      ctx.beginPath(); ctx.arc(cx,cy,18,0,Math.PI*2);
      const hg=ctx.createRadialGradient(cx,cy,0,cx,cy,18);
      hg.addColorStop(0,'#fff'); hg.addColorStop(1,'#bbb');
      ctx.fillStyle=hg; ctx.fill();
      ctx.strokeStyle='rgba(0,0,0,.25)'; ctx.lineWidth=2; ctx.stroke();
      if(_cw.lastSeg!==undefined){
        ctx.beginPath(); ctx.strokeStyle='#fff'; ctx.lineWidth=3;
        ctx.shadowColor='#fff'; ctx.shadowBlur=12;
        const a0=angle+_cw.lastSeg*CW_ARC-Math.PI/2;
        ctx.arc(cx,cy,R-2,a0,a0+CW_ARC); ctx.stroke();
      }
    }

    function cwSpinAnim(from:number,to:number,ms:number):Promise<void>{
      return new Promise(res=>{
        let t0:number|null=null;
        const ease=(t:number)=>1-Math.pow(1-t,3.5);
        const dist=to-from;
        const tick=(ts:number)=>{
          if(!t0)t0=ts;
          const t=Math.min((ts-t0)/ms,1);
          cwDraw(from+dist*ease(t));
          if(t<1)requestAnimationFrame(tick);else{cwDraw(to);res();}
        };
        requestAnimationFrame(tick);
      });
    }

    function cwUpdateDots(){
      const el=document.getElementById('cl-cw-spins')!; el.innerHTML='';
      const used=_cw.maxSpins-_cw.spinsLeft;
      for(let i=0;i<_cw.maxSpins;i++){
        const d=document.createElement('div'); d.className='cl-cw-dot';
        if(i<used)d.classList.add('used');else d.classList.add('active');
        el.appendChild(d);
      }
    }

    function cwBonus(bet:number):Promise<number>{
      return new Promise(resolve=>{
        const overlay=document.getElementById('cl-bonus-candy')!;
        overlay.classList.add('open');
        _cw={bet,angle:0,spinsLeft:3,maxSpins:3,total:0,spinning:false,lastSeg:undefined,resolve};
        document.getElementById('cl-cw-total')!.textContent='$0.00';
        document.getElementById('cl-cw-results')!.innerHTML='';
        (document.getElementById('cl-cw-spin-btn')! as HTMLButtonElement).disabled=false;
        document.getElementById('cl-cw-spin-btn')!.style.display='';
        document.getElementById('cl-cw-collect')!.style.display='none';
        cwDraw(0); cwUpdateDots();
      });
    }

    async function cwSpin(){
      if(_cw.spinning||_cw.spinsLeft<=0)return;
      _cw.spinning=true;
      (document.getElementById('cl-cw-spin-btn')! as HTMLButtonElement).disabled=true;

      const segIdx=Math.floor(Math.random()*CW_SEGS.length);
      _cw.lastSeg=segIdx;
      const seg=CW_SEGS[segIdx];

      const spins=4+Math.floor(Math.random()*4);
      const segCenter=(segIdx+0.5)*CW_ARC;
      const target=_cw.angle+spins*Math.PI*2+(Math.PI*2-(_cw.angle%(Math.PI*2))-segCenter+Math.PI*2)%(Math.PI*2);

      await cwSpinAnim(_cw.angle,target,2000+spins*80);
      _cw.angle=target;
      _cw.spinsLeft--;

      let resultLabel='',resultColor=seg.color,earned=0;
      if(seg.type==='extra'){
        _cw.spinsLeft++; _cw.maxSpins++;
        resultLabel='🎁 +1 EXTRA SPIN!'; earned=0;
      } else {
        earned=seg.val*_cw.bet;
        _cw.total+=earned;
        resultLabel=`${seg.label}  →  +$${earned.toFixed(2)}`;
      }

      document.getElementById('cl-cw-total')!.textContent='$'+_cw.total.toFixed(2);

      const item=document.createElement('div'); item.className='cl-cw-result-item';
      item.innerHTML=`<span style="color:${resultColor};font-weight:900">${seg.label}</span>` +
        `<span style="color:#ccc">${resultLabel}</span>` +
        (earned>0?`<span style="color:#7fff00;font-weight:900">+$${earned.toFixed(2)}</span>`:`<span style="color:#fbbf24">🎁</span>`);
      document.getElementById('cl-cw-results')!.prepend(item);

      cwUpdateDots();
      _cw.spinning=false;

      if(_cw.spinsLeft>0){
        (document.getElementById('cl-cw-spin-btn')! as HTMLButtonElement).disabled=false;
      } else {
        document.getElementById('cl-cw-spin-btn')!.style.display='none';
        document.getElementById('cl-cw-collect')!.style.display='';
        flash('rgba(255,100,200,.25)');
      }
    }

    (window as any)._clCwSpin = cwSpin;
    (window as any)._clCwCollect = () => {
      document.getElementById('cl-bonus-candy')!.classList.remove('open');
      if(_cw.resolve){_cw.resolve(Math.max(_cw.total,_cw.bet));_cw.resolve=null;}
    };

    async function spinCandy(){
      if(K.busy)return;
      const fr=K.fs>0;
      if(!fr&&K.bal<K.bet){toast('Недостаточно средств!');return;}
      K.busy=true; K.totalMul=1;
      const spinBtn=document.getElementById('cl-kspin') as HTMLButtonElement;
      spinBtn.disabled=true;
      document.getElementById('cl-kw')!.textContent='—';
      document.getElementById('cl-ki')!.textContent='';
      if(!fr){K.bal-=K.bet;}else{K.fs--;}
      uK();

      // Fetch RTP from server
      let rtpFactor = 0.45;
      try {
        const s = await fetch('/api/admin/settings').then(r=>r.json()).catch(()=>null);
        if(s?.candyLandRtpPercent) rtpFactor = s.candyLandRtpPercent / 100;
      } catch(e){}

      // RTP-biased pick
      const pickBiased = () => {
        if(Math.random() < rtpFactor * 0.55) {
          const highVal = KSYMS.filter(s => s.v >= 0.5);
          if(highVal.length) return pick(highVal);
        }
        return pick(KSYMS);
      };

      K.reels.forEach(r=>r.start());
      const res=K.reels.map(()=>Array.from({length:5},()=>Math.random()<rtpFactor*0.7?pickBiased():pick(KSYMS)));
      for(let c=0;c<6;c++){await sleep(65+c*95); await K.reels[c].stop(res[c]);}

      attachMul(K.reels);

      try {
        await apiRequest("POST", "/api/bets", {
          gameType: "candyland", amount: K.bet, isWin: false, payout: 0, multiplier: 1,
        });
      } catch(e){}

      const sc=res.flat().filter(id=>id==='tkt').length;
      if(sc>=4){
        K.fs+=12; uK();
        document.getElementById('cl-ki')!.textContent='🎫 SUGAR RUSH +12 FREE!';
        (document.getElementById('cl-ki')! as HTMLElement).style.color='#ffd700';
        flash('rgba(255,100,200,.2)'); await sleep(700);
      }
      const kBons=res.flat().filter(id=>id==='bon').length;
      if(kBons>=3){
        const bw=await cwBonus(K.bet);
        K.bal+=bw;
        document.getElementById('cl-kw')!.textContent='$'+bw.toFixed(2);
        uK(); flash('rgba(244,114,182,.2)');
        bigWin('🎡 CANDY','JACKPOT!','#f472b6','#fbbf24',bw);
      }

      const w=await kCascade();
      if(w>0){
        K.bal+=w;
        document.getElementById('cl-kw')!.textContent='$'+w.toFixed(2);
        uK(); flash('rgba(255,200,100,.18)');
        if(w>=K.bet*8) bigWin('🍭 SWEET','JACKPOT!','#f472b6','#ffd93d',w);
        else toast(`🍭 WIN $${w.toFixed(2)}`,'rgba(20,0,18,.95)','#f472b6');
      }
      K.busy=false; spinBtn.disabled=false;
      spinBtn.textContent=K.fs>0?`🎁 FREE SPIN (${K.fs})`:'🍭  SPIN!';
    }

    setTimeout(()=>{
      K.reels=makeGrid('cl-ks',6,5,KSYMS);
      makeBets('cl-kbets',K);
      document.getElementById('cl-kspin')!.onclick=spinCandy;
    },100);

    return ()=>{
      style.remove();
      delete (window as any)._clCwSpin;
      delete (window as any)._clCwCollect;
    };
  }, []);

  return (
    <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', flexDirection:'column', background:'#100218' }}>
      <div style={{
        display:'flex', alignItems:'center', padding:'10px 14px',
        background:'rgba(0,0,0,.5)', borderBottom:'1px solid rgba(244,114,182,.15)',
        flexShrink:0, zIndex:10
      }}>
        <button onClick={onBack} style={{
          background:'none', border:'none', color:'#f472b6', cursor:'pointer',
          display:'flex', alignItems:'center', gap:6, fontFamily:'Orbitron,monospace',
          fontSize:12, fontWeight:700, letterSpacing:1
        }}>
          <ArrowLeft size={18}/> BACK
        </button>
        <div style={{ flex:1, textAlign:'center', fontFamily:'Orbitron,monospace', fontWeight:900, fontSize:14, letterSpacing:2, color:'#f472b6' }}>
          🍭 CANDY LAND
        </div>
      </div>
      <div ref={containerRef} style={{ flex:1, minHeight:0, position:'relative' }} />
    </div>
  );
}
