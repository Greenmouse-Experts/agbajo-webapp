import {
  createFileRoute,
  Link,
  Outlet,
  useRouterState,
} from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Folder,
  DollarSign,
  Wallet,
  Shield,
  MessageSquare,
  LogOut,
  Menu,
  Bell,
  X,
} from "lucide-react";
import { logout, useAuth, type AUTHRECORD } from "#/store/authStore";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

const navItems: NavItem[] = [
  {
    to: "/contributor",
    label: "Dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  { to: "/contributor/groups", label: "My Groups", icon: Folder },
  {
    to: "/contributor/contributions",
    label: "Contributions",
    icon: DollarSign,
  },
  { to: "/contributor/payouts", label: "Payouts", icon: Wallet },
  { to: "/contributor/wallet", label: "Wallet", icon: Wallet },
  { to: "/contributor/kyc", label: "KYC", icon: Shield },
  { to: "/contributor/complaints", label: "Complaints", icon: MessageSquare },
];

export const Route = createFileRoute("/contributor")({
  component: ContributorLayout,
});

function ContributorLayout() {
  const [rawUser] = useAuth();
  const user = rawUser as AUTHRECORD | null;
  const { location } = useRouterState();
  const displayName: string = String(
    (user as AUTHRECORD | null)?.user?.name ?? "User",
  );
  const initial: string = displayName.charAt(0).toUpperCase();

  return (
    <div className="drawer lg:drawer-open min-h-screen">
      <input
        id="contributor-drawer"
        type="checkbox"
        className="drawer-toggle"
      />

      <div className="drawer-content flex flex-col">
        <nav className="navbar bg-base-100 border-b border-base-200 sticky top-0 z-30 px-4">
          <div className="flex-none lg:hidden">
            <label
              htmlFor="contributor-drawer"
              className="btn btn-ghost btn-square"
            >
              <Menu className="w-5 h-5" />
            </label>
          </div>
          <div className="text-xl font-bold">Contributor</div>
          <div className="flex-1" />
          <div className="flex items-center gap-1">
            <button className="btn btn-ghost btn-square relative">
              <Bell className="w-5 h-5" />
              <span className="badge badge-error badge-xs absolute top-1.5 right-1.5 p-0 min-w-2 h-2" />
            </button>
            <div className="dropdown dropdown-end">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-ghost flex items-center gap-2 px-2"
              >
                <div className="avatar avatar-placeholder">
                  <div className="bg-primary text-primary-content rounded-full w-8 text-sm font-semibold">
                    <span>{initial}</span>
                  </div>
                </div>
                <span className="hidden sm:inline text-sm font-medium">
                  {displayName}
                </span>
              </div>
              <ul
                tabIndex={0}
                className="dropdown-content menu bg-base-100 rounded-box shadow-lg w-56 mt-2 z-50 p-2"
              >
                <li className="menu-title">
                  <div className="px-2 py-1">
                    <p className="font-medium text-base-content">
                      {displayName}
                    </p>
                    <p className="text-xs text-base-content/60">
                      {String((user as AUTHRECORD | null)?.user?.email ?? "")}
                    </p>
                  </div>
                </li>
                <div className="divider my-1" />
                <li>
                  <button
                    onClick={logout}
                    className="text-error hover:bg-error/10"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </nav>

        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      <div className="drawer-side z-40">
        <label
          htmlFor="contributor-drawer"
          aria-label="close sidebar"
          className="drawer-overlay"
        />
        <div className="bg-base-100 w-64 min-h-full flex flex-col border-r border-base-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-base-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 shadow-sm">
                <img
                  src="/agbajo-logo.jpeg"
                  alt="Agbajo"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-bold text-base text-base-content">Agbajo</span>
            </div>
            <label
              htmlFor="contributor-drawer"
              className="btn btn-ghost btn-square btn-sm lg:hidden"
            >
              <X className="w-4 h-4" />
            </label>
          </div>

          <nav className="flex-1 p-3">
            <ul className="menu menu-md gap-0.5 p-0 w-full">
              {navItems.map(({ to, label, icon: Icon, exact }) => {
                const isActive = exact
                  ? location.pathname === to
                  : location.pathname.startsWith(to);
                return (
                  <li key={to}>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <Link
                      to={to as any}
                      className={isActive ? "active font-medium" : ""}
                    >
                      <Icon className="w-5 h-5" />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="p-4 border-t border-base-200">
            <span className="badge badge-warning badge-outline">
              Contributor
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
