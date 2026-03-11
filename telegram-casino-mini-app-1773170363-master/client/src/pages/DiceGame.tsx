import { useState, useCallback, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { GameHeader } from "@/components/GameHeader";
import { BettingPanel } from "@/components/BettingPanel";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useTelegram } from "@/components/TelegramProvider";
import { gamesConfig } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { ArrowUp, ArrowDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAudio } from "@/components/AudioProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { formatCurrencyAmount } from "@/components/CurrencyProvider";

interface DiceGameProps {
  balance: number;
  onBalanceChange: (newBalance: number) => void;
  onBack: () => void;
}

// SVG dice face renderer
function DiceFace({ value, isWin, isLoss, isRolling }: { value: number; isWin: boolean | null; isLoss: boolean | null; isRolling: boolean }) {
  const dotPositions: Record<number, [number, number][]> = {
    1: [[50, 50]],
    2: [[25, 25], [75, 75]],
    3: [[25, 25], [50, 50], [75, 75]],
    4: [[25, 25], [75, 25], [25, 75], [75, 75]],
    5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
    6: [[25, 22], [75, 22], [25, 50], [75, 50], [25, 78], [75, 78]],
  };

  const face = Math.max(1, Math.min(6, value));
  const dots = dotPositions[face] || dotPositions[1];

  const glowColor = isWin ? "#10b981" : isLoss ? "#ef4444" : "#a855f7";
  const borderColor = isWin ? "#10b981" : isLoss ? "#ef4444" : "#7c3aed";

  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%">
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <linearGradient id="diceBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e1b4b"/>
          <stop offset="100%" stopColor="#0f0f1a"/>
        </linearGradient>
        <linearGradient id="diceShine" x1="0%" y1="0%" x2="60%" y2="60%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.15)"/>
          <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
        </linearGradient>
      </defs>

      {/* Shadow */}
      <ellipse cx="50" cy="96" rx="38" ry="5" fill="rgba(0,0,0,0.5)"/>

      {/* Cube body */}
      <rect x="6" y="4" width="88" height="88" rx="16" ry="16" fill="url(#diceBg)" stroke={borderColor} strokeWidth="2" filter="url(#glow)"/>
      <rect x="6" y="4" width="88" height="88" rx="16" ry="16" fill="url(#diceShine)"/>

      {/* Dots */}
      {dots.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="7" fill={glowColor} filter="url(#glow)" opacity={isRolling ? 0.5 : 1}/>
      ))}

      {/* Edge highlight */}
      <rect x="6" y="4" width="88" height="28" rx="16" ry="16" fill="rgba(255,255,255,0.05)"/>
    </svg>
  );
}

// Particle/confetti system
function Particles({ active, win }: { active: boolean; win: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>();

  useEffect(() => {
    if (!active || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const particles = Array.from({ length: win ? 60 : 20 }, (_, i) => ({
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * (win ? 8 : 4),
      vy: (Math.random() - 0.5) * (win ? 8 : 4) - (win ? 4 : 2),
      life: 1,
      decay: Math.random() * 0.02 + 0.01,
      size: Math.random() * 8 + 2,
      color: win
        ? ["#ffd700", "#10b981", "#f59e0b", "#34d399"][i % 4]
        : ["#ef4444", "#991b1b", "#7f1d1d"][i % 3],
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2;
        p.life -= p.decay;
        if (p.life > 0) {
          alive = true;
          ctx.globalAlpha = p.life;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      if (alive) rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [active, win]);

  if (!active) return null;
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 10 }} />;
}

export function DiceGame({ balance, onBalanceChange, onBack }: DiceGameProps) {
  const gameConfig = gamesConfig.find((g) => g.id === "dice")!;
  const { hapticFeedback, user } = useTelegram();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { setCurrentGame, playSound } = useAudio();
  const { t } = useLanguage();

  const [target, setTarget] = useState(50);
  const [isOver, setIsOver] = useState(true);
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [lastWin, setLastWin] = useState<boolean | null>(null);
  const [displayRoll, setDisplayRoll] = useState<number | null>(null);
  const [history, setHistory] = useState<{ roll: number; isWin: boolean }[]>([]);
  const [showParticles, setShowParticles] = useState(false);
  const [diceRotate, setDiceRotate] = useState({ x: 0, y: 0, z: 0 });
  const [isRollingAnim, setIsRollingAnim] = useState(false);
  const rotateRef = useRef<number>();

  useEffect(() => { setCurrentGame("dice"); }, [setCurrentGame]);

  const calculateMultiplier = useCallback((t: number, over: boolean) => {
    const winChance = over ? (100 - t) / 100 : t / 100;
    if (winChance <= 0) return 0;
    return Math.floor((0.97 / winChance) * 100) / 100;
  }, []);

  const winChance = isOver ? 100 - target : target;
  const multiplier = calculateMultiplier(target, isOver);

  const rollMutation = useMutation({
    mutationFn: async (betAmount: number) => {
      setIsRollingAnim(true);
      setShowParticles(false);

      // Dice spin animation
      let angle = 0;
      const spin = () => {
        angle += 0.3;
        setDiceRotate({ x: angle * 57, y: angle * 83, z: angle * 41 });
        setDisplayRoll(Math.floor(Math.random() * 6) + 1);
        rotateRef.current = requestAnimationFrame(spin);
      };
      rotateRef.current = requestAnimationFrame(spin);

      const response = await apiRequest("POST", "/api/games/dice/roll", {
        odejs: user?.id || "demo",
        amount: betAmount,
        target,
        isOver,
        currency: "usd",
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (rotateRef.current) cancelAnimationFrame(rotateRef.current);
      setIsRollingAnim(false);
      // Landing bounce
      setDiceRotate({ x: 0, y: 0, z: 0 });
      setTimeout(() => setDiceRotate({ x: 5, y: 5, z: 0 }), 80);
      setTimeout(() => setDiceRotate({ x: 0, y: 0, z: 0 }), 160);

      setLastRoll(data.roll);
      setDisplayRoll(data.roll);
      setLastWin(data.isWin);
      setHistory((prev) => [{ roll: data.roll, isWin: data.isWin }, ...prev.slice(0, 9)]);

      if (data.newBalance !== undefined) onBalanceChange(data.newBalance);

      if (data.isWin) {
        hapticFeedback("heavy");
        setShowParticles(true);
        setTimeout(() => setShowParticles(false), 2500);
        toast({ title: t("youWon"), description: formatCurrencyAmount(data.payout, "usd", true) });
      } else {
        hapticFeedback("rigid");
        setShowParticles(true);
        setTimeout(() => setShowParticles(false), 1200);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/users/telegram"] });
    },
    onError: () => {
      if (rotateRef.current) cancelAnimationFrame(rotateRef.current);
      setIsRollingAnim(false);
      toast({ title: t("error"), description: `${t("failedToRoll")}. ${t("tryAgain")}`, variant: "destructive" });
      queryClient.invalidateQueries({ queryKey: ["/api/users/telegram"] });
    },
  });

  const roll = (betAmount: number) => {
    if (rollMutation.isPending) return;
    hapticFeedback("medium");
    rollMutation.mutate(betAmount);
  };

  const diceValue = displayRoll ? Math.max(1, Math.min(6, Math.ceil(displayRoll / 16.67))) : 1;
  const isPending = rollMutation.isPending;

  // Win zone %
  const winZoneLeft = isOver ? `${target}%` : "0%";
  const winZoneWidth = isOver ? `${100 - target}%` : `${target}%`;

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: "linear-gradient(160deg,#0a0010 0%,#10002b 50%,#0a0a1a 100%)" }} data-testid="page-dice-game">
      <GameHeader title={t("diceTitle")} balance={balance} onBack={onBack} gameType="dice" schemaGameType="dice" />

      <main className="flex-1 flex flex-col p-2 gap-2 overflow-hidden">
        {/* History */}
        <div className="flex gap-1.5 overflow-x-auto hide-scrollbar py-1 flex-shrink-0">
          {history.map((h, i) => (
            <span key={i} className={`px-2 py-1 rounded-lg text-xs font-bold whitespace-nowrap ${h.isWin ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" : "bg-red-500/20 text-red-400 border border-red-500/40"}`}>
              {h.roll}
            </span>
          ))}
          {history.length === 0 && <span className="text-sm text-white/30">{t("noHistory")}</span>}
        </div>

        {/* Dice arena */}
        <div className="flex-1 flex items-center justify-center relative">
          <Particles active={showParticles} win={lastWin === true} />

          {/* Platform */}
          <div className="relative w-48 h-48 flex items-center justify-center">
            {/* Glow platform */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-3 rounded-full" style={{ background: lastWin ? "radial-gradient(ellipse, #10b98180 0%, transparent 70%)" : lastWin === false ? "radial-gradient(ellipse, #ef444480 0%, transparent 70%)" : "radial-gradient(ellipse, #7c3aed60 0%, transparent 70%)" }} />

            {/* Dice */}
            <div
              className="w-28 h-28 transition-all"
              style={{
                transform: `perspective(600px) rotateX(${diceRotate.x}deg) rotateY(${diceRotate.y}deg) rotateZ(${diceRotate.z}deg)`,
                filter: lastWin ? "drop-shadow(0 0 20px #10b98180)" : lastWin === false ? "drop-shadow(0 0 20px #ef444480)" : "drop-shadow(0 0 12px #7c3aed60)",
                transition: isPending ? "none" : "transform 0.15s ease-out",
              }}
            >
              <DiceFace value={diceValue} isWin={lastWin} isLoss={lastWin === false ? true : null} isRolling={isPending} />
            </div>

            {/* Roll result */}
            {!isPending && lastRoll !== null && (
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-center">
                <span className={`text-2xl font-black ${lastWin ? "text-emerald-400" : "text-red-400"}`}>
                  {lastRoll}
                </span>
                <span className={`ml-2 text-sm font-bold px-2 py-0.5 rounded-full ${lastWin ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                  {lastWin ? "WIN" : "LOSE"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Controls panel */}
        <div className="flex-shrink-0 space-y-2 rounded-2xl p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(12px)" }}>
          {/* Rule hint */}
          <div className="text-center text-xs rounded-xl p-2 mb-1" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", fontFamily: "Arial", fontWeight: 400, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
            Бросается число от <span className="text-white font-bold">1 до 100</span><br/>
            Выиграешь если выпадет{" "}
            <span className="font-bold text-emerald-400">
              {isOver ? `БОЛЬШЕ ${target} (т.е. ${target + 1}–100)` : `МЕНЬШЕ ${target} (т.е. 1–${target - 1})`}
            </span>
          </div>

          {/* Over / Under */}
          <div className="flex gap-2">
            <button
              className={`flex-1 h-10 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all ${isOver ? "text-white" : "text-white/40"}`}
              style={{ background: isOver ? "linear-gradient(135deg,#059669,#10b981)" : "rgba(255,255,255,0.05)", border: isOver ? "1px solid #10b981" : "1px solid rgba(255,255,255,0.08)" }}
              onClick={() => { hapticFeedback("light"); setIsOver(true); }}
              disabled={isPending}
              data-testid="button-over"
            >
              <ArrowUp className="w-4 h-4" /> {t("over")}
            </button>
            <button
              className={`flex-1 h-10 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all ${!isOver ? "text-white" : "text-white/40"}`}
              style={{ background: !isOver ? "linear-gradient(135deg,#059669,#10b981)" : "rgba(255,255,255,0.05)", border: !isOver ? "1px solid #10b981" : "1px solid rgba(255,255,255,0.08)" }}
              onClick={() => { hapticFeedback("light"); setIsOver(false); }}
              disabled={isPending}
              data-testid="button-under"
            >
              <ArrowDown className="w-4 h-4" /> {t("under")}
            </button>
          </div>

          {/* Gradient Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/50">{t("target")}</span>
              <span className="font-bold text-white">{target}</span>
            </div>

            {/* Custom gradient track */}
            <div className="relative h-6 flex items-center">
              <div className="absolute inset-x-0 h-3 rounded-full overflow-hidden" style={{ background: "linear-gradient(90deg, #ef4444 0%, #ef4444 100%)" }}>
                <div className="absolute h-full rounded-full bg-emerald-500 transition-all" style={{ left: isOver ? `${target}%` : "0%", right: isOver ? "0%" : `${100 - target}%` }} />
                {/* Pulsing boundary */}
                <div className="absolute top-0 bottom-0 w-0.5 bg-white/80 animate-pulse" style={{ left: `${target}%` }} />
              </div>
              <Slider value={[target]} onValueChange={([v]) => { hapticFeedback("light"); setTarget(v); }} min={2} max={98} step={1} disabled={isPending} className="absolute inset-x-0" data-testid="slider-target" />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center p-2 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-xs text-white/40">{t("chance")}</p>
              <p className="text-lg font-black text-white">{winChance}%</p>
            </div>
            <div className="text-center p-2 rounded-xl" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
              <p className="text-xs text-emerald-400/60">{t("multiplier")}</p>
              <p className="text-lg font-black text-emerald-400">{multiplier.toFixed(2)}x</p>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0">
          <BettingPanel balance={balance} minBet={gameConfig.minBet} maxBet={gameConfig.maxBet} onBet={roll} isPlaying={isPending} buttonText={isPending ? t("rolling") : t("roll")} compact />
        </div>
      </main>
    </div>
  );
}
