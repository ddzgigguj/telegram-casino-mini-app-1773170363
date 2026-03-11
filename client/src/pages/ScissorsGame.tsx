import { useState, useEffect, useRef } from "react";
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
import { formatCurrencyAmount } from "@/components/CurrencyProvider";

interface ScissorsGameProps {
  balance: number;
  onBalanceChange: (newBalance: number) => void;
  onBack: () => void;
}

type Choice = "rock" | "paper" | "scissors";
type Result = "win" | "lose" | "draw" | null;

// SVG hand emojis rendered as canvas-style SVGs
function HandIcon({ choice, size = 64, flip = false, glowing = false, dimmed = false, shaking = false }: {
  choice: Choice | null; size?: number; flip?: boolean; glowing?: boolean; dimmed?: boolean; shaking?: boolean;
}) {
  const emoji = choice === "rock" ? "✊" : choice === "paper" ? "✋" : choice === "scissors" ? "✌️" : "❓";
  const glow = glowing ? "drop-shadow(0 0 12px #ffd700) drop-shadow(0 0 24px #ffd70080)" : "";

  return (
    <div
      className={`flex items-center justify-center rounded-2xl transition-all duration-300 ${shaking ? "animate-bounce" : ""}`}
      style={{
        width: size, height: size,
        fontSize: size * 0.5,
        transform: flip ? "scaleX(-1)" : undefined,
        filter: dimmed ? "grayscale(1) brightness(0.4)" : glow || undefined,
        opacity: dimmed ? 0.5 : 1,
        background: glowing ? "rgba(255,215,0,0.12)" : "rgba(255,255,255,0.06)",
        border: `2px solid ${glowing ? "#ffd700" : "rgba(255,255,255,0.12)"}`,
        boxShadow: glowing ? "0 0 24px #ffd70060" : undefined,
      }}
    >
      {emoji}
    </div>
  );
}

// Flash overlay
function FlashOverlay({ active }: { active: boolean }) {
  if (!active) return null;
  return <div className="absolute inset-0 bg-white animate-ping rounded-2xl pointer-events-none" style={{ animationDuration: "300ms", animationIterationCount: 1, zIndex: 20 }} />;
}

const choiceList: { id: Choice; emoji: string; beats: Choice; label: string }[] = [
  { id: "rock", emoji: "✊", beats: "scissors", label: "Камень" },
  { id: "paper", emoji: "✋", beats: "rock", label: "Бумага" },
  { id: "scissors", emoji: "✌️", beats: "paper", label: "Ножницы" },
];

const getChoiceName = (id: Choice, t: (k: string) => string) => {
  switch (id) {
    case "rock": return t("rock");
    case "paper": return t("paper");
    case "scissors": return t("scissors");
  }
};

export function ScissorsGame({ balance, onBalanceChange, onBack }: ScissorsGameProps) {
  const gameConfig = gamesConfig.find((g) => g.id === "scissors")!;
  const { hapticFeedback, user, shareGameResult } = useTelegram();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { setCurrentGame } = useAudio();
  const { t } = useLanguage();

  const [playerChoice, setPlayerChoice] = useState<Choice | null>(null);
  const [computerChoice, setComputerChoice] = useState<Choice | null>(null);
  const [result, setResult] = useState<Result>(null);
  const [selectedChoice, setSelectedChoice] = useState<Choice | null>(null);
  const [history, setHistory] = useState<{ result: Result; playerChoice: Choice }[]>([]);
  const [isShaking, setIsShaking] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [arenaVisible, setArenaVisible] = useState(false);
  const [botShake, setBotShake] = useState(false);

  useEffect(() => { setCurrentGame("scissors"); }, [setCurrentGame]);

  const playMutation = useMutation({
    mutationFn: async ({ betAmount, choice }: { betAmount: number; choice: Choice }) => {
      setPlayerChoice(choice);
      setComputerChoice(null);
      setResult(null);
      setArenaVisible(true);
      setIsShaking(true);
      setBotShake(true);

      // Shake animation (raise/lower 3x)
      await new Promise(r => setTimeout(r, 900));
      setIsShaking(false);
      setBotShake(false);

      // Computer randomly cycles
      for (let i = 0; i < 8; i++) {
        await new Promise(r => setTimeout(r, 80));
        const opts: Choice[] = ["rock", "paper", "scissors"];
        setComputerChoice(opts[Math.floor(Math.random() * 3)]);
      }

      const response = await apiRequest("POST", "/api/games/scissors/play", {
        odejs: user?.id || "demo",
        amount: betAmount,
        choice,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setComputerChoice(data.computerChoice);
      setResult(data.result);

      // Flash clash effect
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 400);

      if (data.newBalance !== undefined) onBalanceChange(data.newBalance);
      setHistory(prev => [{ result: data.result, playerChoice: data.playerChoice }, ...prev.slice(0, 9)]);

      if (data.result === "win") {
        hapticFeedback("heavy");
        toast({ title: t("youWon"), description: `${formatCurrencyAmount(data.payout, "usd", true)} (2x)` });
      } else if (data.result === "draw") {
        hapticFeedback("medium");
        toast({ title: t("tie"), description: t("betReturned") });
      } else {
        hapticFeedback("rigid");
      }
      queryClient.invalidateQueries({ queryKey: ["/api/users/telegram"] });
    },
    onError: () => {
      setArenaVisible(false);
      toast({ title: t("error"), description: `${t("failedToPlay")}. ${t("tryAgain")}`, variant: "destructive" });
      queryClient.invalidateQueries({ queryKey: ["/api/users/telegram"] });
    },
  });

  const handlePlay = (betAmount: number) => {
    if (!selectedChoice || playMutation.isPending) return;
    hapticFeedback("medium");
    playMutation.mutate({ betAmount, choice: selectedChoice });
  };

  const resetGame = () => {
    setPlayerChoice(null);
    setComputerChoice(null);
    setResult(null);
    setSelectedChoice(null);
    setArenaVisible(false);
  };

  const isPending = playMutation.isPending;
  const bothRevealed = !!result && !!playerChoice && !!computerChoice;

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: "linear-gradient(160deg,#0d0015 0%,#1a0030 50%,#0a0010 100%)" }} data-testid="page-scissors-game">
      <GameHeader title={t("scissorsTitle")} balance={balance} onBack={onBack} gameType="scissors" schemaGameType="scissors" />

      <main className="flex-1 flex flex-col p-2 gap-2 overflow-hidden">
        {/* History */}
        <div className="flex gap-1.5 overflow-x-auto hide-scrollbar py-1 flex-shrink-0">
          {history.map((h, i) => (
            <span key={i} className={`px-2 py-1 rounded-lg text-xs font-bold whitespace-nowrap ${h.result === "win" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" : h.result === "lose" ? "bg-red-500/20 text-red-400 border border-red-500/40" : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/40"}`}>
              {h.result === "win" ? "WIN" : h.result === "lose" ? "LOSE" : "DRAW"}
            </span>
          ))}
          {history.length === 0 && <span className="text-sm text-white/30">{t("noHistory")}</span>}
        </div>

        {/* Battle arena */}
        <div className="flex-1 flex flex-col items-center justify-center gap-4 relative">
          {/* VS arena */}
          <div className="relative w-full max-w-xs">
            {/* Background neon ring */}
            <div className="absolute inset-0 rounded-3xl" style={{ background: "radial-gradient(ellipse at center, rgba(139,92,246,0.15) 0%, transparent 70%)", border: "1px solid rgba(139,92,246,0.2)" }} />

            <div className="relative flex items-center justify-between px-6 py-6">
              {/* Player hand */}
              <div className="flex flex-col items-center gap-2">
                <span className="text-xs text-white/40 font-bold tracking-widest uppercase">Вы</span>
                <div
                  style={{
                    transform: isShaking ? `translateY(${Date.now() % 200 < 100 ? -12 : 0}px)` : undefined,
                    transition: isShaking ? "none" : "transform 0.3s ease",
                    animation: isShaking ? "bounce 0.3s infinite" : undefined,
                  }}
                >
                  <HandIcon
                    choice={arenaVisible ? playerChoice : null}
                    size={72}
                    glowing={result === "win"}
                    dimmed={result === "lose"}
                    shaking={isShaking}
                  />
                </div>
              </div>

              {/* Center VS + Flash */}
              <div className="relative flex flex-col items-center">
                <FlashOverlay active={showFlash} />
                <span className="text-2xl font-black text-white/20">VS</span>
                {result && (
                  <div className={`mt-1 text-sm font-black px-3 py-1 rounded-full ${result === "win" ? "bg-emerald-500 text-white" : result === "lose" ? "bg-red-500 text-white" : "bg-yellow-500 text-black"}`}>
                    {result === "win" ? "WIN!" : result === "lose" ? "LOSE" : "DRAW"}
                  </div>
                )}
              </div>

              {/* Bot hand (flipped) */}
              <div className="flex flex-col items-center gap-2">
                <span className="text-xs text-white/40 font-bold tracking-widest uppercase">{t("bot")}</span>
                <HandIcon
                  choice={arenaVisible ? computerChoice : null}
                  size={72}
                  flip
                  glowing={result === "lose"}
                  dimmed={result === "win"}
                  shaking={botShake}
                />
              </div>
            </div>

            {/* Revealed names */}
            {bothRevealed && (
              <div className="flex justify-between px-6 pb-3 text-xs text-white/40">
                <span>{getChoiceName(playerChoice!, t)}</span>
                <span>{getChoiceName(computerChoice!, t)}</span>
              </div>
            )}
          </div>

          {/* Waiting shake instruction */}
          {isShaking && (
            <p className="text-white/40 text-sm animate-pulse">✊ Раз... два... три...</p>
          )}
        </div>

        {/* Controls */}
        <div className="flex-shrink-0 space-y-2">
          {!result && (
            <div className="rounded-2xl p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-xs text-white/40 mb-2 text-center uppercase tracking-widest">{t("chooseMove")} · 2x</p>
              <div className="flex justify-center gap-3">
                {choiceList.map((choice) => (
                  <button
                    key={choice.id}
                    onClick={() => { hapticFeedback("light"); setSelectedChoice(choice.id); }}
                    disabled={isPending}
                    data-testid={`button-${choice.id}`}
                    className="flex flex-col items-center gap-1 transition-all active:scale-95"
                    style={{
                      width: 72, height: 72,
                      borderRadius: 16,
                      fontSize: 28,
                      background: selectedChoice === choice.id ? "rgba(139,92,246,0.25)" : "rgba(255,255,255,0.04)",
                      border: `2px solid ${selectedChoice === choice.id ? "#8b5cf6" : "rgba(255,255,255,0.08)"}`,
                      boxShadow: selectedChoice === choice.id ? "0 0 16px rgba(139,92,246,0.4)" : undefined,
                    }}
                  >
                    <span>{choice.emoji}</span>
                    <span className="text-[9px] text-white/50">{choice.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {result ? (
            <div className="flex gap-2">
              <Button className="flex-1 h-12 font-bold text-base" style={{ background: "linear-gradient(135deg,#7c3aed,#8b5cf6)" }} onClick={resetGame} data-testid="button-play-again">
                {t("playAgain")}
              </Button>
              {result === "win" && (
                <Button variant="secondary" className="h-12 px-4 bg-white/5 border border-white/10" onClick={() => { hapticFeedback("light"); shareGameResult?.("I won at Rock Paper Scissors!"); }} data-testid="button-share">
                  <Share2 className="w-5 h-5" />
                </Button>
              )}
            </div>
          ) : (
            <BettingPanel balance={balance} minBet={gameConfig.minBet} maxBet={gameConfig.maxBet} onBet={handlePlay} isPlaying={isPending} buttonText={isPending ? t("playing") : t("play")} disabled={!selectedChoice} compact />
          )}
        </div>
      </main>
    </div>
  );
}
