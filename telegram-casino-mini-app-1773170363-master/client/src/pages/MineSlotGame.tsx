import { useState, useRef, useEffect, useCallback } from "react";
import { useTelegram } from "@/components/TelegramProvider";
import { useToast } from "@/hooks/use-toast";
import { useAudio } from "@/components/AudioProvider";
import { Info, RotateCcw, Zap, X, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import enderEyeImg from "@assets/generated_images/ender_eye_scatter_symbol.png";
import {
  ToolByType, BlockByType,
  PetardTool, DynamiteTool, GoldPickaxeTool, DrillTool,
  WantedPoster, WhiskeyBarrel,
  TreasureChestClosed, TreasureChestOpen,
  CrackOverlay,
} from "./WildWestTextures";

interface MineSlotGameProps {
  balance: number;
  onBalanceChange: (newBalance: number) => void;
  onBack: () => void;
}
interface Block { type: number; durability: number; maxDurability: number; broken: boolean; }
interface ChestMultiplier { col: number; multiplier: number; }
interface Particle { id: number; x: number; y: number; vx: number; vy: number; color: string; size: number; life: number; }

const BLOCK_NAMES     = ["Песчаник","Известняк","Медь","Серебро","Золото","Рубин"];
const BLOCK_PAYOUTS   = [0.1, 0.2, 0.5, 1, 2, 5];
const BLOCK_DURABILITY= [1, 2, 3, 4, 5, 6];
const BLOCK_COLORS    = ["#E8CC80","#C8B890","#FF9944","#C0C8E0","#FFD700","#FF4488"];
const PICKAXE_NAMES   = ["Петарда","Динамит","Золотая кирка","Паровой бур"];
const PICKAXE_HITS    = [1, 2, 3, 5];
const BET_AMOUNTS     = [0.10,0.20,0.50,1.00,2.00,5.00,10.00,20.00,50.00,100.00];

// ── Tool: delegates to WildWestTextures
const PickaxeSVG = ({ type, size = 48 }: { type: number; size?: number }) => (
  <ToolByType type={type} size={size} />
);

// ── Block: uses Minecraft pixel-art texture + hit animation
const BLOCK_GLOW = ["#E8CC80","#C8B890","#FF9944","#C0C8E0","#FFD700","#FF4488"];
const BlockSVG = ({ type, durability, maxDurability, size=48, broken, isHit }: {
  type:number; durability:number; maxDurability:number; size?:number; broken?:boolean; isHit?:boolean;
}) => {
  if (broken) return <div style={{width:size,height:size}}/>;
  const dmg = 1 - durability / maxDurability;
  const crackStage = dmg === 0 ? 0 : dmg < 0.34 ? 1 : dmg < 0.67 ? 2 : 3;
  const glow = BLOCK_GLOW[type];
  return (
    <motion.div style={{width:size,height:size,position:"relative"}}
      animate={isHit ? {scale:[1,0.72,1.1,1],rotate:[0,-4,4,0],filter:["brightness(1)","brightness(2.5)","brightness(1.2)","brightness(1)"]} : {}}
      transition={{duration:0.22,ease:"easeOut"}}>
      <div style={{filter:`drop-shadow(0 0 ${isHit?7:1.5}px ${glow})`}}>
        <BlockByType type={type} size={size} crackStage={crackStage as 0|1|2|3} />
      </div>
    </motion.div>
  );
};

// ── Whiskey Barrel (replaces Spellbook)
const SpellbookSVG = ({ size=48 }: {size?:number}) => <WhiskeyBarrel size={size} />;

// ── Wanted Poster (replaces TNT/Scatter)
const TNTVG = ({ size=48 }: {size?:number}) => <WantedPoster size={size} />;

// ── Chest
const ChestSVG = ({ open, multiplier, size=44 }: { open:boolean; multiplier?:number; size?:number }) => (
  <motion.div animate={open ? {y:[0,-8,0],scale:[1,1.15,1]} : {}} transition={{duration:0.5,ease:"backOut"}}>
    <svg width={size} height={size*0.8} viewBox="0 0 32 26"
      style={{filter:open?"drop-shadow(0 0 10px #FFD700)":"drop-shadow(0 2px 4px #0006)"}}>
      <rect x="1" y="10" width="30" height="15" rx="2" fill={open?"#B8860B":"#6B3610"}/>
      <rect x="3" y="12" width="26" height="11" rx="1" fill={open?"#FFD700":"#8B4513"}/>
      <rect x="1" y="4" width="30" height="8" rx="2" fill={open?"#DAA520":"#5C2A0A"}/>
      <rect x="3" y="5" width="26" height="6" rx="1" fill={open?"#F0C030":"#7A3910"}/>
      <rect x="12" y="8" width="8" height="6" rx="2" fill={open?"#C0C0C0":"#808080"}/>
      <rect x="14" y="9" width="4" height="4" rx="1" fill={open?"#FFD700":"#696969"}/>
      {open&&<rect x="1" y="4" width="4" height="4" rx="1" fill="#B8860B"/>}
      {open&&<rect x="27" y="4" width="4" height="4" rx="1" fill="#B8860B"/>}
      {open&&multiplier&&<text x="16" y="20" textAnchor="middle" fontSize="7" fontWeight="900" fill="#000" fontFamily="'Arial Black',monospace">×{multiplier}</text>}
    </svg>
  </motion.div>
);

// ── Explosion overlay
const TNTExplosion = ({ x, y, onDone }: { x:number; y:number; onDone:()=>void }) => (
  <motion.div className="absolute pointer-events-none z-50"
    style={{left:x-55,top:y-55,width:110,height:110}}
    initial={{opacity:1,scale:0.2}}
    animate={{opacity:[1,1,0],scale:[0.2,1.8,2.2]}}
    transition={{duration:0.5,ease:"easeOut"}}
    onAnimationComplete={onDone}>
    <svg viewBox="0 0 110 110" width="110" height="110">
      <circle cx="55" cy="55" r="48" fill="#FF6600" opacity="0.7"/>
      <circle cx="55" cy="55" r="32" fill="#FFCC00" opacity="0.85"/>
      <circle cx="55" cy="55" r="16" fill="#FFFFFF" opacity="0.9"/>
      {[0,40,80,120,160,200,240,280,320].map(a=>(
        <polygon key={a} points="55,55 50,25 60,25" fill="#FF4400" opacity="0.55" transform={`rotate(${a},55,55)`}/>
      ))}
    </svg>
  </motion.div>
);

let particleId = 0;

export function MineSlotGame({ balance, onBalanceChange, onBack }: MineSlotGameProps) {
  const { user, hapticFeedback } = useTelegram();
  const { toast } = useToast();
  const { playSound, setCurrentGame } = useAudio();

  const [betIndex, setBetIndex]         = useState(3);
  const [isSpinning, setIsSpinning]     = useState(false);
  const [reelSpinning, setReelSpinning] = useState(false);
  const [lastWin, setLastWin]           = useState(0);
  const [showPaytable, setShowPaytable] = useState(false);
  const [showBonusBuy, setShowBonusBuy] = useState(false);
  const [freeSpins, setFreeSpins]       = useState(0);
  const [freeSpinWins, setFreeSpinWins] = useState(0);
  const [autoSpin, setAutoSpin]         = useState(false);
  const [extraChance, setExtraChance]   = useState(false);
  const [showBonusModal, setShowBonusModal]     = useState(false);
  const [pendingBonus, setPendingBonus]         = useState<{freeSpins:number;scatterCount:number}|null>(null);
  const [isFreeSpinAutoPlay, setIsFreeSpinAutoPlay] = useState(false);
  const [showTotalWinModal, setShowTotalWinModal]   = useState(false);
  const [finalTotalWin, setFinalTotalWin]   = useState(0);
  const [freeSpinBlockStats, setFreeSpinBlockStats] = useState<{[bt:number]:{count:number;payout:number}}>({});
  const [cumulativeMultiplier, setCumulativeMultiplier] = useState(1);
  const [screenShake, setScreenShake]   = useState(false);
  const [explosions, setExplosions]     = useState<{id:number;x:number;y:number}[]>([]);
  const [spellColumns, setSpellColumns] = useState<Set<number>>(new Set());
  const [particles, setParticles]       = useState<Particle[]>([]);

  const autoSpinRef     = useRef(false);
  const freeSpinAutoRef = useRef(false);
  const blockGridRef    = useRef<HTMLDivElement>(null);
  const animFrame       = useRef<number>(0);

  const [topReel, setTopReel] = useState<number[][]>([[7,7,7,7,7],[7,7,7,7,7],[7,7,7,7,7]]);
  const [blockGrid, setBlockGrid]           = useState<Block[][]>(() => initializeGrid());
  const [animatingHits, setAnimatingHits]   = useState<Set<string>>(new Set());
  const [chestMultipliers, setChestMultipliers] = useState<ChestMultiplier[]>([]);
  const [activeColumn, setActiveColumn]     = useState<number|null>(null);
  const [droppingPickaxes, setDroppingPickaxes] = useState<{col:number;row:number;type:number}[]>([]);
  const [winBreakdown, setWinBreakdown]     = useState<{col:number;amount:number}[]>([]);
  const persistentGridRef = useRef<Block[][]|null>(null);

  const bet       = BET_AMOUNTS[betIndex];
  const actualBet = extraChance ? bet*3 : bet;

  // Particle loop
  useEffect(()=>{
    const tick = () => {
      setParticles(prev=>prev
        .map(p=>({...p,x:p.x+p.vx,y:p.y+p.vy,vy:p.vy+0.28,life:p.life-0.04}))
        .filter(p=>p.life>0));
      animFrame.current = requestAnimationFrame(tick);
    };
    animFrame.current = requestAnimationFrame(tick);
    return ()=>cancelAnimationFrame(animFrame.current);
  },[]);

  function initializeGrid(): Block[][] {
    return Array.from({length:7},()=>Array.from({length:5},()=>{
      const r=Math.random();
      const t=r<0.25?0:r<0.5?1:r<0.7?2:r<0.85?3:r<0.95?4:5;
      return {type:t,durability:BLOCK_DURABILITY[t],maxDurability:BLOCK_DURABILITY[t],broken:false};
    }));
  }

  useEffect(()=>{ setCurrentGame("luxe"); return ()=>setCurrentGame("lobby"); },[setCurrentGame]);

  const doShake = useCallback(()=>{ setScreenShake(true); setTimeout(()=>setScreenShake(false),400); },[]);

  const addParticlesAt = useCallback((row:number,col:number,blockType:number)=>{
    const cellSize=44;
    const x=col*cellSize+cellSize/2, y=row*cellSize+cellSize/2;
    setParticles(prev=>[...prev,...Array.from({length:14},()=>({
      id:particleId++,x,y,
      vx:(Math.random()-0.5)*7,
      vy:-(Math.random()*6+2),
      color:BLOCK_COLORS[blockType],
      size:Math.random()*7+3,
      life:1
    }))]);
  },[]);

  const spin = useCallback(async(isBonusBuy=false)=>{
    if(isSpinning||!user?.id) return;
    const currentBet=freeSpins>0?0:(isBonusBuy?bet*100:actualBet);
    if(currentBet>balance){
      toast({title:"Недостаточно баланса",variant:"destructive"});
      setAutoSpin(false); autoSpinRef.current=false; return;
    }
    setIsSpinning(true); setReelSpinning(true);
    setLastWin(0); setAnimatingHits(new Set()); setChestMultipliers([]);
    setActiveColumn(null); setDroppingPickaxes([]); setWinBreakdown([]);
    setCumulativeMultiplier(1); setSpellColumns(new Set());
    hapticFeedback("medium"); playSound("luxeSpin");

    try {
      const response=await fetch("/api/games/minedrop/spin",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({odejs:user.id,bet,isFreeSpins:freeSpins>0,extraChance,isBonusBuy,game:"goldrush"})
      });
      if(!response.ok) throw new Error("Spin failed");
      const result=await response.json();

      // Phase 1: Reel stop col by col
      for(let col=0;col<5;col++){
        await new Promise(r=>setTimeout(r,220));
        playSound("luxeReelStop");
        setTopReel(prev=>{
          const n=prev.map(row=>[...row]);
          for(let row=0;row<3;row++) n[row][col]=result.topReel[row][col];
          return n;
        });
      }
      setReelSpinning(false);
      await new Promise(r=>setTimeout(r,350));

      // Detect spellbook columns
      const spellCols=new Set<number>();
      for(let col=0;col<5;col++) for(let row=0;row<3;row++) if(result.topReel[row][col]===4) spellCols.add(col);
      if(spellCols.size>0){
        setSpellColumns(spellCols);
        await new Promise(r=>setTimeout(r,600));
        setSpellColumns(new Set());
      }

      const blocksByColumn=new Map<number,{row:number;col:number;payout:number}[]>();
      for(const b of result.brokenBlocks){
        if(!blocksByColumn.has(b.col)) blocksByColumn.set(b.col,[]);
        blocksByColumn.get(b.col)!.push(b);
      }

      const columnWins:{col:number;amount:number}[]=[];
      let animGrid:Block[][]=blockGrid.map(r=>r.map(b=>({...b})));

      for(let col=0;col<5;col++){
        const pickaxes:number[]=[];
        let hasTnt=false, hasSpellbook=false;
        for(let row=0;row<3;row++){
          const s=result.topReel[row][col];
          if(s<=3) pickaxes.push(s);
          if(s===5) hasTnt=true;
          if(s===4) hasSpellbook=true;
        }
        if(pickaxes.length===0&&!hasTnt) continue;
        setActiveColumn(col);

        const colPayouts=blocksByColumn.get(col)||[];
        let payIdx=0, colTotal=0;

        if(hasTnt){
          hapticFeedback("heavy"); playSound("blockBreak"); doShake();
          let tgtRow=-1;
          for(let row=0;row<7;row++) if(!animGrid[row][col].broken){tgtRow=row;break;}
          if(tgtRow!==-1){
            const bombs=[`${tgtRow}-${col}`];
            if(col>0&&!animGrid[tgtRow][col-1].broken) bombs.push(`${tgtRow}-${col-1}`);
            if(col<4&&!animGrid[tgtRow][col+1].broken) bombs.push(`${tgtRow}-${col+1}`);
            setAnimatingHits(prev=>new Set([...Array.from(prev),...bombs]));
            const cellSize=44;
            const eid=Date.now();
            setExplosions(prev=>[...prev,{id:eid,x:col*cellSize+cellSize/2,y:tgtRow*cellSize+cellSize/2}]);
            await new Promise(r=>setTimeout(r,350));
            const tntBroke=(result.brokenBlocks||[]).filter((b:{row:number;col:number;payout:number})=>
              b.row===tgtRow&&(b.col===col||b.col===col-1||b.col===col+1)&&!animGrid[b.row][b.col].broken);
            for(const bb of tntBroke) if(animGrid[bb.row]?.[bb.col]){
              animGrid[bb.row][bb.col].broken=true; animGrid[bb.row][bb.col].durability=0;
              colTotal+=bb.payout||0; addParticlesAt(bb.row,bb.col,animGrid[bb.row][bb.col].type);
            }
            setBlockGrid(prev=>{
              const ng=prev.map(r=>r.map(b=>({...b})));
              for(const bb of tntBroke) if(ng[bb.row]?.[bb.col]){ng[bb.row][bb.col].broken=true;ng[bb.row][bb.col].durability=0;}
              return ng;
            });
            await new Promise(r=>setTimeout(r,250));
            setAnimatingHits(new Set());
            setExplosions(prev=>prev.filter(e=>e.id!==eid));
          }
        }

        const eff=hasSpellbook?pickaxes.map(()=>3):pickaxes;
        for(const pType of eff){
          const hits=PICKAXE_HITS[pType];
          for(let h=0;h<hits;h++){
            let tgtRow=-1;
            for(let row=0;row<7;row++) if(!animGrid[row][col].broken){tgtRow=row;break;}
            if(tgtRow===-1) break;
            setDroppingPickaxes([{col,row:tgtRow,type:pType}]);
            await new Promise(r=>setTimeout(r,110));
            hapticFeedback("light"); playSound("blockHit");
            setAnimatingHits(prev=>new Set([...Array.from(prev),`${tgtRow}-${col}`]));
            const blk=animGrid[tgtRow][col];
            blk.durability=Math.max(0,blk.durability-1);
            if(blk.durability===0){
              blk.broken=true; playSound("blockBreak");
              addParticlesAt(tgtRow,col,blk.type);
              if(payIdx<colPayouts.length){colTotal+=colPayouts[payIdx].payout||0;payIdx++;}
            }
            setBlockGrid(prev=>{const ng=prev.map(r=>r.map(b=>({...b})));ng[tgtRow][col]={...blk};return ng;});
            await new Promise(r=>setTimeout(r,170));
            setAnimatingHits(prev=>{const s=new Set(Array.from(prev));s.delete(`${tgtRow}-${col}`);return s;});
          }
        }

        if(colTotal>0) columnWins.push({col,amount:colTotal});
        setDroppingPickaxes([]);
        await new Promise(r=>setTimeout(r,110));
      }

      setActiveColumn(null);
      if(columnWins.length>0) setWinBreakdown(columnWins);

      if(result.chestMultipliers?.length>0){
        await new Promise(r=>setTimeout(r,400));
        setChestMultipliers(result.chestMultipliers);
        hapticFeedback("heavy");
        let cum=1; for(const c of result.chestMultipliers) cum*=c.multiplier;
        if(cum>1) setCumulativeMultiplier(cum);
        await new Promise(r=>setTimeout(r,700));
      }

      if(freeSpins>0||result.awardedFreeSpins>0){
        const safeGrid = (result.blockGrid && Array.isArray(result.blockGrid) && result.blockGrid.length > 0)
          ? result.blockGrid : (persistentGridRef.current || blockGrid);
        persistentGridRef.current=safeGrid; setBlockGrid(safeGrid);
      } else {
        persistentGridRef.current=null; setBlockGrid(result.nextBlockGrid||initializeGrid());
      }
      onBalanceChange(result.newBalance);

      if(freeSpins>0){
        const nw=freeSpinWins+result.totalWin;
        setFreeSpins(p=>p-1);
        if(result.totalWin>0) setFreeSpinWins(nw);
        if(result.brokenBlocks?.length>0){
          setFreeSpinBlockStats(p=>{
            const u={...p};
            for(const b of result.brokenBlocks){
              if(!u[b.blockType]) u[b.blockType]={count:0,payout:0};
              u[b.blockType].count++; u[b.blockType].payout+=b.payout||0;
            }
            return u;
          });
        }
        if(freeSpins===1&&!result.awardedFreeSpins){
          setTimeout(()=>{
            setBlockGrid(initializeGrid()); persistentGridRef.current=null;
            setIsFreeSpinAutoPlay(false); freeSpinAutoRef.current=false;
            if(nw>0){setFinalTotalWin(nw);setShowTotalWinModal(true);playSound("luxeBigWin");hapticFeedback("heavy");}
            else setFreeSpinBlockStats({});
            setFreeSpinWins(0);
          },800);
        }
      }

      if(result.awardedFreeSpins>0){
        setExtraChance(false);
        const safeGrid2 = (result.blockGrid && Array.isArray(result.blockGrid) && result.blockGrid.length > 0)
          ? result.blockGrid : (persistentGridRef.current || blockGrid);
        persistentGridRef.current=safeGrid2;
        setBlockGrid(safeGrid2);
        setPendingBonus({freeSpins:result.awardedFreeSpins,scatterCount:result.scatterCount});
        setShowBonusModal(true); playSound("luxeBonus"); hapticFeedback("heavy");
      }

      if(result.totalWin>0){
        setLastWin(result.totalWin); hapticFeedback("heavy"); playSound("luxeWin");
        if(result.totalWin>=bet*10) playSound("luxeBigWin");
      }

    } catch(e){ console.error(e); toast({title:"Ошибка спина",variant:"destructive"}); }
    finally { setIsSpinning(false); setReelSpinning(false); }
  },[isSpinning,user?.id,bet,balance,freeSpins,actualBet,extraChance,hapticFeedback,playSound,toast,onBalanceChange,freeSpinWins,blockGrid,doShake,addParticlesAt]);

  useEffect(()=>{autoSpinRef.current=autoSpin;},[autoSpin]);
  useEffect(()=>{
    if(autoSpinRef.current&&!isSpinning&&(freeSpins>0||balance>=actualBet)){
      const t=setTimeout(()=>{if(autoSpinRef.current)spin();},1200);
      return ()=>clearTimeout(t);
    }
  },[isSpinning,autoSpin,freeSpins,balance,actualBet,spin]);
  useEffect(()=>{freeSpinAutoRef.current=isFreeSpinAutoPlay;},[isFreeSpinAutoPlay]);
  useEffect(()=>{
    if(freeSpinAutoRef.current&&!isSpinning&&freeSpins>0&&!showBonusModal){
      const t=setTimeout(()=>{if(freeSpinAutoRef.current&&freeSpins>0)spin();},800);
      return ()=>clearTimeout(t);
    }
    if(freeSpinAutoRef.current&&freeSpins===0){setIsFreeSpinAutoPlay(false);freeSpinAutoRef.current=false;}
  },[isSpinning,freeSpins,showBonusModal,spin]);

  const startFreeSpinAutoPlay=useCallback(()=>{
    if(pendingBonus){
      setFreeSpins(pendingBonus.freeSpins); setFreeSpinWins(0); setFreeSpinBlockStats({});
      setPendingBonus(null); setShowBonusModal(false);
      setIsFreeSpinAutoPlay(true); freeSpinAutoRef.current=true;
    }
  },[pendingBonus]);

  const isColCleared=(col:number)=>blockGrid.every(row=>row[col].broken);

  const renderReelSymbol=(sym:number,sz=30)=>{
    if(sym<=3) return <PickaxeSVG type={sym} size={sz}/>;
    if(sym===4) return <SpellbookSVG size={sz}/>;
    if(sym===5) return <TNTVG size={sz}/>;
    if(sym===6) return <motion.div style={{width:sz,height:sz}}
      animate={{filter:["drop-shadow(0 0 4px #CC8800)","drop-shadow(0 0 14px #FF6600)","drop-shadow(0 0 4px #CC8800)"]}}
      transition={{duration:1.5,repeat:Infinity}}>
        <WantedPoster size={sz}/>
      </motion.div>;
    return <div style={{width:sz,height:sz}}/>;
  };

  return (
    <motion.div className="min-h-screen flex flex-col relative overflow-hidden select-none"
      style={{background:"linear-gradient(160deg,#1a0c04 0%,#0f0802 45%,#0a0604 100%)"}}
      animate={screenShake?{x:[0,-5,5,-4,4,-2,2,0],y:[0,-2,2,-1,1,0]}:{}}
      transition={{duration:0.4}}>

      {/* Dust particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_,i)=>(
          <motion.div key={i} className="absolute rounded-full"
            style={{width:i%5===0?2:1,height:i%5===0?2:1,left:`${(i*17+7)%100}%`,top:`${(i*11+3)%75}%`,background:"#AA8844"}}
            animate={{opacity:[0.05,0.3,0.05]}} transition={{duration:2+i%3,repeat:Infinity,delay:i*0.22}}/>
        ))}
      </div>

      {/* Free spins ambient */}
      {freeSpins>0&&(
        <motion.div className="absolute inset-0 pointer-events-none"
          style={{background:"radial-gradient(ellipse at 50% 0%,#FF440028,transparent 55%)"}}
          animate={{opacity:[0.4,1,0.4]}} transition={{duration:1.8,repeat:Infinity}}/>
      )}

      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-3 pt-3 pb-1">
          <motion.div className="text-lg font-black tracking-wide"
            style={{fontFamily:"'Arial Black',sans-serif",background:"linear-gradient(90deg,#FFD700,#FF8C00)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}
            animate={{filter:["drop-shadow(0 0 4px #FFD700)","drop-shadow(0 0 12px #FF8800)","drop-shadow(0 0 4px #FFD700)"]}}
            transition={{duration:2,repeat:Infinity}}>
            🤠 GOLD RUSH
          </motion.div>
          <button onClick={onBack} className="text-white/50 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors" data-testid="button-back">
            <X size={20}/>
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center gap-1.5 px-2 pb-1">

          {/* Free spins badge */}
          <AnimatePresence>
            {freeSpins>0&&(
              <motion.div initial={{scale:0,y:-15}} animate={{scale:1,y:0}} exit={{scale:0}}
                className="relative overflow-hidden rounded-full px-6 py-1 font-black text-sm"
                style={{background:"linear-gradient(90deg,#882200,#FF4400)",boxShadow:"0 0 20px #FF440080",fontFamily:"'Arial Black',sans-serif"}}>
                <motion.div className="absolute inset-0"
                  style={{background:"linear-gradient(90deg,transparent,#ffffff30,transparent)"}}
                  animate={{x:["-100%","200%"]}} transition={{duration:1.4,repeat:Infinity,ease:"linear"}}/>
                <span className="relative text-white">⚡ FREE SPINS: {freeSpins}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Cumulative mult */}
          <AnimatePresence>
            {cumulativeMultiplier>1&&(
              <motion.div initial={{scale:0}} animate={{scale:[0,1.3,1]}} exit={{scale:0}}
                transition={{type:"spring"}}
                className="rounded-full px-4 py-0.5 font-black text-sm text-white"
                style={{background:"linear-gradient(90deg,#FF6600,#FF2200)",boxShadow:"0 0 15px #FF440060",fontFamily:"'Arial Black',sans-serif"}}>
                🔥 ×{cumulativeMultiplier} TOTAL
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── REEL 5×3 ── */}
          <div className="rounded-xl overflow-hidden"
            style={{width:220,background:"linear-gradient(180deg,#0e0904,#180e06)",border:"2px solid #4A3010",boxShadow:"0 0 18px #2A1400,inset 0 0 10px #00000080"}}>
            <div className="h-1.5" style={{background:"linear-gradient(90deg,#3A1800,#AA6600,#3A1800)"}}/>
            <div className="grid grid-cols-5 gap-0.5 p-1">
              {topReel.map((row,ri)=>row.map((sym,ci)=>(
                <motion.div key={`${ri}-${ci}`}
                  style={{width:40,height:40,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:4,overflow:"hidden",
                    background:reelSpinning?"linear-gradient(180deg,#1a0e04,#120a02)":"linear-gradient(145deg,#1e1408,#0d0a04)",
                    border:"1px solid "+(reelSpinning?"#AA4400":"#4A3010")}}
                  animate={reelSpinning?{scaleY:[1,0.15,1,0.25,1],filter:["blur(0px)","blur(4px)","blur(0px)","blur(2px)","blur(0px)"]}:{}}
                  transition={{duration:0.28,delay:reelSpinning?0:ci*0.09+ri*0.03}}>
                  {reelSpinning
                    ? <div style={{filter:"blur(4px)",opacity:0.4}}>{renderReelSymbol(sym,26)}</div>
                    : <motion.div initial={{scale:0.4,opacity:0}} animate={{scale:1,opacity:1}} transition={{duration:0.18,delay:ci*0.09}}>
                        {renderReelSymbol(sym,28)}
                      </motion.div>
                  }
                </motion.div>
              )))}
            </div>
            <div className="h-1.5" style={{background:"linear-gradient(90deg,#3A1800,#AA6600,#3A1800)"}}/>
          </div>

          {/* ── BLOCK GRID 5×7 ── */}
          <div className="relative" ref={blockGridRef}>
            {/* Particles */}
            <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
              {particles.map(p=>(
                <div key={p.id} className="absolute rounded-full pointer-events-none"
                  style={{left:p.x,top:p.y,width:p.size,height:p.size,background:p.color,opacity:p.life,
                    transform:"translate(-50%,-50%)",boxShadow:`0 0 ${p.size*1.5}px ${p.color}`}}/>
              ))}
            </div>
            {/* Explosions */}
            {explosions.map(e=>(<TNTExplosion key={e.id} x={e.x} y={e.y} onDone={()=>setExplosions(p=>p.filter(x=>x.id!==e.id))}/>))}

            <div className="rounded-lg overflow-hidden"
              style={{border:"2px solid #4A3010",boxShadow:"0 0 16px #2A1000,inset 0 0 6px #00000050"}}>
              {blockGrid.map((row,ri)=>(
                <div key={ri} className="flex">
                  {row.map((block,ci)=>{
                    const isAC=activeColumn===ci;
                    const dropping=droppingPickaxes.find(p=>p.col===ci&&p.row===ri);
                    const isSpell=spellColumns.has(ci);
                    return (
                      <div key={ci} className="w-11 h-11 relative"
                        style={{outline:isAC?"2px solid #FFD700":"none",outlineOffset:"-2px",background:isAC?"#FFD70009":"transparent"}}>
                        {isSpell&&(
                          <motion.div className="absolute inset-0 z-30 rounded pointer-events-none"
                            initial={{opacity:0}} animate={{opacity:[0,0.9,0.5,0]}} transition={{duration:0.7}}
                            style={{background:"radial-gradient(circle,#FF8800,transparent)"}}/>
                        )}
                        <BlockSVG type={block.type} durability={block.durability} maxDurability={block.maxDurability}
                          broken={block.broken} isHit={animatingHits.has(`${ri}-${ci}`)} size={44}/>
                        {dropping&&(
                          <motion.div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
                            initial={{y:-55,opacity:0,scale:0.35,rotate:-22}}
                            animate={{y:0,opacity:1,scale:1.4,rotate:16}}
                            transition={{duration:0.17,ease:[0.2,1.2,0.3,1]}}>
                            <PickaxeSVG type={dropping.type} size={34}/>
                          </motion.div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* ── CHESTS ── */}
          <div className="flex gap-0">
            {[0,1,2,3,4].map(col=>{
              const chest=chestMultipliers.find(c=>c.col===col);
              const cleared=isColCleared(col);
              return (
                <div key={col} className="w-11 h-9 flex items-center justify-center relative">
                  {cleared&&chest&&(
                    <motion.div className="absolute -top-6 text-xs font-black text-yellow-300 pointer-events-none z-10"
                      initial={{y:0,opacity:1}} animate={{y:-18,opacity:0}} transition={{duration:0.9,delay:0.3}}>
                      ×{chest.multiplier}
                    </motion.div>
                  )}
                  <ChestSVG open={cleared&&!!chest} multiplier={chest?.multiplier} size={40}/>
                </div>
              );
            })}
          </div>

          {/* ── WIN ── */}
          <AnimatePresence>
            {lastWin>0&&(
              <motion.div initial={{scale:0,y:15,opacity:0}} animate={{scale:1,y:0,opacity:1}} exit={{scale:0,y:-8,opacity:0}}
                className="relative overflow-hidden rounded-2xl px-6 py-2"
                style={{background:"linear-gradient(135deg,#B8860B,#FFD700,#FFA500)",
                  boxShadow:"0 0 24px #FFD70070,0 4px 16px #00000080",border:"2px solid #FFE066"}}>
                <motion.div className="absolute inset-0"
                  style={{background:"linear-gradient(90deg,transparent,#ffffff40,transparent)"}}
                  animate={{x:["-100%","200%"]}} transition={{duration:0.9,repeat:3}}/>
                <div className="relative flex flex-col items-center">
                  <span className="text-2xl font-black text-white"
                    style={{fontFamily:"'Arial Black',sans-serif",textShadow:"0 2px 8px #0008"}}>
                    +${lastWin.toFixed(2)}
                  </span>
                  {winBreakdown.length>0&&(
                    <div className="flex gap-1 mt-0.5 flex-wrap justify-center">
                      {winBreakdown.map((w,i)=>(
                        <span key={i} className="text-xs bg-black/25 text-white px-1.5 py-0.5 rounded-full">#{w.col+1}:${w.amount.toFixed(2)}</span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── CONTROL PANEL ── */}
        <div className="px-2 pb-2">
          <div className="rounded-2xl overflow-hidden"
            style={{background:"linear-gradient(180deg,#0e0a06,#080604)",border:"2px solid #3A2200",boxShadow:"0 -4px 18px #00000060"}}>
            <div className="h-0.5" style={{background:"linear-gradient(90deg,#FF880040,#FFD70080,#FF880040)"}}/>

            <div className="flex items-center justify-center gap-2.5 p-3 pb-2">
              {/* Info */}
              <motion.button whileTap={{scale:0.88}} onClick={()=>setShowPaytable(true)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                style={{background:"linear-gradient(145deg,#1a2535,#0d1520)",border:"1px solid #2a3545"}}
                data-testid="button-paytable"><Info size={17}/></motion.button>

              {/* Bonus Buy */}
              <motion.button whileTap={{scale:0.88}} onClick={()=>setShowBonusBuy(true)}
                disabled={isSpinning||freeSpins>0}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white disabled:opacity-40 transition-all"
                style={{background:"linear-gradient(145deg,#5B00AA,#8B00DD)",border:"1px solid #9933FF",
                  boxShadow:isSpinning||freeSpins>0?"none":"0 0 14px #7700BB60"}}
                data-testid="button-bonus-buy"><Star size={18} fill="currentColor"/></motion.button>

              {/* Auto */}
              <motion.button whileTap={{scale:0.88}}
                onClick={()=>{setAutoSpin(!autoSpin);autoSpinRef.current=!autoSpin;}}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-all"
                style={{background:autoSpin?"linear-gradient(145deg,#CC7700,#FF9900)":"linear-gradient(145deg,#1a2535,#0d1520)",
                  border:autoSpin?"1px solid #FFAA33":"1px solid #2a3545",boxShadow:autoSpin?"0 0 12px #FF990060":"none"}}
                data-testid="button-auto-spin"><RotateCcw size={17}/></motion.button>

              {/* SPIN */}
              <motion.button whileTap={{scale:0.9}}
                onClick={()=>spin(false)}
                disabled={isSpinning||(freeSpins===0&&balance<actualBet)}
                className="w-16 h-16 rounded-full flex items-center justify-center disabled:opacity-40 transition-all"
                style={{background:isSpinning?"linear-gradient(145deg,#1a4a2a,#0d3018)":"linear-gradient(145deg,#00CC66,#009944)",
                  border:"3px solid "+(isSpinning?"#004422":"#00FF88"),
                  boxShadow:isSpinning?"0 0 8px #00441060":"0 0 22px #00FF8860,0 4px 12px #00000080"}}
                data-testid="button-spin">
                <motion.div animate={isSpinning?{rotate:360}:{}} transition={{duration:0.55,repeat:isSpinning?Infinity:0,ease:"linear"}}>
                  <RotateCcw size={30} className="text-white"/>
                </motion.div>
              </motion.button>

              {/* Extra Chance */}
              <motion.button whileTap={{scale:0.88}}
                onClick={()=>setExtraChance(!extraChance)}
                disabled={isSpinning||freeSpins>0}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-all disabled:opacity-40"
                style={{background:extraChance?"linear-gradient(145deg,#0088AA,#00BBEE)":"linear-gradient(145deg,#1a2535,#0d1520)",
                  border:extraChance?"1px solid #00DDFF":"1px solid #2a3545",boxShadow:extraChance?"0 0 14px #00AAFF60":"none"}}
                data-testid="button-extra-chance"><Zap size={17}/></motion.button>

              {/* Reset */}
              <motion.button whileTap={{scale:0.88}}
                onClick={()=>{setBlockGrid(initializeGrid());setChestMultipliers([]);setCumulativeMultiplier(1);}}
                disabled={isSpinning||freeSpins>0}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-all disabled:opacity-40"
                style={{background:"linear-gradient(145deg,#1a2535,#0d1520)",border:"1px solid #2a3545"}}
                data-testid="button-reset-grid">
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                </svg>
              </motion.button>
            </div>

            {/* Balance/Bet */}
            <div className="flex mx-3 mb-3 rounded-xl overflow-hidden" style={{border:"1px solid #1e3040"}}>
              <div className="flex-1 px-3 py-2" style={{background:"#0a1018"}}>
                <div className="text-gray-500 text-xs uppercase tracking-wider">Баланс</div>
                <div className="text-white font-bold text-sm" data-testid="text-balance">${balance.toFixed(2)}</div>
              </div>
              <button onClick={()=>setBetIndex(Math.max(0,betIndex-1))} disabled={isSpinning||freeSpins>0}
                className="px-3 text-white disabled:opacity-40 hover:bg-white/5 transition-colors"
                style={{background:"#0d1520",borderLeft:"1px solid #1e3040",borderRight:"1px solid #1e3040"}}
                data-testid="button-decrease-bet">
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 9l-7 7-7-7"/></svg>
              </button>
              <div className="flex-1 px-3 py-2 text-center" style={{background:"#0a1018"}}>
                <div className="text-gray-500 text-xs uppercase tracking-wider">Ставка</div>
                <div className="font-bold text-sm" style={{color:"#00FFAA"}} data-testid="text-bet-amount">${actualBet.toFixed(2)}</div>
              </div>
              <button onClick={()=>setBetIndex(Math.min(BET_AMOUNTS.length-1,betIndex+1))} disabled={isSpinning||freeSpins>0}
                className="px-3 text-white disabled:opacity-40 hover:bg-white/5 transition-colors"
                style={{background:"#0d1520",borderLeft:"1px solid #1e3040"}}
                data-testid="button-increase-bet">
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 15l7-7 7 7"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ FREE SPINS MODAL ═══ */}
      <AnimatePresence>
        {showBonusModal&&pendingBonus&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{backdropFilter:"blur(10px)",background:"#00000099"}}>
            <motion.div initial={{scale:0.35,y:60,opacity:0}} animate={{scale:1,y:0,opacity:1}}
              exit={{scale:0.8,opacity:0}} transition={{type:"spring",duration:0.65,bounce:0.35}}
              className="relative max-w-sm w-full">
              <div className="absolute inset-0 rounded-3xl blur-2xl opacity-55"
                style={{background:"linear-gradient(135deg,#7700FF,#FF00AA)"}}/>
              <div className="relative rounded-3xl p-7 overflow-hidden"
                style={{background:"linear-gradient(160deg,#0d0520,#1a0535,#0d0520)",border:"1px solid #8844FF",boxShadow:"0 0 40px #5500AA80"}}>
                <motion.div className="absolute inset-0 pointer-events-none"
                  style={{background:"linear-gradient(60deg,transparent 30%,#ffffff12 50%,transparent 70%)"}}
                  animate={{x:["-100%","200%"]}} transition={{duration:2,repeat:Infinity,delay:0.6}}/>
                <div className="text-center mb-5">
                  <div className="flex justify-center gap-3 mb-4">
                    {[0,1,2].map(i=>(
                      <motion.div key={i} initial={{y:-40,opacity:0,rotate:-12}} animate={{y:0,opacity:1,rotate:[0,8,-8,0]}}
                        transition={{delay:0.18+i*0.12,type:"spring",bounce:0.5}}>
                        <img src={enderEyeImg} className="w-14 h-14" style={{filter:"drop-shadow(0 0 10px #9988FF)"}}/>
                      </motion.div>
                    ))}
                  </div>
                  <motion.h2 initial={{scale:0}} animate={{scale:[0,1.3,1]}} transition={{delay:0.55,duration:0.5}}
                    className="text-4xl font-black tracking-wider"
                    style={{fontFamily:"'Arial Black',sans-serif",background:"linear-gradient(90deg,#FFD700,#FF8800,#FFD700)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
                    FREE SPINS!
                  </motion.h2>
                  <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.8}} className="text-purple-300 mt-1">
                    {pendingBonus.scatterCount} Ender Eyes собрано!
                  </motion.p>
                </div>
                <motion.div initial={{scale:0}} animate={{scale:1}} transition={{delay:0.9,type:"spring",bounce:0.4}}
                  className="rounded-2xl p-4 mb-5 text-center"
                  style={{background:"linear-gradient(135deg,#5500AA,#AA0066)",boxShadow:"0 0 20px #7700BB60"}}>
                  <div className="text-purple-200 text-sm">Вы получаете</div>
                  <div className="text-6xl font-black text-white leading-none my-1"
                    style={{fontFamily:"'Arial Black',sans-serif",textShadow:"0 0 20px #FF88FF"}}>{pendingBonus.freeSpins}</div>
                  <div className="text-purple-200 font-bold">БЕСПЛАТНЫХ СПИНОВ</div>
                  <div className="text-purple-400 text-xs mt-1">Поле блоков сохраняет прогресс!</div>
                </motion.div>
                <motion.button initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} transition={{delay:1.1}}
                  whileHover={{scale:1.04}} whileTap={{scale:0.95}}
                  onClick={startFreeSpinAutoPlay}
                  className="w-full py-4 rounded-xl font-black text-xl text-white relative overflow-hidden"
                  style={{background:"linear-gradient(135deg,#00AA44,#00DD66)",boxShadow:"0 0 20px #00AA4460",fontFamily:"'Arial Black',sans-serif"}}
                  data-testid="button-start-free-spins">
                  <motion.div className="absolute inset-0"
                    style={{background:"linear-gradient(90deg,transparent,#ffffff30,transparent)"}}
                    animate={{x:["-100%","200%"]}} transition={{duration:1,repeat:Infinity}}/>
                  <span className="relative">ПОЕХАЛИ!</span>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ TOTAL WIN MODAL ═══ */}
      <AnimatePresence>
        {showTotalWinModal&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{backdropFilter:"blur(10px)",background:"#00000099"}}>
            <motion.div initial={{scale:0.5,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.5,opacity:0}}
              transition={{type:"spring",bounce:0.4}}
              className="relative max-w-sm w-full rounded-3xl p-6 overflow-hidden"
              style={{background:"linear-gradient(160deg,#1a0c00,#2a1500,#1a0c00)",border:"1px solid #CC8800",boxShadow:"0 0 40px #AA660080"}}>
              <div className="absolute inset-0 pointer-events-none"
                style={{background:"radial-gradient(circle at 50% 25%,#FFD70012,transparent 60%)"}}/>
              <motion.h2 initial={{scale:0}} animate={{scale:[0,1.2,1]}} transition={{delay:0.2}}
                className="text-center text-2xl font-black mb-4"
                style={{fontFamily:"'Arial Black',sans-serif",background:"linear-gradient(90deg,#FFD700,#FF8800)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
                БОНУС ЗАВЕРШЁН!
              </motion.h2>
              <div className="rounded-xl p-3 mb-4 max-h-44 overflow-y-auto"
                style={{background:"#00000040",border:"1px solid #AA660030"}}>
                <div className="text-yellow-400 text-xs font-bold mb-2 text-center">СЛОМАННЫЕ БЛОКИ</div>
                {Object.entries(freeSpinBlockStats).filter(([_,s])=>s.count>0)
                  .sort((a,b)=>b[1].payout-a[1].payout)
                  .map(([bt,s])=>{
                    const t=parseInt(bt);
                    return (<div key={t} className="flex items-center justify-between rounded-lg px-2 py-1.5 mb-1"
                      style={{background:"#ffffff08"}}>
                      <div className="flex items-center gap-2">
                        <BlockSVG type={t} durability={BLOCK_DURABILITY[t]} maxDurability={BLOCK_DURABILITY[t]} size={22}/>
                        <span className="text-white text-xs">{BLOCK_NAMES[t]}</span>
                      </div>
                      <div className="flex gap-2 text-xs">
                        <span className="text-gray-400">×{s.count}</span>
                        <span className="text-yellow-400 font-bold">{BLOCK_PAYOUTS[t]}x</span>
                        <span className="text-green-400 font-bold">${s.payout.toFixed(2)}</span>
                      </div>
                    </div>);
                  })}
              </div>
              <motion.div initial={{scale:0}} animate={{scale:1}} transition={{delay:0.4,type:"spring"}}
                className="rounded-2xl p-4 mb-4 text-center"
                style={{background:"linear-gradient(135deg,#AA6600,#FFD700)",boxShadow:"0 0 20px #FFD70040"}}>
                <div className="text-amber-900 text-sm font-bold">Общий выигрыш</div>
                <div className="text-4xl font-black text-white"
                  style={{fontFamily:"'Arial Black',sans-serif",textShadow:"0 2px 8px #0008"}}>
                  ${finalTotalWin.toFixed(2)}
                </div>
              </motion.div>
              <motion.button initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} transition={{delay:0.6}}
                whileHover={{scale:1.04}} whileTap={{scale:0.96}}
                onClick={()=>{setShowTotalWinModal(false);setFreeSpinBlockStats({});}}
                className="w-full py-3 rounded-xl font-black text-white text-lg"
                style={{background:"linear-gradient(135deg,#00AA44,#00DD66)",boxShadow:"0 0 16px #00AA4440",fontFamily:"'Arial Black',sans-serif"}}
                data-testid="button-close-total-win">ЗАКРЫТЬ</motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ PAYTABLE ═══ */}
      <AnimatePresence>
        {showPaytable&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{backdropFilter:"blur(6px)",background:"#00000099"}}
            onClick={()=>setShowPaytable(false)}>
            <motion.div initial={{scale:0.9,y:15}} animate={{scale:1,y:0}} exit={{scale:0.9}}
              className="rounded-2xl p-4 max-w-xs w-full max-h-[85vh] overflow-y-auto"
              style={{background:"linear-gradient(160deg,#0d1623,#0a1018)",border:"1px solid #1e3040",boxShadow:"0 0 30px #00000080"}}
              onClick={e=>e.stopPropagation()}>
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-base font-black text-white" style={{fontFamily:"'Arial Black',sans-serif"}}>⛏ Mine Slot</h2>
                <button onClick={()=>setShowPaytable(false)} className="text-gray-400 hover:text-white" data-testid="button-close-paytable"><X size={20}/></button>
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <div className="font-bold mb-1.5 uppercase tracking-wider" style={{color:"#00FFAA"}}>Кирки</div>
                  <div className="grid grid-cols-2 gap-1">
                    {PICKAXE_NAMES.map((nm,i)=>(
                      <div key={nm} className="flex items-center gap-2 rounded-lg p-2" style={{background:"#ffffff08",border:"1px solid #1e3040"}}>
                        <PickaxeSVG type={i} size={24}/>
                        <div><div className="text-white font-bold">{nm}</div><div className="text-gray-400">{PICKAXE_HITS[i]} ударов</div></div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="font-bold mb-1.5 uppercase tracking-wider" style={{color:"#00FFAA"}}>Блоки (5×7)</div>
                  <div className="grid grid-cols-2 gap-1">
                    {BLOCK_NAMES.map((nm,i)=>(
                      <div key={nm} className="flex items-center gap-2 rounded-lg p-2" style={{background:"#ffffff08",border:"1px solid #1e3040"}}>
                        <BlockSVG type={i} durability={BLOCK_DURABILITY[i]} maxDurability={BLOCK_DURABILITY[i]} size={24}/>
                        <div><div className="text-white font-bold">{nm}</div><div className="text-gray-400">{BLOCK_DURABILITY[i]} HP · {BLOCK_PAYOUTS[i]}×</div></div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="font-bold mb-1.5 uppercase tracking-wider" style={{color:"#00FFAA"}}>Спецсимволы</div>
                  {[
                    {el:<SpellbookSVG size={24}/>,n:"Spellbook",d:"Все кирки → Алмазные"},
                    {el:<TNTVG size={24}/>,n:"TNT",d:"Взрывает блок + соседних"},
                    {el:<img src={enderEyeImg} style={{width:24,height:24,imageRendering:"pixelated"}}/>,n:"Scatter",d:"3→5 / 4→7 / 5→10 FS"},
                  ].map((r,i)=>(
                    <div key={i} className="flex items-center gap-2 rounded-lg p-2 mb-1" style={{background:"#ffffff08",border:"1px solid #1e3040"}}>
                      {r.el}<div><div className="text-white font-bold">{r.n}</div><div className="text-gray-400">{r.d}</div></div>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg p-2" style={{background:"#FFD70010",border:"1px solid #FFD70025",color:"#FFD070"}}>
                  🎁 Сундук — очистить всю колонку (7 блоков). Множители перемножаются!
                </div>
                <div className="text-center text-gray-600 pt-1 border-t border-gray-800">Mine Slot · InOut · RTP 96% · Max 5000×</div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ BONUS BUY ═══ */}
      <AnimatePresence>
        {showBonusBuy&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{backdropFilter:"blur(6px)",background:"#00000099"}}
            onClick={()=>setShowBonusBuy(false)}>
            <motion.div initial={{scale:0.9,y:15}} animate={{scale:1,y:0}} exit={{scale:0.9,y:15}}
              className="rounded-2xl p-5 max-w-xs w-full"
              style={{background:"linear-gradient(160deg,#0d0520,#0a1018)",border:"1px solid #5500AA",boxShadow:"0 0 30px #33006660"}}
              onClick={e=>e.stopPropagation()}>
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-black text-white flex items-center gap-2" style={{fontFamily:"'Arial Black',sans-serif"}}>
                  <Star size={18} className="text-purple-400" fill="currentColor"/>Bonus Buy
                </h2>
                <button onClick={()=>setShowBonusBuy(false)} className="text-gray-400 hover:text-white" data-testid="button-close-bonus-buy"><X size={20}/></button>
              </div>
              <p className="text-gray-400 text-sm text-center mb-4">Мгновенно запустите Free Spins!</p>
              <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}}
                onClick={()=>{if(balance>=bet*100){setShowBonusBuy(false);setTimeout(()=>spin(true),50);}else toast({title:"Недостаточно баланса",variant:"destructive"});}}
                disabled={isSpinning||balance<bet*100}
                className="w-full py-4 rounded-xl font-black text-white relative overflow-hidden disabled:opacity-50"
                style={{background:"linear-gradient(135deg,#5500AA,#AA00FF)",boxShadow:"0 0 20px #7700BB60",fontFamily:"'Arial Black',sans-serif"}}
                data-testid="button-buy-bonus">
                <motion.div className="absolute inset-0"
                  style={{background:"linear-gradient(90deg,transparent,#ffffff20,transparent)"}}
                  animate={{x:["-100%","200%"]}} transition={{duration:1.3,repeat:Infinity}}/>
                <div className="relative flex flex-col items-center">
                  <span className="text-sm">Купить Free Spins</span>
                  <span className="text-2xl">${(bet*100).toFixed(2)}</span>
                  <span className="text-xs text-purple-300">= 100× ставки</span>
                </div>
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default MineSlotGame;
