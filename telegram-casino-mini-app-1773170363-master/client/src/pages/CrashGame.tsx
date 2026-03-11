import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { GameHeader } from "@/components/GameHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useTelegram } from "@/components/TelegramProvider";
import { gamesConfig } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAudio } from "@/components/AudioProvider";
import { useLanguage } from "@/components/LanguageProvider";

interface CrashGameProps {
  balance: number;
  onBalanceChange: (newBalance: number) => void;
  onBack: () => void;
}

type GamePhase = "betting" | "preparing" | "running" | "crashed";

const BETTING_TIME = 5000;
const PREPARING_TIME = 3000;
const CRASH_DISPLAY_TIME = 2000;
const MAX_DISPLAY_TIME = 20;
const MAX_MULT_DISPLAY = 10;

function drawAirplane(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  angle: number, propPhase: number,
  isCrashed: boolean
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  const color = isCrashed ? "#ff6666" : "#e11d48";
  const dark  = isCrashed ? "#cc3333" : "#9f1239";

  // Body
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-22, 0);
  ctx.lineTo(18, -3);
  ctx.lineTo(22, 0);
  ctx.lineTo(18, 3);
  ctx.lineTo(-22, 0);
  ctx.closePath();
  ctx.fill();

  // Top wing
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -3);
  ctx.lineTo(-8, -16);
  ctx.lineTo(-18, -14);
  ctx.lineTo(-14, -3);
  ctx.closePath();
  ctx.fill();

  // Bottom wing
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.moveTo(2, 3);
  ctx.lineTo(-4, 10);
  ctx.lineTo(-12, 9);
  ctx.lineTo(-10, 3);
  ctx.closePath();
  ctx.fill();

  // Tail fin
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.moveTo(-18, 0);
  ctx.lineTo(-22, -10);
  ctx.lineTo(-14, -3);
  ctx.closePath();
  ctx.fill();

  // Cockpit
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.beginPath();
  ctx.ellipse(8, -1, 5, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Propeller (spinning)
  if (!isCrashed) {
    ctx.globalAlpha = 0.6;
    for (let i = 0; i < 3; i++) {
      const a = propPhase + (i * Math.PI * 2) / 3;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth   = 2.5;
      ctx.beginPath();
      ctx.moveTo(22 + Math.cos(a) * 1, Math.sin(a) * 1);
      ctx.lineTo(22 + Math.cos(a) * 10, Math.sin(a) * 10);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

export function CrashGame({ balance, onBalanceChange, onBack }: CrashGameProps) {
  const gameConfig = gamesConfig.find((g) => g.id === "crash")!;
  const { hapticFeedback, user } = useTelegram();
  const { toast }      = useToast();
  const queryClient    = useQueryClient();
  const { setCurrentGame } = useAudio();
  const { t }          = useLanguage();

  const [phase, setPhase]               = useState<GamePhase>("betting");
  const [multiplier, setMultiplier]     = useState(1.0);
  const [phaseTimeLeft, setPhaseTimeLeft] = useState(BETTING_TIME);
  const [betAmount, setBetAmount]       = useState(1);
  const [lastBetAmount, setLastBetAmount] = useState(1);
  const [hasBet, setHasBet]             = useState(false);
  const [hasCashedOut, setHasCashedOut] = useState(false);
  const [cashOutMultiplier, setCashOutMultiplier] = useState(0);
  const [autoBet, setAutoBet]           = useState(false);
  const [autoCashout, setAutoCashout]   = useState(false);
  const [autoCashoutAt, setAutoCashoutAt] = useState(2.0);
  const [history, setHistory]           = useState<number[]>([2.34, 1.12, 5.67, 1.45, 3.21, 1.89, 4.56, 2.10]);

  const canvasRef        = useRef<HTMLCanvasElement>(null);
  const animationRef     = useRef<number | null>(null);
  const drawAnimRef      = useRef<number | null>(null);
  const startTimeRef     = useRef<number>(0);
  const crashPointRef    = useRef<number>(0);
  const hasBetRef        = useRef<boolean>(false);
  const hasCashedOutRef  = useRef<boolean>(false);
  const lastBetAmountRef = useRef<number>(1);
  const phaseRef         = useRef<GamePhase>("betting");
  const isBettingRef     = useRef<boolean>(false);
  const propPhaseRef     = useRef<number>(0);
  const flyAwayRef       = useRef<{active:boolean;ox:number;oy:number;t:number}>({active:false,ox:0,oy:0,t:0});
  const phaseTimerRef    = useRef<NodeJS.Timeout | null>(null);
  const countdownRef     = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { hasBetRef.current        = hasBet; },        [hasBet]);
  useEffect(() => { hasCashedOutRef.current  = hasCashedOut; },  [hasCashedOut]);
  useEffect(() => { lastBetAmountRef.current = lastBetAmount; },  [lastBetAmount]);
  useEffect(() => { phaseRef.current         = phase; },          [phase]);
  useEffect(() => { setCurrentGame("crash"); },                   [setCurrentGame]);

  const clearAllTimers = useCallback(() => {
    if (phaseTimerRef.current) { clearTimeout(phaseTimerRef.current);  phaseTimerRef.current = null; }
    if (countdownRef.current)  { clearInterval(countdownRef.current);  countdownRef.current  = null; }
    if (animationRef.current)  { cancelAnimationFrame(animationRef.current); animationRef.current = null; }
    if (drawAnimRef.current)   { cancelAnimationFrame(drawAnimRef.current);  drawAnimRef.current  = null; }
  }, []);

  // ── Mutations ──────────────────────────────────────────────────────────
  const startMutation = useMutation({
    mutationFn: async (amount: number) => {
      const r = await apiRequest("POST", "/api/games/crash/start", { odejs: user?.id || "demo", amount, currency: "usd" });
      return r.json();
    },
    onSuccess: (data) => {
      crashPointRef.current = data.crashPoint;
      if (data.newBalance !== undefined) onBalanceChange(data.newBalance);
      setHasBet(true);
      setLastBetAmount(betAmount);
      isBettingRef.current = false;
    },
    onError: () => {
      toast({ title: t("error"), description: t("failedToBet"), variant: "destructive" });
      setHasBet(false);
      isBettingRef.current = false;
    },
  });

  const cashoutMutation = useMutation({
    mutationFn: async ({ betAmt, mult }: { betAmt: number; mult: number }) => {
      const r = await apiRequest("POST", "/api/games/crash/cashout", { odejs: user?.id || "demo", betAmount: betAmt, multiplier: mult, currency: "usd" });
      return r.json();
    },
    onSuccess: (data) => {
      if (data.newBalance !== undefined) onBalanceChange(data.newBalance);
      queryClient.invalidateQueries({ queryKey: ["/api/users/telegram"] });
    },
  });

  const crashedMutation = useMutation({
    mutationFn: async ({ betAmt, crash }: { betAmt: number; crash: number }) => {
      const r = await apiRequest("POST", "/api/games/crash/crashed", { odejs: user?.id || "demo", betAmount: betAmt, crashPoint: crash, currency: "usd" });
      return r.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/users/telegram"] }); },
  });

  // ── Place bet ──────────────────────────────────────────────────────────
  const placeBet = useCallback((amount: number) => {
    if (phaseRef.current !== "betting" || isBettingRef.current) return;
    if (amount > balance) { toast({ title: t("insufficientFunds"), variant: "destructive" }); return; }
    isBettingRef.current = true;
    setBetAmount(amount);
    hapticFeedback("medium");
    startMutation.mutate(amount);
  }, [balance, hapticFeedback, startMutation, toast, t]);

  // ── Cash out ───────────────────────────────────────────────────────────
  const cashOut = useCallback(() => {
    if (phaseRef.current !== "running" || hasCashedOutRef.current || !hasBetRef.current) return;
    setHasCashedOut(true);
    const m = multiplier;
    setCashOutMultiplier(m);
    hapticFeedback("heavy");
    cashoutMutation.mutate({ betAmt: lastBetAmountRef.current, mult: m });
    toast({ title: t("cashedOut"), description: `+$${(lastBetAmountRef.current * m).toFixed(2)} @ ${m.toFixed(2)}x` });
  }, [multiplier, hapticFeedback, cashoutMutation, toast, t]);

  // ── drawGame (Aviator style) ───────────────────────────────────────────
  const drawGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width  = rect.width  * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    const W = rect.width;
    const H = rect.height;

    const currentPhase = phaseRef.current;
    const isCrashed    = currentPhase === "crashed";

    // Background
    ctx.fillStyle = "#1b1b1b";
    ctx.fillRect(0, 0, W, H);

    // Grid bounds
    const startX = W * 0.10;
    const startY = H * 0.88;
    const endX   = W * 0.97;
    const endY   = H * 0.06;

    // Grid lines
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth   = 1;
    for (let i = 0; i <= 8; i++) {
      const x = startX + (endX - startX) * (i / 8);
      ctx.beginPath(); ctx.moveTo(x, endY); ctx.lineTo(x, startY); ctx.stroke();
    }
    for (let i = 0; i <= 6; i++) {
      const y = startY - (startY - endY) * (i / 6);
      ctx.beginPath(); ctx.moveTo(startX, y); ctx.lineTo(endX, y); ctx.stroke();
    }
    // Axes
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth   = 1.5;
    ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(endX, startY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(startX, endY);   ctx.lineTo(startX, startY); ctx.stroke();

    // Trail & plane
    if (currentPhase === "running" || currentPhase === "crashed") {
      const elapsed  = (Date.now() - startTimeRef.current) / 1000;
      const normTime = Math.min(elapsed / MAX_DISPLAY_TIME, 1);

      // Build trail
      const trailPts: [number, number][] = [];
      const steps = 100;
      for (let i = 0; i <= steps; i++) {
        const frac  = (i / steps) * normTime;
        const t2    = frac * MAX_DISPLAY_TIME;
        const m     = Math.pow(Math.E, t2 * 0.1);
        const px    = startX + (endX - startX) * frac;
        const normM = Math.min(m, MAX_MULT_DISPLAY);
        const py    = startY - (startY - endY) * (Math.log10(1 + normM) / Math.log10(1 + MAX_MULT_DISPLAY));
        trailPts.push([px, Math.max(endY, py)]);
      }

      if (trailPts.length > 1) {
        const lastPt = trailPts[trailPts.length - 1];

        // Gradient fill under curve
        const grad = ctx.createLinearGradient(0, endY, 0, startY);
        grad.addColorStop(0,   "rgba(225,29,72,0)");
        grad.addColorStop(0.7, isCrashed ? "rgba(225,29,72,0.06)" : "rgba(225,29,72,0.13)");
        grad.addColorStop(1,   isCrashed ? "rgba(225,29,72,0.10)" : "rgba(225,29,72,0.20)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(trailPts[0][0], trailPts[0][1]);
        trailPts.forEach(([x, y]) => ctx.lineTo(x, y));
        ctx.lineTo(lastPt[0], startY);
        ctx.lineTo(trailPts[0][0], startY);
        ctx.closePath();
        ctx.fill();

        // Trail line
        ctx.strokeStyle  = isCrashed ? "rgba(225,29,72,0.45)" : "#e11d48";
        ctx.lineWidth    = 3;
        ctx.lineCap      = "round";
        ctx.lineJoin     = "round";
        ctx.shadowColor  = "#e11d48";
        ctx.shadowBlur   = isCrashed ? 4 : 16;
        ctx.beginPath();
        trailPts.forEach(([x, y], i) => i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Airplane position
        propPhaseRef.current += 0.45;
        let planeX = lastPt[0];
        let planeY = lastPt[1];

        if (isCrashed && flyAwayRef.current.active) {
          flyAwayRef.current.t = Math.min(flyAwayRef.current.t + 0.035, 1);
          const ft = flyAwayRef.current.t;
          const ease = ft * ft;
          planeX = lastPt[0] + ease * W * 0.7;
          planeY = lastPt[1] - ease * H * 0.6;
        } else if (!isCrashed) {
          planeX += (Math.random() - 0.5) * 1.5;
          planeY += (Math.random() - 0.5) * 1.5;
        }

        // Pitch angle from trail slope
        let pitchAngle = -0.35;
        if (trailPts.length >= 3) {
          const p1 = trailPts[trailPts.length - 3];
          const p2 = trailPts[trailPts.length - 1];
          pitchAngle = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]);
        }
        if (isCrashed) pitchAngle = -0.7;

        // Only draw if on screen
        if (planeX < W + 100 && planeY > -100) {
          ctx.shadowColor = "#e11d48";
          ctx.shadowBlur  = isCrashed ? 0 : 20;
          drawAirplane(ctx, planeX, planeY, pitchAngle, propPhaseRef.current, isCrashed);
          ctx.shadowBlur  = 0;
        }
      }
    }

    // Y-axis labels
    ctx.fillStyle   = "rgba(255,255,255,0.22)";
    ctx.font        = "9px monospace";
    ctx.textAlign   = "right";
    [1, 2, 3, 5, 10].forEach(ml => {
      const normM = Math.min(ml, MAX_MULT_DISPLAY);
      const ly    = startY - (startY - endY) * (Math.log10(1 + normM) / Math.log10(1 + MAX_MULT_DISPLAY));
      if (ly > endY + 5 && ly < startY - 5) {
        ctx.fillText(`${ml}x`, startX - 4, ly + 3);
      }
    });

  }, [phase, multiplier]);

  // Draw loop
  useEffect(() => {
    const loop = () => {
      drawGame();
      drawAnimRef.current = requestAnimationFrame(loop);
    };
    drawAnimRef.current = requestAnimationFrame(loop);
    return () => { if (drawAnimRef.current) cancelAnimationFrame(drawAnimRef.current); };
  }, [drawGame]);

  // ── Phase management ───────────────────────────────────────────────────
  const startBettingPhase = useCallback(() => {
    clearAllTimers();
    setPhase("betting");
    setMultiplier(1.0);
    setHasCashedOut(false);
    setCashOutMultiplier(0);
    setHasBet(false);
    setPhaseTimeLeft(BETTING_TIME);
    crashPointRef.current = 0;
    isBettingRef.current  = false;
    flyAwayRef.current    = { active: false, ox: 0, oy: 0, t: 0 };

    let tl = BETTING_TIME;
    countdownRef.current  = setInterval(() => { tl -= 100; setPhaseTimeLeft(Math.max(0, tl)); }, 100);
    phaseTimerRef.current = setTimeout(() => startPreparingPhase(), BETTING_TIME);
  }, [clearAllTimers]); // eslint-disable-line

  const startPreparingPhase = useCallback(() => {
    clearAllTimers();
    setPhase("preparing");
    setPhaseTimeLeft(PREPARING_TIME);

    if (!hasBetRef.current) {
      crashPointRef.current = Math.random() < 0.5 ? 1 + Math.random() * 0.5 : 1 + Math.random() * 10;
    }

    let tl = PREPARING_TIME;
    countdownRef.current  = setInterval(() => { tl -= 100; setPhaseTimeLeft(Math.max(0, tl)); }, 100);
    phaseTimerRef.current = setTimeout(() => startRunningPhase(), PREPARING_TIME);
  }, [clearAllTimers]); // eslint-disable-line

  const startRunningPhase = useCallback(() => {
    clearAllTimers();
    setPhase("running");
    startTimeRef.current = Date.now();
  }, [clearAllTimers]);

  const handleCrash = useCallback((finalCrashPoint: number) => {
    clearAllTimers();
    setPhase("crashed");
    setMultiplier(finalCrashPoint);
    hapticFeedback("heavy");
    setHistory(prev => [finalCrashPoint, ...prev.slice(0, 9)]);
    flyAwayRef.current = { active: true, ox: 0, oy: 0, t: 0 };

    if (hasBetRef.current && !hasCashedOutRef.current) {
      crashedMutation.mutate({ betAmt: lastBetAmountRef.current, crash: finalCrashPoint });
    }

    phaseTimerRef.current = setTimeout(() => {
      if (autoBet && lastBetAmountRef.current <= balance) {
        setTimeout(() => {
          if (phaseRef.current === "betting" && !isBettingRef.current) placeBet(lastBetAmountRef.current);
        }, 500);
      }
      startBettingPhase();
    }, CRASH_DISPLAY_TIME);
  }, [clearAllTimers, hapticFeedback, crashedMutation, autoBet, balance, placeBet, startBettingPhase]);

  // Game loop
  useEffect(() => {
    if (phase !== "running") return;
    const runGame = () => {
      const elapsed          = (Date.now() - startTimeRef.current) / 1000;
      const currentMultiplier = Math.pow(Math.E, elapsed * 0.1);
      setMultiplier(parseFloat(currentMultiplier.toFixed(2)));

      if (autoCashout && hasBetRef.current && !hasCashedOutRef.current && currentMultiplier >= autoCashoutAt) {
        cashOut();
      }
      if (crashPointRef.current > 0 && currentMultiplier >= crashPointRef.current) {
        handleCrash(crashPointRef.current);
        return;
      }
      animationRef.current = requestAnimationFrame(runGame);
    };
    animationRef.current = requestAnimationFrame(runGame);
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [phase, autoCashout, autoCashoutAt, cashOut, handleCrash]);

  useEffect(() => {
    startBettingPhase();
    return () => clearAllTimers();
  }, [startBettingPhase, clearAllTimers]);

  // History badge color
  const historyBadge = (h: number) => {
    if (h >= 10) return { bg: "rgba(234,179,8,0.25)",  color: "#fde047", border: "rgba(234,179,8,0.5)" };
    if (h >= 3)  return { bg: "rgba(147,51,234,0.25)", color: "#c084fc", border: "rgba(147,51,234,0.5)" };
    if (h >= 2)  return { bg: "rgba(59,130,246,0.25)", color: "#93c5fd", border: "rgba(59,130,246,0.5)" };
    return           { bg: "rgba(225,29,72,0.25)",  color: "#fb7185", border: "rgba(225,29,72,0.45)" };
  };

  const quickBetAmounts = [0.5, 1, 2, 5, 10];

  return (
    <div className="h-screen flex flex-col overflow-hidden select-none"
      style={{ background: "#111111" }}
      data-testid="page-crash-game">
      <GameHeader title="AVIATOR" balance={balance} onBack={onBack} gameType="crash" schemaGameType="crash" />

      <main className="flex-1 flex flex-col p-2 gap-2 overflow-hidden">

        {/* History */}
        <div className="flex gap-1.5 overflow-x-auto hide-scrollbar py-1 flex-shrink-0">
          {history.map((h, i) => {
            const s = historyBadge(h);
            return (
              <span key={i}
                className="px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap"
                style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
                data-testid={`history-item-${i}`}>
                {h.toFixed(2)}x
              </span>
            );
          })}
        </div>

        {/* Canvas */}
        <div className="flex-1 relative rounded-2xl overflow-hidden min-h-0"
          style={{ background: "#1b1b1b", border: "1px solid #2a2a2a" }}>
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" data-testid="crash-canvas" />

          {/* Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {phase === "betting" && (
              <div className="text-center rounded-2xl px-5 py-3"
                style={{ background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,200,0,0.3)" }}>
                <div className="text-yellow-400 text-xs font-bold uppercase tracking-widest mb-1">Принимаем ставки</div>
                <div className="text-4xl font-black text-white">{(phaseTimeLeft / 1000).toFixed(1)}с</div>
                {hasBet && <div className="mt-1 text-emerald-400 text-sm font-medium">Ставка: ${lastBetAmount.toFixed(2)}</div>}
              </div>
            )}

            {phase === "preparing" && (
              <div className="text-center rounded-2xl px-5 py-3 animate-pulse"
                style={{ background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,140,0,0.4)" }}>
                <div className="text-orange-400 text-xs font-bold uppercase tracking-widest mb-1">✈️ ВЗЛЁТ</div>
                <div className="text-5xl font-black text-white">{Math.ceil(phaseTimeLeft / 1000)}</div>
              </div>
            )}

            {(phase === "running" || phase === "crashed") && (
              <div className="text-center rounded-2xl px-6 py-3"
                style={{
                  background: "rgba(0,0,0,0.72)",
                  border: `1px solid ${phase === "crashed" ? "rgba(225,29,72,0.5)" : "rgba(255,255,255,0.10)"}`,
                }}>
                <div
                  className="font-black leading-none"
                  style={{
                    fontSize: 54,
                    fontFamily: "'Arial Black', sans-serif",
                    color: phase === "crashed" ? "#e11d48" : "#ffffff",
                    textShadow: phase === "crashed" ? "0 0 24px #e11d4890" : "0 0 14px rgba(255,255,255,0.25)",
                  }}
                  data-testid="multiplier-display">
                  {multiplier.toFixed(2)}x
                </div>
                {phase === "crashed" && (
                  <p className="text-red-400 font-black mt-1 text-sm tracking-widest uppercase">✈️ УЛЕТЕЛ!</p>
                )}
                {hasCashedOut && (
                  <p className="text-emerald-400 font-medium mt-1 text-xs">
                    Выведено @ {cashOutMultiplier.toFixed(2)}x · +${(lastBetAmount * cashOutMultiplier).toFixed(2)}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex-shrink-0 space-y-2">

          {/* CASH OUT */}
          {phase === "running" && hasBet && !hasCashedOut && (
            <button onClick={cashOut}
              className="w-full h-14 rounded-xl text-xl font-black text-white active:scale-95 transition-transform"
              style={{ background: "linear-gradient(135deg,#be123c,#e11d48)", boxShadow: "0 0 22px rgba(225,29,72,0.55)" }}
              data-testid="button-cash-out">
              ✈️ CASH OUT &nbsp; ${(lastBetAmount * multiplier).toFixed(2)}
            </button>
          )}

          {/* BET controls */}
          {phase === "betting" && !hasBet && (
            <div className="space-y-2">
              <div className="flex gap-1">
                {quickBetAmounts.map(a => (
                  <button key={a} onClick={() => setBetAmount(a)} disabled={a > balance}
                    className="flex-1 py-2 rounded-lg text-xs font-bold text-white disabled:opacity-25 transition-all active:scale-95"
                    style={{ background: betAmount === a ? "#374151" : "#1f2937", border: `1px solid ${betAmount === a ? "#6b7280" : "#374151"}` }}>
                    ${a}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={betAmount}
                  onChange={e => setBetAmount(parseFloat(e.target.value) || 0)}
                  className="flex-1 h-14 text-center text-lg font-bold bg-zinc-900 border-zinc-700 text-white"
                  min={gameConfig.minBet}
                  max={Math.min(gameConfig.maxBet, balance)}
                  data-testid="input-bet-amount"
                />
                <button onClick={() => placeBet(betAmount)}
                  disabled={betAmount > balance || betAmount < gameConfig.minBet || startMutation.isPending}
                  className="h-14 px-8 rounded-xl text-xl font-black text-white disabled:opacity-35 active:scale-95 transition-transform"
                  style={{ background: "linear-gradient(135deg,#15803d,#16a34a)", boxShadow: "0 0 20px rgba(22,163,74,0.45)" }}
                  data-testid="button-place-bet">
                  СТАВКА
                </button>
              </div>
            </div>
          )}

          {phase === "betting" && hasBet && (
            <div className="text-center py-3 rounded-xl font-bold text-sm"
              style={{ background: "rgba(22,163,74,0.12)", color: "#4ade80", border: "1px solid rgba(22,163,74,0.3)" }}>
              ✅ Ставка принята: ${lastBetAmount.toFixed(2)}
            </div>
          )}

          {phase !== "betting" && !hasBet && phase !== "crashed" && (
            <div className="text-center py-3 text-zinc-600 text-sm">Ожидание следующего раунда...</div>
          )}

          {/* Auto features */}
          <div className="flex gap-4 p-3 rounded-xl" style={{ background: "#1a1a1a", border: "1px solid #252525" }}>
            <div className="flex items-center gap-2 flex-1">
              <Switch checked={autoBet} onCheckedChange={setAutoBet} data-testid="switch-auto-bet" />
              <span className="text-sm text-zinc-400">{t("autoBet")}</span>
            </div>
            <div className="flex items-center gap-2 flex-1">
              <Switch checked={autoCashout} onCheckedChange={setAutoCashout} data-testid="switch-auto-cashout" />
              <span className="text-sm text-zinc-400">{t("autoCashout")}</span>
              {autoCashout && (
                <Input
                  type="number"
                  value={autoCashoutAt}
                  onChange={e => setAutoCashoutAt(parseFloat(e.target.value) || 2)}
                  className="w-16 h-7 text-xs text-center bg-zinc-900 border-zinc-700 text-white"
                  min={1.1} step={0.1}
                  data-testid="input-auto-cashout"
                />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
