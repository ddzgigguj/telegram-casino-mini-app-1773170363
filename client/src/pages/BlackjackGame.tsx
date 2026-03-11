import { useState, useCallback, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { GameHeader } from "@/components/GameHeader";
import { BettingPanel } from "@/components/BettingPanel";
import { useTelegram } from "@/components/TelegramProvider";
import { gamesConfig } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAudio } from "@/components/AudioProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { formatCurrencyAmount } from "@/components/CurrencyProvider";

interface BlackjackGameProps {
  balance: number;
  onBalanceChange: (newBalance: number) => void;
  onBack: () => void;
}

type Card = {
  suit: "hearts" | "diamonds" | "clubs" | "spades";
  value: string;
  numValue: number;
};

type GameState  = "betting" | "playing" | "dealer_turn" | "finished";
type GameResult = "win" | "lose" | "push" | "blackjack" | null;

const suits: Card["suit"][] = ["hearts", "diamonds", "clubs", "spades"];
const values = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];

const getSuitSymbol = (suit: Card["suit"]) => {
  switch (suit) {
    case "hearts":   return "♥";
    case "diamonds": return "♦";
    case "clubs":    return "♣";
    case "spades":   return "♠";
  }
};
const isRed = (suit: Card["suit"]) => suit === "hearts" || suit === "diamonds";

// Animated 3D card component
function PlayingCard({ card, hidden = false, index = 0, isNew = false, blackjack = false }: {
  card: Card; hidden?: boolean; index?: number; isNew?: boolean; blackjack?: boolean;
}) {
  const [flipped, setFlipped] = useState(!hidden);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isNew && !hidden) {
      setFlipped(false);
      const t = setTimeout(() => setFlipped(true), 150 + index * 120);
      return () => clearTimeout(t);
    }
  }, []);

  const overlap = index > 0 ? -18 : 0;

  return (
    <div
      style={{
        width: 56, height: 80, flexShrink: 0, marginLeft: overlap,
        perspective: 800,
        transform: mounted ? "translateY(0)" : "translateY(-60px)",
        opacity: mounted ? 1 : 0,
        transition: `transform 0.35s cubic-bezier(0.34,1.56,0.64,1) ${index * 80}ms, opacity 0.3s ease ${index * 80}ms`,
      }}
    >
      <div style={{
        width: "100%", height: "100%",
        position: "relative",
        transformStyle: "preserve-3d",
        transition: "transform 0.4s ease",
        transform: flipped ? "rotateY(0deg)" : "rotateY(90deg)",
        filter: blackjack ? "drop-shadow(0 0 10px #ffd700)" : undefined,
      }}>
        {/* Back */}
        <div style={{
          position: "absolute", inset: 0, backfaceVisibility: "hidden",
          transform: "rotateY(180deg)",
          background: "linear-gradient(135deg,#312e81,#4c1d95)",
          borderRadius: 8, border: "1.5px solid #6d28d9",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{ width: "80%", height: "80%", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 4, background: "repeating-linear-gradient(45deg,rgba(255,255,255,0.05) 0,rgba(255,255,255,0.05) 2px,transparent 2px,transparent 8px)" }} />
        </div>

        {/* Front */}
        <div style={{
          position: "absolute", inset: 0, backfaceVisibility: "hidden",
          background: hidden ? "linear-gradient(135deg,#312e81,#4c1d95)" : "#fff",
          borderRadius: 8,
          border: blackjack ? "2px solid #ffd700" : "1.5px solid rgba(0,0,0,0.15)",
          boxShadow: blackjack ? "0 0 12px #ffd70080, 0 4px 12px rgba(0,0,0,0.4)" : "0 4px 12px rgba(0,0,0,0.4)",
          display: "flex", flexDirection: "column", justifyContent: "space-between",
          padding: "4px 5px", overflow: "hidden",
        }}>
          {hidden ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#a78bfa", fontSize: 22, fontWeight: 900 }}>?</div>
          ) : (
            <>
              <div style={{ lineHeight: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: isRed(card.suit) ? "#dc2626" : "#111" }}>{card.value}</div>
                <div style={{ fontSize: 10, color: isRed(card.suit) ? "#dc2626" : "#111" }}>{getSuitSymbol(card.suit)}</div>
              </div>
              <div style={{ fontSize: 20, textAlign: "center", color: isRed(card.suit) ? "#dc2626" : "#111" }}>{getSuitSymbol(card.suit)}</div>
              <div style={{ lineHeight: 1, transform: "rotate(180deg)" }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: isRed(card.suit) ? "#dc2626" : "#111" }}>{card.value}</div>
                <div style={{ fontSize: 10, color: isRed(card.suit) ? "#dc2626" : "#111" }}>{getSuitSymbol(card.suit)}</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Score badge
function ScoreBadge({ total, bust }: { total: number; bust: boolean }) {
  return (
    <div style={{
      padding: "2px 10px", borderRadius: 20,
      background: bust ? "#7f1d1d" : total === 21 ? "#ffd70020" : "rgba(0,0,0,0.6)",
      border: `1px solid ${bust ? "#ef4444" : total === 21 ? "#ffd700" : "rgba(255,255,255,0.2)"}`,
      color: bust ? "#ef4444" : total === 21 ? "#ffd700" : "#fff",
      fontSize: 13, fontWeight: 900,
      boxShadow: bust ? "0 0 8px #ef444440" : total === 21 ? "0 0 10px #ffd70040" : undefined,
    }}>
      {bust ? "BUST!" : total}
    </div>
  );
}

// Casino chip button
function ChipButton({ label, onClick, disabled, variant = "default" }: {
  label: string; onClick: () => void; disabled?: boolean; variant?: "hit"|"stand"|"double"|"default";
}) {
  const colors = {
    hit:    { bg: "linear-gradient(135deg,#059669,#10b981)", border: "#10b981", shadow: "#10b98160" },
    stand:  { bg: "linear-gradient(135deg,#dc2626,#ef4444)", border: "#ef4444", shadow: "#ef444460" },
    double: { bg: "linear-gradient(135deg,#d97706,#f59e0b)", border: "#f59e0b", shadow: "#f59e0b60" },
    default:{ bg: "linear-gradient(135deg,#4c1d95,#7c3aed)", border: "#8b5cf6", shadow: "#8b5cf660" },
  }[variant];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="active:scale-95 transition-transform disabled:opacity-30"
      style={{
        flex: 1, height: 44, borderRadius: 12, border: `1.5px solid ${colors.border}`,
        background: colors.bg, color: "#fff", fontWeight: 900, fontSize: 14,
        boxShadow: `0 0 14px ${colors.shadow}, 0 4px 10px rgba(0,0,0,0.4)`,
        cursor: disabled ? "not-allowed" : "pointer",
        letterSpacing: "0.05em",
      }}
    >
      {label}
    </button>
  );
}

export function BlackjackGame({ balance, onBalanceChange, onBack }: BlackjackGameProps) {
  const gameConfig = gamesConfig.find((g) => g.id === "blackjack")!;
  const { hapticFeedback, user } = useTelegram();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { setCurrentGame, playSound } = useAudio();
  const { t } = useLanguage();

  const [gameState, setGameState]         = useState<GameState>("betting");
  const [playerHand, setPlayerHand]       = useState<Card[]>([]);
  const [dealerHand, setDealerHand]       = useState<Card[]>([]);
  const [betAmount, setBetAmount]         = useState(0);
  const [result, setResult]               = useState<GameResult>(null);
  const [deck, setDeck]                   = useState<Card[]>([]);
  const [showDealerCard, setShowDealerCard] = useState(false);
  const [history, setHistory]             = useState<{ result: GameResult; payout: number }[]>([]);
  const [newCardIdx, setNewCardIdx]       = useState(-1);

  useEffect(() => { setCurrentGame("blackjack"); }, [setCurrentGame]);

  const createDeck = useCallback((): Card[] => {
    const d: Card[] = [];
    for (const suit of suits) {
      for (let i = 0; i < values.length; i++) {
        const v = values[i];
        let n = i + 1;
        if (v === "A") n = 11;
        else if (["J","Q","K"].includes(v)) n = 10;
        d.push({ suit, value: v, numValue: n });
      }
    }
    for (let i = d.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [d[i], d[j]] = [d[j], d[i]];
    }
    return d;
  }, []);

  const calculateHand = useCallback((hand: Card[]): number => {
    let total = 0, aces = 0;
    for (const c of hand) { total += c.numValue; if (c.value === "A") aces++; }
    while (total > 21 && aces > 0) { total -= 10; aces--; }
    return total;
  }, []);

  const drawCard = useCallback((d: Card[]): [Card, Card[]] => [d[0], d.slice(1)], []);

  const finishMutation = useMutation({
    mutationFn: async ({ bet, result, multiplier }: { bet: number; result: string; multiplier: number }) => {
      const r = await apiRequest("POST", "/api/games/blackjack/finish", { odejs: user?.id || "demo", betAmount: bet, result, multiplier, currency: "usd" });
      return r.json();
    },
    onSuccess: (data) => {
      if (data.newBalance !== undefined) onBalanceChange(data.newBalance);
      const gr = data.isWin ? (data.payout > betAmount * 2 ? "blackjack" : "win") : data.isPush ? "push" : "lose";
      setHistory(prev => [{ result: gr as GameResult, payout: data.payout }, ...prev.slice(0, 9)]);
      if (data.isWin) {
        hapticFeedback("heavy");
        toast({ title: t("youWon"), description: formatCurrencyAmount(data.payout, "usd", true) });
      } else if (data.isPush) {
        toast({ title: t("tie"), description: t("betReturned") });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/users/telegram"] });
    },
    onError: () => queryClient.invalidateQueries({ queryKey: ["/api/users/telegram"] }),
  });

  const startMutation = useMutation({
    mutationFn: async (amount: number) => {
      const r = await apiRequest("POST", "/api/games/blackjack/start", { odejs: user?.id || "demo", amount, currency: "usd" });
      return r.json();
    },
    onSuccess: async (data, amount) => {
      setBetAmount(amount);
      if (data.newBalance !== undefined) onBalanceChange(data.newBalance);

      const nd = createDeck();
      let cd = nd;
      const [p1, d1] = drawCard(cd); cd = d1;
      const [dl1, d2] = drawCard(cd); cd = d2;
      const [p2, d3] = drawCard(cd); cd = d3;
      const [dl2, d4] = drawCard(cd); cd = d4;

      // Deal cards with stagger
      setPlayerHand([]);
      setDealerHand([]);
      await new Promise(r => setTimeout(r, 50));
      setPlayerHand([p1]);
      setNewCardIdx(0);
      hapticFeedback("medium");
      await new Promise(r => setTimeout(r, 180));
      setDealerHand([dl1]);
      await new Promise(r => setTimeout(r, 180));
      setPlayerHand([p1, p2]);
      setNewCardIdx(1);
      await new Promise(r => setTimeout(r, 180));
      setDealerHand([dl1, dl2]);
      await new Promise(r => setTimeout(r, 200));

      setDeck(cd);
      setShowDealerCard(false);
      setResult(null);
      hapticFeedback("medium");

      const pt = calculateHand([p1, p2]);
      const dt = calculateHand([dl1, dl2]);

      if (pt === 21) {
        setShowDealerCard(true);
        if (dt === 21) {
          setResult("push"); setGameState("finished");
          finishMutation.mutate({ bet: amount, result: "push", multiplier: 1 });
        } else {
          setResult("blackjack"); setGameState("finished");
          finishMutation.mutate({ bet: amount, result: "blackjack", multiplier: 2.5 });
        }
      } else {
        setGameState("playing");
      }
    },
    onError: () => {
      toast({ title: t("error"), description: `${t("failedToStart")}. ${t("tryAgain")}`, variant: "destructive" });
      queryClient.invalidateQueries({ queryKey: ["/api/users/telegram"] });
    },
  });

  const hit = async () => {
    if (gameState !== "playing") return;
    hapticFeedback("light");
    const [card, nd] = drawCard(deck);
    const newHand = [...playerHand, card];
    setNewCardIdx(newHand.length - 1);
    setPlayerHand(newHand);
    setDeck(nd);
    const total = calculateHand(newHand);
    if (total > 21) {
      setShowDealerCard(true); setResult("lose"); setGameState("finished");
      hapticFeedback("heavy");
      finishMutation.mutate({ bet: betAmount, result: "lose", multiplier: 0 });
    }
  };

  const stand = async () => {
    if (gameState !== "playing") return;
    hapticFeedback("medium");
    setShowDealerCard(true);
    setGameState("dealer_turn");

    let cdh = [...dealerHand];
    let cd = deck;
    while (calculateHand(cdh) < 17) {
      await new Promise(r => setTimeout(r, 600));
      const [card, nd] = drawCard(cd);
      cdh = [...cdh, card]; cd = nd;
      setDealerHand([...cdh]); setDeck(cd);
      hapticFeedback("light");
    }

    const pt = calculateHand(playerHand);
    const dt = calculateHand(cdh);
    let gr: GameResult; let mult: number;
    if (dt > 21)        { gr = "win";  mult = 2; }
    else if (pt > dt)   { gr = "win";  mult = 2; }
    else if (pt < dt)   { gr = "lose"; mult = 0; }
    else                { gr = "push"; mult = 1; }

    setResult(gr); setGameState("finished");
    finishMutation.mutate({ bet: betAmount, result: gr!, multiplier: mult });
  };

  const doubleDown = async () => {
    if (gameState !== "playing" || playerHand.length !== 2 || balance < betAmount) {
      if (balance < betAmount) toast({ title: t("insufficientFunds"), description: t("cannotDouble"), variant: "destructive" });
      return;
    }
    hapticFeedback("medium");
    try {
      const r = await apiRequest("POST", "/api/games/blackjack/start", { odejs: user?.id || "demo", amount: betAmount, currency: "usd" });
      const data = await r.json();
      if (data.newBalance !== undefined) onBalanceChange(data.newBalance);
      const nb = betAmount * 2; setBetAmount(nb);
      const [card, nd] = drawCard(deck);
      const nh = [...playerHand, card];
      setNewCardIdx(nh.length - 1);
      setPlayerHand(nh); setDeck(nd);
      const total = calculateHand(nh);
      if (total > 21) {
        setShowDealerCard(true); setResult("lose"); setGameState("finished"); hapticFeedback("heavy");
        finishMutation.mutate({ bet: nb, result: "lose", multiplier: 0 });
      } else {
        setShowDealerCard(true); setGameState("dealer_turn");
        let cdh = [...dealerHand]; let cd = nd;
        while (calculateHand(cdh) < 17) {
          await new Promise(r => setTimeout(r, 600));
          const [dc, dd] = drawCard(cd);
          cdh = [...cdh, dc]; cd = dd;
          setDealerHand([...cdh]); setDeck(cd); hapticFeedback("light");
        }
        const pt = calculateHand(nh); const dt = calculateHand(cdh);
        let gr: GameResult; let mult: number;
        if (dt > 21)      { gr = "win";  mult = 2; }
        else if (pt > dt) { gr = "win";  mult = 2; }
        else if (pt < dt) { gr = "lose"; mult = 0; }
        else              { gr = "push"; mult = 1; }
        setResult(gr); setGameState("finished");
        finishMutation.mutate({ bet: nb, result: gr!, multiplier: mult });
      }
    } catch {
      toast({ title: t("error"), description: t("failedToDouble"), variant: "destructive" });
    }
  };

  const resetGame = () => {
    setGameState("betting"); setPlayerHand([]); setDealerHand([]);
    setBetAmount(0); setResult(null); setShowDealerCard(false); setDeck([]);
  };

  const playerTotal = calculateHand(playerHand);
  const dealerTotal = showDealerCard ? calculateHand(dealerHand) : (dealerHand[0] ? calculateHand([dealerHand[0]]) : 0);
  const isBlackjack  = result === "blackjack";
  const isBust       = playerTotal > 21;

  const historyBadge = (h: { result: GameResult; payout: number }) => {
    if (h.result === "win" || h.result === "blackjack") return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40";
    if (h.result === "lose") return "bg-red-500/20 text-red-400 border border-red-500/40";
    return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/40";
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: "radial-gradient(ellipse at top, #064e3b 0%, #022c22 50%, #011a15 100%)" }} data-testid="page-blackjack-game">
      <GameHeader title={t("blackjackTitle")} balance={balance} onBack={onBack} gameType="blackjack" schemaGameType="blackjack" />

      {/* Felt table surface texture */}
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "repeating-linear-gradient(45deg,rgba(255,255,255,0.01) 0,rgba(255,255,255,0.01) 1px,transparent 1px,transparent 8px)", zIndex: 0 }} />

      <main className="flex-1 flex flex-col p-2 gap-2 overflow-hidden relative z-10">
        {/* History */}
        <div className="flex gap-1.5 overflow-x-auto hide-scrollbar py-1 flex-shrink-0">
          {history.map((h, i) => (
            <span key={i} className={`px-2 py-1 rounded-lg text-xs font-bold whitespace-nowrap ${historyBadge(h)}`}>
              {h.result === "win" ? "WIN" : h.result === "blackjack" ? "BJ!" : h.result === "lose" ? "LOSE" : "PUSH"}
            </span>
          ))}
          {history.length === 0 && <span className="text-sm text-white/30">{t("noHistory")}</span>}
        </div>

        {/* Game table */}
        <div className="flex-1 flex flex-col justify-between gap-2 min-h-0">

          {/* Dealer area */}
          <div className="rounded-2xl p-3" style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,215,0,0.15)", backdropFilter: "blur(8px)" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-white/40 uppercase tracking-widest font-bold">Дилер</span>
              <ScoreBadge total={dealerTotal} bust={showDealerCard && dealerTotal > 21} />
            </div>
            <div className="flex gap-0 min-h-[88px] items-center">
              {dealerHand.map((card, i) => (
                <PlayingCard
                  key={`d-${i}-${card.suit}-${card.value}`}
                  card={card}
                  hidden={i === 1 && !showDealerCard}
                  index={i}
                  isNew={true}
                />
              ))}
              {dealerHand.length === 0 && (
                <div style={{ width: 56, height: 80, border: "1.5px dashed rgba(255,255,255,0.1)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span className="text-white/20 text-2xl">?</span>
                </div>
              )}
            </div>
          </div>

          {/* Result banner */}
          {result && (
            <div className={`text-center py-2 rounded-2xl font-black text-xl tracking-widest ${
              result === "blackjack" ? "text-yellow-300" :
              result === "win" ? "text-emerald-400" :
              result === "lose" ? "text-red-400" : "text-yellow-400"
            }`}
            style={{
              background: result === "blackjack" ? "rgba(255,215,0,0.1)" : result === "win" ? "rgba(16,185,129,0.1)" : result === "lose" ? "rgba(239,68,68,0.1)" : "rgba(234,179,8,0.1)",
              border: `1px solid ${result === "blackjack" ? "#ffd70040" : result === "win" ? "#10b98140" : result === "lose" ? "#ef444440" : "#eab30840"}`,
              boxShadow: result === "blackjack" ? "0 0 24px #ffd70030" : undefined,
            }}>
              {result === "blackjack" ? "✨ BLACKJACK! ✨" : result === "win" ? "🏆 ПОБЕДА!" : result === "lose" ? "💸 ПРОИГРЫШ" : "🤝 НИЧЬЯ"}
            </div>
          )}

          {/* Player area */}
          <div className={`rounded-2xl p-3 transition-all ${isBlackjack ? "ring-2 ring-yellow-400/60" : ""}`}
            style={{
              background: "rgba(0,0,0,0.35)", border: `1px solid ${isBlackjack ? "rgba(255,215,0,0.5)" : "rgba(255,255,255,0.08)"}`,
              backdropFilter: "blur(8px)",
              boxShadow: isBlackjack ? "0 0 30px rgba(255,215,0,0.2)" : undefined,
            }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-white/40 uppercase tracking-widest font-bold">Вы</span>
              {playerHand.length > 0 && <ScoreBadge total={playerTotal} bust={isBust} />}
            </div>
            <div className="flex gap-0 min-h-[88px] items-center">
              {playerHand.map((card, i) => (
                <PlayingCard
                  key={`p-${i}-${card.suit}-${card.value}`}
                  card={card}
                  index={i}
                  isNew={true}
                  blackjack={isBlackjack}
                />
              ))}
              {playerHand.length === 0 && (
                <div style={{ width: 56, height: 80, border: "1.5px dashed rgba(255,255,255,0.1)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span className="text-white/20 text-2xl">🃏</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex-shrink-0 space-y-2">
          {/* Bet stake indicator */}
          {betAmount > 0 && gameState !== "betting" && (
            <div className="flex items-center justify-center gap-2">
              <span className="text-white/40 text-xs">Ставка:</span>
              <span className="text-yellow-400 font-bold text-sm">${betAmount.toFixed(2)}</span>
            </div>
          )}

          {gameState === "playing" && (
            <div className="flex gap-2">
              <ChipButton label="ЕЩЁ" variant="hit" onClick={hit} />
              <ChipButton label="СТОП" variant="stand" onClick={stand} />
              {playerHand.length === 2 && balance >= betAmount && (
                <ChipButton label="x2" variant="double" onClick={doubleDown} />
              )}
            </div>
          )}

          {gameState === "finished" && (
            <button
              onClick={resetGame}
              className="w-full h-12 rounded-xl font-black text-white text-base active:scale-95 transition-transform"
              style={{ background: "linear-gradient(135deg,#065f46,#059669)", border: "1px solid #10b981", boxShadow: "0 0 18px rgba(16,185,129,0.4)" }}
            >
              {t("playAgain")}
            </button>
          )}

          {gameState === "betting" && (
            <BettingPanel balance={balance} minBet={gameConfig.minBet} maxBet={gameConfig.maxBet} onBet={(a) => startMutation.mutate(a)} isPlaying={startMutation.isPending} buttonText={startMutation.isPending ? t("dealing") : t("deal")} compact />
          )}
        </div>
      </main>
    </div>
  );
}
