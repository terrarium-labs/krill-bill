import { Link, NavLink } from "react-router";
import { FilePlus2, Server } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/invoices", label: "Invoices" },
  { to: "/contacts", label: "Contacts" },
  { to: "/settings", label: "Company" },
] as const;

type Props = {
  apiOnline?: boolean;
};

export function AppHeader({ apiOnline = true }: Props) {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
              KB
            </div>
            <span className="font-semibold">Krill Bill</span>
          </Link>

          <nav className="hidden items-center gap-1 sm:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild size="sm">
            <Link to="/invoices/new">
              <FilePlus2 className="size-4" />
              <span className="hidden sm:inline">New invoice</span>
              <span className="sm:hidden">New</span>
            </Link>
          </Button>

          <div
            className="relative flex size-8 items-center justify-center"
            title={apiOnline ? "App ready" : "Offline mode"}
            aria-label={apiOnline ? "App ready" : "Offline mode"}
          >
            <Server className="size-4 text-muted-foreground" />
            <span
              className={cn(
                "absolute right-1 top-1 size-2 rounded-full ring-2 ring-background",
                apiOnline ? "bg-green-500" : "bg-yellow-500",
              )}
            />
          </div>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
