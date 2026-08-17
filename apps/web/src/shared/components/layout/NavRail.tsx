import { NavLink, useLocation } from "react-router-dom";
import { ChartNoAxesColumn, LayoutDashboard, UserRound } from "lucide-react";

const destinations = [
  { path: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { path: "/analytics", label: "Analytics", icon: ChartNoAxesColumn },
  { path: "/profile", label: "Profile", icon: UserRound },
];

export function NavRail() {
  const { pathname } = useLocation();
  return (
    <nav className="workspace-nav" aria-label="Main navigation">
      <NavLink
        to="/dashboard"
        className="workspace-brand"
        aria-label="Fettl overview"
      >
        <img src="/icon-192x192.png" alt="" width="32" height="32" /> Fettl
      </NavLink>
      <div className="workspace-links">
        {destinations.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              isActive ||
              (path === "/dashboard" && pathname.startsWith("/groups/"))
                ? "selected"
                : ""
            }
          >
            <Icon size={18} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
