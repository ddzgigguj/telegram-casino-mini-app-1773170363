import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { GameHeader } from "@/components/GameHeader";
import { BettingPanel } from "@/components/BettingPanel";
import { Button } from "@/components/ui/button";
import { useTelegram } from "@/components/TelegramProvider";
import { gamesConfig } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Share2 } from "lucide-react";
import { useAudio } from "@/components/AudioProvider";
import { useLanguage } from "@/components/LanguageProvider";

interface TurtleRaceGameProps {
  balance: number;
  onBalanceChange: (newBalance: number) => void;
  onBack: () => void;
}

type TurtleColor = "red" | "blue" | "yellow";

const turtleData: { id: TurtleColor; color: string; shell: string; name: string; emoji: string }[] = [
  { id: "red",    color: "#ef4444", shell: "#991b1b", name: "Красная",  emoji: "🔴" },
  { id: "blue",   color: "#3b82f6", shell: "#1d4ed8", name: "Синяя",    emoji: "🔵" },
  { id: "yellow", color: "#eab308", shell: "#a16207", name: "Жёлтая",   emoji: "🟡" },
];

// Draw a turtle on canvas
function drawTurtle(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, shell: string, legPhase: number, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath();
  ctx.ellipse(0, 14, 20, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs (animated)
  const legAmp = 6;
  ctx.fillStyle = color;
  // Front legs
  ctx.beginPath(); ctx.ellipse(-10, 4 + Math.sin(legPhase) * legAmp, 4, 7, -0.3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(10, 4 + Math.sin(legPhase + Math.PI) * legAmp, 4, 7, 0.3, 0, Math.PI * 2); ctx.fill();
  // Back legs
  ctx.beginPath(); ctx.ellipse(-10, -4 + Math.sin(legPhase + Math.PI) * legAmp, 4, 7, 0.3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(10, -4 + Math.sin(legPhase) * legAmp, 4, 7, -0.3, 0, Math.PI * 2); ctx.fill();

  // Body
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 0, 14, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Shell
  ctx.fillStyle = shell;
  ctx.beginPath();
  ctx.ellipse(0, -2, 12, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  // Shell pattern
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-6, -2); ctx.lineTo(0, -9); ctx.lineTo(6, -2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-6, -2); ctx.lineTo(-10, 3); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(6, -2); ctx.lineTo(10, 3); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-6, -2); ctx.lineTo(6, -2); ctx.stroke();

  // Head
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(16, -1, 6, 5, 0.2, 0, Math.PI * 2);
  ctx.fill();
  // Eye
  ctx.fillStyle = "#fff";
  ctx.beginPath(); ctx.arc(19, -3, 2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#000";
  ctx.beginPath(); ctx.arc(20, -3, 1, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
}

// Draw dust particles
function drawParticles(ctx: CanvasRenderingContext2D, particles: { x: number; y: number; vx: number; vy: number; life: number; size: number }[]) {
  for (const p of particles) {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = "#d4a96a";
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function TurtleRaceGame({ balance, onBalanceChange, onBack }: TurtleRaceGameProps) {
  const gameConfig = gamesConfig.find((g) => g.id === "turtle")!;
  const { hapticFeedback, user, shareGameResult } = useTelegram();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { setCurrentGame } = useAudio();
  const { t } = useLanguage();

  const [selectedTurtle, setSelectedTurtle] = useState<TurtleColor | null>(null);
  const [positions, setPositions] = useState<Record<TurtleColor, number>>({ red: 0, blue: 0, yellow: 0 });
  const [winner, setWinner] = useState<TurtleColor | null>(null);
  const [isRacing, setIsRacing] = useState(false);
  const [history, setHistory] = useState<{ winner: TurtleColor; myBet: TurtleColor; isWin: boolean }[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef    = useRef<number>();
  const posRef     = useRef<Record<TurtleColor, number>>({ red: 0, blue: 0, yellow: 0 });
  const targetRef  = useRef<Record<TurtleColor, number>>({ red: 0, blue: 0, yellow: 0 });
  const legPhaseRef = useRef<Record<TurtleColor, number>>({ red: 0, blue: 0, yellow: 0 });
  const particlesRef = useRef<{ x: number; y: number; vx: number; vy: number; life: number; size: number }[]>([]);
  const racingRef  = useRef(false);
  const winnerRef  = useRef<TurtleColor | null>(null);

  useEffect(() => { setCurrentGame("turtle"); }, [setCurrentGame]);

  // Canvas render loop
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width, H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    // Sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, H * 0.4);
    sky.addColorStop(0, "#0ea5e9");
    sky.addColorStop(1, "#7dd3fc");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H * 0.4);

    // Ocean horizon
    ctx.fillStyle = "#0369a1";
    ctx.fillRect(0, H * 0.35, W, H * 0.05);

    // Beach ground
    const sand = ctx.createLinearGradient(0, H * 0.4, 0, H);
    sand.addColorStop(0, "#d4a96a");
    sand.addColorStop(1, "#b8864e");
    ctx.fillStyle = sand;
    ctx.fillRect(0, H * 0.4, W, H * 0.6);

    // Palm trees (decorative)
    for (let i = 0; i < 3; i++) {
      const px = 20 + i * (W * 0.45);
      const py = H * 0.4;
      ctx.fillStyle = "#78350f";
      ctx.fillRect(px - 3, py - 35, 6, 35);
      ctx.fillStyle = "#16a34a";
      for (let j = 0; j < 5; j++) {
        const angle = (j / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(px, py - 35);
        ctx.bezierCurveTo(px + Math.cos(angle) * 20, py - 40, px + Math.cos(angle) * 30, py - 28, px + Math.cos(angle) * 22, py - 22);
        ctx.fillStyle = "#16a34a";
        ctx.fill();
      }
    }

    // Lane lines
    const laneH = (H * 0.58) / 3;
    const laneTop = H * 0.41;
    for (let i = 0; i < 3; i++) {
      const y = laneTop + i * laneH;
      // Lane bg
      ctx.fillStyle = i % 2 === 0 ? "rgba(0,0,0,0.08)" : "rgba(0,0,0,0.04)";
      ctx.fillRect(0, y, W, laneH);
      // Dashed center line
      if (i < 2) {
        ctx.setLineDash([8, 6]);
        ctx.strokeStyle = "rgba(255,255,255,0.2)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, y + laneH);
        ctx.lineTo(W, y + laneH);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Finish line (checkerboard)
    const finX = W - 28;
    const sqSize = 7;
    for (let row = 0; row < Math.ceil(H * 0.58 / sqSize); row++) {
      for (let col = 0; col < 4; col++) {
        ctx.fillStyle = (row + col) % 2 === 0 ? "#fff" : "#000";
        ctx.fillRect(finX + col * sqSize, laneTop + row * sqSize, sqSize, sqSize);
      }
    }

    // Update particles
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);
    for (const p of particlesRef.current) {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.04;
    }
    drawParticles(ctx, particlesRef.current);

    // Draw turtles
    turtleData.forEach((td, i) => {
      const pos = posRef.current[td.id];
      const laneY = laneTop + i * laneH + laneH / 2;
      const turtleX = 30 + pos * (finX - 50) / 100;

      if (racingRef.current) {
        legPhaseRef.current[td.id] += 0.18;
        // Emit dust particles
        if (Math.random() < 0.3) {
          particlesRef.current.push({
            x: turtleX - 20, y: laneY + 8,
            vx: -(Math.random() * 2 + 1), vy: -(Math.random() * 1),
            life: 0.8, size: Math.random() * 3 + 1,
          });
        }
      }

      // Bob effect
      const bob = racingRef.current ? Math.sin(legPhaseRef.current[td.id] * 2) * 2 : 0;

      drawTurtle(ctx, turtleX, laneY + bob, td.color, td.shell, legPhaseRef.current[td.id]);

      // Winner crown
      if (winnerRef.current === td.id) {
        ctx.font = "18px serif";
        ctx.fillText("👑", turtleX - 9, laneY - 22);
      }
    });

    // Starting line
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.fillRect(28, laneTop, 2, H * 0.58);

    // Distance markers
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "9px monospace";
    ctx.textAlign = "center";
    for (let i = 25; i < 100; i += 25) {
      const mx = 30 + i * (finX - 50) / 100;
      ctx.fillText(`${i}%`, mx, laneTop - 4);
      ctx.fillStyle = "rgba(255,255,255,0.1)";
      ctx.fillRect(mx, laneTop, 1, H * 0.58);
      ctx.fillStyle = "rgba(255,255,255,0.3)";
    }

    animRef.current = requestAnimationFrame(renderCanvas);
  }, []);

  useEffect(() => {
    animRef.current = requestAnimationFrame(renderCanvas);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [renderCanvas]);

  const raceMutation = useMutation({
    mutationFn: async ({ betAmount, turtle }: { betAmount: number; turtle: TurtleColor }) => {
      setWinner(null);
      setIsRacing(true);
      racingRef.current = true;
      winnerRef.current = null;
      posRef.current = { red: 0, blue: 0, yellow: 0 };

      const response = await apiRequest("POST", "/api/games/turtle/race", {
        odejs: user?.id || "demo",
        currency: "usd",
        amount: betAmount,
        selectedTurtle: turtle,
      });
      return response.json();
    },
    onSuccess: async (data) => {
      const targetPositions = data.raceProgress as Record<TurtleColor, number>;
      targetRef.current = targetPositions;

      // Animate race with sinusoidal surges
      const startTime = Date.now();
      const duration = 3500;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        for (const td of turtleData) {
          const target = targetPositions[td.id];
          // Wavy progress with random surges
          const surge = Math.sin(elapsed * 0.003 + turtleData.indexOf(td) * 2) * 0.08;
          const eased = Math.pow(progress, 0.7) + surge * progress;
          posRef.current[td.id] = Math.min(Math.max(eased, 0), 1) * target;
        }

        if (progress < 1) {
          setTimeout(animate, 16);
        } else {
          posRef.current = { ...targetPositions };
          racingRef.current = false;
          winnerRef.current = data.winner;
          setIsRacing(false);
          setWinner(data.winner);

          if (data.newBalance !== undefined) onBalanceChange(data.newBalance);
          setHistory(h => [{ winner: data.winner, myBet: data.selectedTurtle, isWin: data.isWin }, ...h.slice(0, 9)]);

          if (data.isWin) {
            hapticFeedback("heavy");
            toast({ title: t("yourTurtleWon"), description: `+$${data.payout.toFixed(2)} (3x)` });
          } else {
            hapticFeedback("rigid");
          }
          queryClient.invalidateQueries({ queryKey: ["/api/users/telegram"] });
        }
      };
      animate();
    },
    onError: () => {
      setIsRacing(false);
      racingRef.current = false;
      toast({ title: t("error"), description: `${t("failedToRace")}. ${t("tryAgain")}`, variant: "destructive" });
      queryClient.invalidateQueries({ queryKey: ["/api/users/telegram"] });
    },
  });

  const handleRace = (betAmount: number) => {
    if (!selectedTurtle || isRacing) return;
    hapticFeedback("medium");
    raceMutation.mutate({ betAmount, turtle: selectedTurtle });
  };

  const resetGame = () => {
    setSelectedTurtle(null);
    setWinner(null);
    winnerRef.current = null;
    posRef.current = { red: 0, blue: 0, yellow: 0 };
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: "#0c1a2e" }} data-testid="page-turtle-game">
      <GameHeader title={t("turtleTitle")} balance={balance} onBack={onBack} gameType="turtle" schemaGameType="turtle" />

      <main className="flex-1 flex flex-col p-2 gap-2 overflow-hidden">
        {/* History */}
        <div className="flex gap-1.5 overflow-x-auto hide-scrollbar py-1 flex-shrink-0">
          {history.map((h, i) => (
            <span key={i} className={`px-2 py-1 rounded-lg text-xs font-bold whitespace-nowrap ${h.isWin ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" : "bg-red-500/20 text-red-400 border border-red-500/40"}`}>
              {h.winner.charAt(0).toUpperCase() + h.winner.slice(1)}
            </span>
          ))}
          {history.length === 0 && <span className="text-sm text-white/30">{t("noHistory")}</span>}
        </div>

        {/* Race track canvas */}
        <div className="flex-1 relative rounded-2xl overflow-hidden min-h-0" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" width={400} height={300} style={{ width: "100%", height: "100%" }} />

          {/* Race labels overlay */}
          <div className="absolute left-2 top-0 bottom-0 flex flex-col justify-around pointer-events-none" style={{ top: "41%", height: "58%" }}>
            {turtleData.map(td => (
              <div key={td.id} className="flex items-center gap-1">
                <span className="text-xs font-bold" style={{ color: td.color, textShadow: `0 0 8px ${td.color}` }}>{td.emoji}</span>
              </div>
            ))}
          </div>

          {/* Winner overlay */}
          {winner && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className={`text-center px-6 py-3 rounded-2xl backdrop-blur-sm ${winner === selectedTurtle ? "bg-emerald-500/80" : "bg-red-500/80"}`}>
                <div className="text-3xl mb-1">🏆</div>
                <p className="text-white font-black text-lg">{turtleData.find(t => t.id === winner)?.name}</p>
                <p className="text-white/80 text-sm">{winner === selectedTurtle ? "Твоя черепаха выиграла!" : "Лучше в следующий раз"}</p>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex-shrink-0 space-y-2">
          {!winner && !isRacing && (
            <div className="rounded-2xl p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-xs text-white/40 mb-2 text-center uppercase tracking-widest">{t("chooseTurtle")} · 3x</p>
              <div className="flex gap-2">
                {turtleData.map(td => (
                  <button
                    key={td.id}
                    onClick={() => { hapticFeedback("light"); setSelectedTurtle(td.id); }}
                    data-testid={`button-turtle-${td.id}`}
                    className="flex-1 h-14 rounded-xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95"
                    style={{
                      background: selectedTurtle === td.id ? `${td.color}30` : "rgba(255,255,255,0.04)",
                      border: `2px solid ${selectedTurtle === td.id ? td.color : "rgba(255,255,255,0.08)"}`,
                      boxShadow: selectedTurtle === td.id ? `0 0 16px ${td.color}50` : undefined,
                    }}
                  >
                    <span className="text-xl">{td.emoji}</span>
                    <span className="text-[10px] font-bold" style={{ color: selectedTurtle === td.id ? td.color : "rgba(255,255,255,0.4)" }}>{td.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {winner ? (
            <div className="flex gap-2">
              <Button className="flex-1 h-12 font-bold" style={{ background: winner === selectedTurtle ? "linear-gradient(135deg,#059669,#10b981)" : "linear-gradient(135deg,#7f1d1d,#ef4444)" }} onClick={resetGame} data-testid="button-play-again">
                {t("playAgain")}
              </Button>
              {winner === selectedTurtle && (
                <Button variant="secondary" className="h-12 px-4 bg-white/5 border border-white/10" onClick={() => { hapticFeedback("light"); shareGameResult?.("My turtle won!"); }} data-testid="button-share">
                  <Share2 className="w-5 h-5" />
                </Button>
              )}
            </div>
          ) : (
            <BettingPanel balance={balance} minBet={gameConfig.minBet} maxBet={gameConfig.maxBet} onBet={handleRace} isPlaying={isRacing} buttonText={isRacing ? t("racing") : t("start")} disabled={!selectedTurtle} compact />
          )}
        </div>
      </main>
    </div>
  );
}
