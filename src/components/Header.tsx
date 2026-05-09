import { Link, useLocation } from "@tanstack/react-router";
import { Leaf } from "lucide-react";
import { useEffect, useState } from "react";

const links = [
  { to: "/", label: "Home" },
  { to: "/profile", label: "Profile" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/advisor", label: "Advisor" },
  { to: "/local-actions", label: "Local Actions" },
  { to: "/company", label: "Company" },
] as const;

type OrganizationWorkspace = {
  organizationName: string;
  workspaceCode: string;
};

export function Header() {
  const loc = useLocation();
  const [workspace, setWorkspace] = useState<OrganizationWorkspace | null>(null);

  useEffect(() => {
    const readWorkspace = () => {
      try {
        const raw = localStorage.getItem("carbon-twin-workspace");
        setWorkspace(raw ? (JSON.parse(raw) as OrganizationWorkspace) : null);
      } catch {
        setWorkspace(null);
      }
    };

    readWorkspace();
    window.addEventListener("storage", readWorkspace);
    window.addEventListener("focus", readWorkspace);
    window.addEventListener("carbon-twin-workspace-change", readWorkspace);
    return () => {
      window.removeEventListener("storage", readWorkspace);
      window.removeEventListener("focus", readWorkspace);
      window.removeEventListener("carbon-twin-workspace-change", readWorkspace);
    };
  }, [loc.pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-card/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Leaf className="h-4 w-4" />
          </span>
          Carbon Twin
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {workspace ? (
            <span className="mr-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-primary">
              {workspace.organizationName}
            </span>
          ) : null}
          {links.map((l) => {
            const active = loc.pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <Link
          to="/profile"
          className="rounded-full bg-foreground px-4 py-1.5 text-sm font-medium text-background hover:opacity-90 md:hidden"
        >
          Start
        </Link>
      </div>
    </header>
  );
}
