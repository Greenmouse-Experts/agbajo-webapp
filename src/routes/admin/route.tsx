import {
  createFileRoute,
  Link,
  Outlet,
  useRouterState,
} from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  UserCog,
  DollarSign,
  Wallet,
  ScrollText,
  MessageSquare,
  BarChart2,
  Settings,
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
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/groups", label: "Groups", icon: ScrollText },
  { to: "/admin/contributors", label: "Contributors", icon: Users },
  { to: "/admin/cluster-managers", label: "Cluster Managers", icon: UserCog },
  { to: "/admin/contributions", label: "Contributions", icon: DollarSign },
  { to: "/admin/payouts", label: "Payouts", icon: Wallet },
  { to: "/admin/complaints", label: "Complaints", icon: MessageSquare },
  { to: "/admin/reports", label: "Reports", icon: BarChart2 },
  { to: "/admin/policies", label: "Policies", icon: Settings },
];

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const [rawUser] = useAuth();
  const user = rawUser as AUTHRECORD | null;
  const { location } = useRouterState();
  const displayName = String(user?.user?.name ?? "Admin");
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="drawer lg:drawer-open min-h-screen">
      <input id="admin-drawer" type="checkbox" className="drawer-toggle" />

      <div className="drawer-content flex flex-col">
        <nav className="navbar bg-base-100 border-b border-base-200 sticky top-0 z-30 px-4">
          <div className="flex-none lg:hidden">
            <label htmlFor="admin-drawer" className="btn btn-ghost btn-square">
              <Menu className="w-5 h-5" />
            </label>
          </div>
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
                  <div className="bg-primary text-primary-content rounded-full w-8 text-base font-semibold">
                    <span>{initial}</span>
                  </div>
                </div>
                <span className="hidden sm:inline text-base font-medium">
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
                    <p className="text-sm text-base-content">
                      {String(user?.user?.email ?? "")}
                    </p>
                  </div>
                </li>
                <div className="divider my-1" />
                <li>
                  <button
                    onClick={logout}
                    className="text-error hover:bg-error"
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
          <div className=" mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      <div className="drawer-side z-40">
        <label
          htmlFor="admin-drawer"
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
              <span className="font-bold text-base text-base-content">
                Agbajo
              </span>
            </div>
            <label
              htmlFor="admin-drawer"
              className="btn btn-ghost btn-square btn-sm lg:hidden"
            >
              <X className="w-4 h-4" />
            </label>
          </div>

          <nav className="flex-1 p-3 overflow-y-auto">
            <ul className="menu menu-md gap-1 p-0 w-full">
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
            <span className="badge badge-error badge-outline">Admin</span>
          </div>
        </div>
      </div>
    </div>
  );
}
