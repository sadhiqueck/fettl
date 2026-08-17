import { Outlet } from "react-router-dom";
import { NavRail } from "./NavRail";

export function ChatAppLayout() {
  return (
    <div className="workspace">
      <a className="skip-link" href="#workspace-content">
        Skip to content
      </a>
      <NavRail />
      <main id="workspace-content" tabIndex={-1} className="workspace-content">
        <Outlet />
      </main>
    </div>
  );
}
