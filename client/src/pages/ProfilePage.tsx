import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTelegram } from "@/components/TelegramProvider";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Copy, Users, Gift, Share2, Settings, Shield, LogOut, UserCircle, Crown, Star, Diamond, Sparkles } from "lucide-react";
import { BalanceDisplay } from "@/components/BalanceDisplay";
import { useLanguage, LanguageToggle } from "@/components/LanguageProvider";
import { TierBadge } from "@/components/VipChat";

interface ProfilePageProps {
  balance: number;
  onBack: () => void;
  onOpenAdmin?: () => void;
  onOpenWallet?: () => void;
}

export function ProfilePage({ balance, onBack, onOpenAdmin, onOpenWallet }: ProfilePageProps) {
  const { user, hapticFeedback, shareGameResult, telegramUser, isTelegram, switchDevAccount } = useTelegram();
  const isAdmin = telegramUser?.username === "Nahalist" || user?.isAdmin;
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const [referralInput, setReferralInput] = useState("");
  const [devUsername, setDevUsername] = useState("");

  const { data: referralStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/users", user?.id, "referral-stats"],
    queryFn: async () => {
      if (!user?.id) return null;
      const response = await fetch(`/api/users/${user.id}/referral-stats`);
      return response.json();
    },
    enabled: !!user?.id,
  });

  const generateCodeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/users/${user?.id}/referral-code`, {});
      return response.json();
    },
    onSuccess: (data) => {
      hapticFeedback("medium");
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "referral-stats"] });
      toast({
        title: language === "ru" ? "Код создан" : "Code Created",
        description: language === "ru" ? `Ваш код: ${data.referralCode}` : `Your code: ${data.referralCode}`,
      });
    },
  });

  const applyCodeMutation = useMutation({
    mutationFn: async (referralCode: string) => {
      const response = await apiRequest("POST", `/api/users/${user?.id}/apply-referral`, {
        referralCode,
      });
      return response.json();
    },
    onSuccess: (data) => {
      hapticFeedback("heavy");
      queryClient.invalidateQueries({ queryKey: ["/api/users/telegram"] });
      toast({
        title: language === "ru" ? "Бонус получен!" : "Bonus received!",
        description: data.message,
      });
      setReferralInput("");
    },
    onError: (error: any) => {
      toast({
        title: language === "ru" ? "Ошибка" : "Error",
        description: error.message || (language === "ru" ? "Неверный реферальный код" : "Invalid referral code"),
        variant: "destructive",
      });
    },
  });

  const copyReferralCode = () => {
    if (referralStats?.referralCode) {
      navigator.clipboard.writeText(referralStats.referralCode);
      hapticFeedback("light");
      toast({
        title: language === "ru" ? "Скопировано!" : "Copied!",
        description: language === "ru" ? "Реферальный код скопирован" : "Referral code copied",
      });
    }
  };

  const shareReferralLink = () => {
    if (referralStats?.referralCode) {
      hapticFeedback("medium");
      // Create a direct Telegram bot link with start parameter
      const botUsername = "gomoneygod_bot";
      const refLink = `https://t.me/${botUsername}?start=ref_${referralStats.referralCode}`;
      const message = language === "ru" 
        ? `🎰 Присоединяйся в GRAND STAKE!\n\n💰 Получи $5 бонус по моей ссылке:\n${refLink}`
        : `🎰 Join GRAND STAKE!\n\n💰 Get $5 bonus using my link:\n${refLink}`;
      shareGameResult(message);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" data-testid="page-profile">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                hapticFeedback("light");
                onBack();
              }}
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold text-foreground">
              {language === "ru" ? "Профиль" : "Profile"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <BalanceDisplay 
              balance={balance} 
              onClick={() => {
                hapticFeedback("light");
                onOpenWallet?.();
              }}
            />
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-4">
        {/* User Info Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {telegramUser?.first_name?.[0] || "U"}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-xl">
                    {telegramUser?.first_name} {telegramUser?.last_name}
                  </CardTitle>
                  {user?.vipTier && <TierBadge tier={user.vipTier} size="sm" />}
                </div>
                <CardDescription>@{telegramUser?.username || "user"}</CardDescription>
              </div>
            </div>
          </CardHeader>
          {/* VIP Status Section */}
          {user?.isVip ? (
            <CardContent className="pt-0">
              <div className="bg-gradient-to-r from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Crown className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium text-amber-500">VIP {language === "ru" ? "Статус" : "Status"}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {language === "ru" 
                    ? `Всего депозитов: $${(user.totalDeposited || 0).toFixed(2)}` 
                    : `Total deposits: $${(user.totalDeposited || 0).toFixed(2)}`}
                </p>
              </div>
            </CardContent>
          ) : (
            <CardContent className="pt-0">
              <div className="bg-muted/50 border border-border rounded-xl p-3">
                <p className="text-sm text-muted-foreground mb-2">
                  {language === "ru" 
                    ? "Станьте VIP и получите доступ к чату!" 
                    : "Become VIP to get chat access!"}
                </p>
                <div className="space-y-1 text-xs">
                  <p className="text-amber-400 flex items-center gap-1">
                    <Star className="w-3 h-3" /> Gold: $30+
                  </p>
                  <p className="text-cyan-400 flex items-center gap-1">
                    <Diamond className="w-3 h-3" /> Diamond: $100+
                  </p>
                  <p className="text-purple-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> God of Win: $1000+
                  </p>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Admin Panel Link - only for @nahalist */}
        {isAdmin && onOpenAdmin && (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="pt-4">
              <Button
                className="w-full"
                variant="default"
                onClick={() => {
                  hapticFeedback("medium");
                  onOpenAdmin();
                }}
                data-testid="button-admin-panel"
              >
                <Shield className="w-5 h-5 mr-2" />
                {language === "ru" ? "Админ-панель" : "Admin Panel"}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                {language === "ru" ? "Управление казино, пользователями и настройками" : "Manage casino, users and settings"}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Dev Mode: Switch Account - only visible in dev mode (not in Telegram) */}
        {!isTelegram && (
          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserCircle className="w-5 h-5 text-yellow-500" />
                {language === "ru" ? "Dev Mode: Сменить аккаунт" : "Dev Mode: Switch Account"}
              </CardTitle>
              <CardDescription>
                {language === "ru" 
                  ? "Войти под другим Telegram username для тестирования" 
                  : "Login with different Telegram username for testing"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="@username"
                  value={devUsername}
                  onChange={(e) => setDevUsername(e.target.value)}
                  className="flex-1"
                  data-testid="input-dev-username"
                />
                <Button
                  onClick={() => {
                    if (devUsername.trim()) {
                      switchDevAccount(devUsername);
                      toast({
                        title: language === "ru" ? "Аккаунт изменён" : "Account changed",
                        description: language === "ru" 
                          ? `Теперь вы вошли как @${devUsername.replace("@", "")}` 
                          : `Now logged in as @${devUsername.replace("@", "")}`,
                      });
                      setDevUsername("");
                      onBack();
                    }
                  }}
                  disabled={!devUsername.trim()}
                  data-testid="button-switch-account"
                >
                  {language === "ru" ? "Войти" : "Login"}
                </Button>
              </div>
              
              {telegramUser?.username !== "Nahalist" && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    switchDevAccount("");
                    toast({
                      title: language === "ru" ? "Вернулись к админу" : "Returned to admin",
                      description: language === "ru" 
                        ? "Теперь вы вошли как @Nahalist" 
                        : "Now logged in as @Nahalist",
                    });
                    onBack();
                  }}
                  data-testid="button-switch-to-admin"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  {language === "ru" ? "Вернуться к @Nahalist (Admin)" : "Return to @Nahalist (Admin)"}
                </Button>
              )}
              
              <p className="text-xs text-yellow-600 dark:text-yellow-400">
                {language === "ru" 
                  ? "Этот раздел виден только в режиме разработки. В Telegram будет использоваться реальный аккаунт." 
                  : "This section is only visible in dev mode. Telegram will use your real account."}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Referral Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              {language === "ru" ? "Реферальная программа" : "Referral Program"}
            </CardTitle>
            <CardDescription>
              {language === "ru" ? "Приглашай друзей и получай $5 + 15% с их проигрышей" : "Invite friends and earn $5 + 15% from their losses"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-foreground">
                  {referralStats?.referralCount || 0}
                </p>
                <p className="text-sm text-muted-foreground">
                  {language === "ru" ? "Приглашено" : "Friends Invited"}
                </p>
              </div>
              <div className="bg-muted/50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-primary">
                  ${referralStats?.totalEarned || 0}
                </p>
                <p className="text-sm text-muted-foreground">
                  {language === "ru" ? "Заработано" : "Total Earned"}
                </p>
              </div>
            </div>

            {/* Your Referral Code */}
            {referralStats?.referralCode ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {language === "ru" ? "Ваш реферальный код" : "Your Referral Code"}
                </p>
                <div className="flex gap-2">
                  <div className="flex-1 bg-muted rounded-lg px-4 py-3 font-mono text-foreground">
                    {referralStats.referralCode}
                  </div>
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={copyReferralCode}
                    data-testid="button-copy-code"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={shareReferralLink}
                    data-testid="button-share-code"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                className="w-full"
                onClick={() => generateCodeMutation.mutate()}
                disabled={generateCodeMutation.isPending}
                data-testid="button-generate-code"
              >
                {generateCodeMutation.isPending 
                  ? (language === "ru" ? "Генерация..." : "Generating...") 
                  : (language === "ru" ? "Создать реферальный код" : "Generate Referral Code")}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Apply Referral Code */}
        {!user?.referredBy && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-primary" />
                {language === "ru" ? "Есть реферальный код?" : "Have a Referral Code?"}
              </CardTitle>
              <CardDescription>
                {language === "ru" ? "Введите код друга и получите $5 бонус" : "Enter a friend's code to receive $5 bonus"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder={language === "ru" ? "Введите код" : "Enter referral code"}
                value={referralInput}
                onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
                data-testid="input-referral-code"
              />
              <Button
                className="w-full"
                onClick={() => applyCodeMutation.mutate(referralInput)}
                disabled={!referralInput || applyCodeMutation.isPending}
                data-testid="button-apply-code"
              >
                {applyCodeMutation.isPending 
                  ? (language === "ru" ? "Применяется..." : "Applying...") 
                  : (language === "ru" ? "Применить код" : "Apply Code")}
              </Button>
            </CardContent>
          </Card>
        )}
        
        {/* Account Actions */}
        <Card className="border-red-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <LogOut className="w-5 h-5 text-red-400" />
              {language === "ru" ? "Аккаунт" : "Account"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-400"
              onClick={() => {
                hapticFeedback("medium");
                if (isTelegram) {
                  const tg = (window as any).Telegram?.WebApp;
                  if (tg?.close) {
                    toast({
                      title: language === "ru" ? "Выход" : "Logging out",
                      description: language === "ru" 
                        ? "Приложение будет закрыто. Откройте заново для смены аккаунта." 
                        : "App will close. Reopen to switch accounts.",
                    });
                    setTimeout(() => tg.close(), 1500);
                  }
                } else {
                  window.location.reload();
                }
              }}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {language === "ru" ? "Выйти / Сменить аккаунт" : "Logout / Switch Account"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              {language === "ru" 
                ? "Для смены аккаунта закройте приложение и войдите с другого Telegram аккаунта" 
                : "To switch accounts, close the app and open with a different Telegram account"}
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
