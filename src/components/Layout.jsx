import { NavLink, Outlet } from "react-router-dom";
import { Wallet, Repeat, Bot, Store, LogOut, Terminal, ShoppingBag } from "lucide-react";
import { base44 } from "@/api/base44Client";

const links = [
  { to: "/", label: "Wallet", icon: Wallet },
  { to: "/shop", label: "Shop", icon: ShoppingBag },
  { to: "/pool", label: "Pool", icon: Repeat },
  { to: "/market", label: "Exchange", icon: Store },
  { to: "/agents", label: "Agents", icon: Bot },
  { to: "/console", label: "Console", icon: Terminal },
];

export default function Layout() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="font-heading text-lg font-bold tracking-tight">
            Omega<span className="text-primary">Arbitrage</span>
          </div>
          <nav className="flex items-center gap-1">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors ${
                    isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </NavLink>
            ))}
            <button
              onClick={() => base44.auth.logout()}
              className="ml-2 rounded-full p-2 text-muted-foreground hover:text-foreground"
              aria-label="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </nav>
        </div>
      </header>
      <Outlet />
    </div>
  );
}