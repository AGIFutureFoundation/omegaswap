import { Suspense, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate, useOutlet } from "react-router-dom";
import { Wallet, Repeat, Bot, Store, LogOut, Terminal, ShoppingBag, ArrowLeft, Settings, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import PullToRefresh from "@/components/PullToRefresh";
import PageTransition from "@/components/PageTransition";
import Logo from "@/components/Logo";

// Bottom tabs. `also` = child routes that belong to a tab's history
const TABS = [
  { to: "/wallet", label: "Wallet", icon: Wallet, also: ["/settings"] },
  { to: "/shop", label: "Shop", icon: ShoppingBag },
  { to: "/pool", label: "Pool", icon: Repeat },
  { to: "/market", label: "Exchange", icon: Store },
  { to: "/console", label: "Console", icon: Terminal, also: ["/agents"] },
];
const DESKTOP_EXTRA = { to: "/agents", label: "Agents", icon: Bot };
const TITLES = { "/agents": "Agents", "/settings": "Settings" };

const owns = (tab, path) => path === tab.to || (tab.also || []).includes(path);
const iconBtn = "flex min-h-9 min-w-9 select-none items-center justify-center rounded-full text-muted-foreground hover:text-foreground";

export default function Layout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const outlet = useOutlet();
  const lastPath = useRef({}); // tab root -> last route visited inside that tab
  const scrollPos = useRef({}); // route -> scroll offset

  const isRoot = TABS.some((t) => t.to === pathname);
  const title = TITLES[pathname] || "";

  useEffect(() => {
    const tab = TABS.find((t) => owns(t, pathname));
    if (tab) lastPath.current[tab.to] = pathname;
    window.scrollTo(0, scrollPos.current[pathname] || 0);
    return () => { scrollPos.current[pathname] = window.scrollY; };
  }, [pathname]);

  const back = () => (window.history.length > 1 ? navigate(-1) : navigate("/wallet"));
  const tabTarget = (t) => (owns(t, pathname) ? t.to : lastPath.current[t.to] || t.to);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 select-none border-b border-border bg-background/80 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex h-12 max-w-5xl items-center justify-between px-4 md:h-auto md:py-3">
          <div className="flex items-center gap-2">
            {!isRoot && (
              <button onClick={back} aria-label="Go back" className={`${iconBtn} -ml-2 md:hidden`}>
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            {!isRoot && <div className="font-heading text-lg font-bold md:hidden">{title}</div>}
            <Logo className={isRoot ? "" : "hidden md:flex"} />
          </div>
          <nav className="flex items-center gap-1">
            <div className="hidden items-center gap-1 md:flex">
              {[...TABS, DESKTOP_EXTRA].map(({ to, label, icon: Icon }) => {
                const active = pathname === to || (TABS.find((t) => t.to === to)?.also || []).includes(pathname);
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`flex select-none items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors ${
                      active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" /> {label}
                  </Link>
                );
              })}
            </div>
            <Link to="/agents" aria-label="Agents" className={`${iconBtn} md:hidden`}><Bot className="h-5 w-5" /></Link>
            <Link to="/settings" aria-label="Settings" className={iconBtn}><Settings className="h-5 w-5" /></Link>
            <button onClick={() => base44.auth.logout()} aria-label="Log out" className={`${iconBtn} hidden md:flex`}>
              <LogOut className="h-4 w-4" />
            </button>
          </nav>
        </div>
      </header>

      <main className="pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
        <PullToRefresh>
          <PageTransition routeKey={pathname}>
            <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}>
              {outlet}
            </Suspense>
          </PageTransition>
        </PullToRefresh>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <div className="grid grid-cols-5">
          {TABS.map((t) => {
            const active = owns(t, pathname);
            return (
              <Link
                key={t.to}
                to={tabTarget(t)}
                className={`flex min-h-[44px] select-none flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <t.icon className="h-5 w-5" />
                {t.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}