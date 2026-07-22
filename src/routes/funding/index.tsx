import apiClient, { type ApiResponse } from "#/api/simpleApi.ts";
import { formatCurrency } from "#/helpers/currency.ts";
import PageLoader from "#/components/layout/PageLoader.tsx";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  PiggyBank,
  ShieldCheck,
  Settings2,
  Landmark,
  DollarSign,
  Coins,
  Gem,
  RefreshCw,
  Calendar,
  Mail,
  Phone,
  Globe,
  ArrowUp,
  Check,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/funding/")({
  component: RouteComponent,
});

// ── types ────────────────────────────────────────────────────────────────────

interface FundingPlan {
  id: string;
  name: string;
  contributionAmount: string;
  frequency: string;
  frequencyAmount: number;
  protectionRiskPercentage: string;
  platformServiceChargePercentage: string;
  bankTransactionFee: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface CommissionTier {
  id: string;
  name: string;
  commissionPerGroup: string;
  frequency: string;
}

// ── constants ────────────────────────────────────────────────────────────────

// Members required to reach a group's funding goal — used to derive the minimum goal.
const GROUP_SIZE = 10;

// Header/footer colour cycled per plan card index.
const PALETTES = [
  "bg-green-700",
  "bg-yellow-800",
  "bg-blue-700",
  "bg-orange-500",
  "bg-purple-600",
  "bg-slate-800",
];

// Light-card accents for the commission tiers, cycled per index.
const TIER_STYLES = [
  {
    text: "text-green-700",
    bar: "bg-green-600",
    iconBg: "bg-green-100",
    icon: DollarSign,
  },
  {
    text: "text-yellow-800",
    bar: "bg-yellow-700",
    iconBg: "bg-yellow-100",
    icon: Coins,
  },
  {
    text: "text-blue-700",
    bar: "bg-blue-600",
    iconBg: "bg-blue-100",
    icon: Gem,
  },
  {
    text: "text-orange-600",
    bar: "bg-orange-500",
    iconBg: "bg-orange-100",
    icon: RefreshCw,
  },
  {
    text: "text-purple-600",
    bar: "bg-purple-600",
    iconBg: "bg-purple-100",
    icon: Calendar,
  },
  {
    text: "text-slate-800",
    bar: "bg-slate-700",
    iconBg: "bg-slate-200",
    icon: Coins,
  },
];

const EXAMPLE_GROUPS = [10, 20, 100];

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Funding Plans", href: "/funding" },
  { label: "News & Events", href: "/news" },
  { label: "FAQs", href: "/faqs" },
  { label: "Contact Us", href: "/contact" },
];

const NAVY = "bg-[#0a1a3f]";

// ── helpers ──────────────────────────────────────────────────────────────────

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function freqLabel(frequency: string, frequencyAmount: number) {
  if (frequencyAmount <= 1) return capitalize(frequency);
  if (frequencyAmount === 2) {
    const map: Record<string, string> = {
      daily: "Bi-Daily",
      weekly: "Bi-Weekly",
      monthly: "Bi-Monthly",
    };
    if (map[frequency]) return map[frequency];
  }
  return `Every ${frequencyAmount} ${frequency}`;
}

// Brand glyphs — lucide-react doesn't ship these, so inline the paths.
const SOCIALS: { label: string; path: string }[] = [
  {
    label: "Facebook",
    path: "M13 22v-8h2.7l.4-3H13V9.2c0-.9.3-1.5 1.5-1.5H16V5.1c-.3 0-1.2-.1-2.2-.1-2.2 0-3.8 1.4-3.8 3.9V11H7.5v3H10v8h3z",
  },
  {
    label: "LinkedIn",
    path: "M6.9 8.5A1.7 1.7 0 106.9 5a1.7 1.7 0 000 3.5zM5.5 10h2.8v9H5.5v-9zm5 0h2.7v1.2h.1c.4-.7 1.3-1.4 2.7-1.4 2.9 0 3.4 1.9 3.4 4.3V19h-2.8v-4.3c0-1 0-2.3-1.4-2.3s-1.6 1.1-1.6 2.3V19h-2.8v-9z",
  },
  {
    label: "Instagram",
    path: "M12 8.9A3.1 3.1 0 1012 15.1 3.1 3.1 0 0012 8.9zm0 5.1a2 2 0 110-4 2 2 0 010 4zm3.4-5.3a.7.7 0 11-1.4 0 .7.7 0 011.4 0zM16 6.2c-1-.05-3.9-.05-4.9 0-1.4.06-2.5.4-3.4 1.3S6.3 9.7 6.2 11.1c-.05 1-.05 3.9 0 4.9.06 1.4.4 2.5 1.3 3.4s2 1.24 3.4 1.3c1 .05 3.9.05 4.9 0 1.4-.06 2.5-.4 3.4-1.3s1.24-2 1.3-3.4c.05-1 .05-3.9 0-4.9-.06-1.4-.4-2.5-1.3-3.4s-2-1.24-3.4-1.3zm2.4 9.7c-.2.5-.6.9-1.1 1.1-.8.3-2.6.24-3.4.24s-2.6.06-3.4-.24a1.9 1.9 0 01-1.1-1.1c-.3-.8-.24-2.6-.24-3.4s-.06-2.6.24-3.4c.2-.5.6-.9 1.1-1.1.8-.3 2.6-.24 3.4-.24s2.6-.06 3.4.24c.5.2.9.6 1.1 1.1.3.8.24 2.6.24 3.4s.06 2.6-.24 3.4z",
  },
  {
    label: "X",
    path: "M17.5 5h2.3l-5 5.8L21 19h-4.6l-3.6-4.7L8.6 19H6.3l5.4-6.2L6 5h4.7l3.3 4.3L17.5 5zm-.8 12.6h1.3L9.4 6.3H8l8.7 11.3z",
  },
  {
    label: "TikTok",
    path: "M16.5 5.5c.5 1.3 1.6 2.3 3 2.5v2.3c-1.2 0-2.3-.4-3.3-1v4.7a4.9 4.9 0 11-4.9-4.9c.2 0 .4 0 .6.05v2.4a2.5 2.5 0 102.3 2.5V3.5h2.2c0 .7.05 1.4.1 2z",
  },
];

// ── sections ─────────────────────────────────────────────────────────────────

const HERO_FEATURES = [
  "10 verified members",
  "Automated contributions",
  "Transparent payouts",
];

function Hero() {
  return (
    <section className="bg-gradient-to-br from-[#0a3a2c] to-[#0d4a35] text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Copy */}
        <div>
          <p className="text-orange-400 font-bold text-sm tracking-widest uppercase mb-6">
            Funding Plans
          </p>
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight">
            A plan for every goal. A cluster for every ambition.
          </h1>
          <p className="text-white/70 mt-6 max-w-lg leading-relaxed">
            Choose a contribution level that works for you and access your
            lump-sum payout through a transparent, verified rotational funding
            cluster.
          </p>

          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 mt-8">
            {HERO_FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center shrink-0">
                  <Check
                    className="w-3.5 h-3.5 text-slate-900"
                    strokeWidth={3}
                  />
                </span>
                <span className="text-sm text-white/90">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Image */}
        <div className="relative">
          <div className="absolute rounded-3xl border border-white/15 hidden sm:block bg-red-200 " />
          <img
            src="/hero.png"
            alt="Cluster members celebrating funding"
            className="relative rounded-2xl size-full"
          />
          <div className="absolute bottom-20 right-4 sm:right-6 bg-white rounded-xl shadow-xl px-5 py-4 max-w-[13rem]">
            <p className="text-lg font-extrabold text-[#0a1a3f]">10 weeks</p>
            <p className="text-xs text-base-content/60 mt-1 leading-snug">
              One clear cycle. One member receives a payout each week.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-base-100 border-b border-base-200">
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between gap-4">
        <a href="/" className="flex items-center">
          <img
            src="/agbajo-logo.jpeg"
            alt="Agbajo Africa"
            className="h-12 w-auto"
          />
        </a>

        <nav className="hidden lg:flex items-center gap-8">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={`text-sm font-semibold transition-colors ${
                l.href === "/funding"
                  ? "text-orange-500"
                  : "text-base-content hover:text-orange-500"
              }`}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <a
          href="/home/auth/signup"
          className="btn bg-orange-500 hover:bg-orange-600 text-white border-0 rounded-full px-6"
        >
          Join a Cluster
        </a>
      </div>
    </header>
  );
}

function CommissionTiers() {
  const query = useQuery<ApiResponse<CommissionTier[]>>({
    queryKey: ["commission-tiers"],
    queryFn: async () => {
      const resp = await apiClient.get("/commission-tiers");
      return resp.data;
    },
  });

  return (
    <section className="max-w-7xl mx-auto px-4 py-16">
      <h2 className="text-xl sm:text-2xl font-extrabold tracking-wide text-teal-700 uppercase mb-10">
        Earn as a Cluster Manager
      </h2>

      <PageLoader query={query} loadingText="Loading commission tiers...">
        {({ data: tiers }) => (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {tiers.map((tier, idx) => {
              const style = TIER_STYLES[idx % TIER_STYLES.length];
              const Icon = style.icon;
              const perGroup = Number(tier.commissionPerGroup);
              const label = capitalize(tier.frequency);

              return (
                <div
                  key={tier.id}
                  className="rounded-2xl bg-base-100 border border-base-200 shadow-sm overflow-hidden flex flex-col"
                >
                  <div className={`h-1.5 ${style.bar}`} />
                  <div className="p-5 flex flex-col gap-4">
                    <p
                      className={`text-xs font-bold uppercase tracking-wide ${style.text}`}
                    >
                      {tier.name}
                    </p>

                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg ${style.iconBg} flex items-center justify-center shrink-0`}
                      >
                        <Icon className={`w-5 h-5 ${style.text}`} />
                      </div>
                      <div>
                        <p className="text-2xl font-extrabold text-base-content leading-none">
                          {formatCurrency(perGroup)}
                        </p>
                        <p className="text-xs text-base-content/50 uppercase tracking-wide mt-1">
                          Per Group · {label}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-base-200 pt-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-base-content/40 mb-3">
                        Example Earnings
                      </p>
                      <div className="space-y-2">
                        {EXAMPLE_GROUPS.map((n) => (
                          <div
                            key={n}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="text-base-content/70">
                              {n} groups
                            </span>
                            <span className={`font-bold ${style.text}`}>
                              {formatCurrency(perGroup * n)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </PageLoader>
    </section>
  );
}

function Footer() {
  const handleSubscribe = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const email = new FormData(form).get("email");
    if (email) {
      toast.success("You're subscribed to the Agbajo movement.");
      form.reset();
    }
  };

  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer className={`${NAVY} text-white`}>
      {/* Newsletter */}
      <div className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div>
          <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight">
            Stay close to the Agbajo movement.
          </h2>
          <p className="text-white/60 mt-4 max-w-md">
            Get cluster openings, payout calendars and financial empowerment
            stories, straight to your inbox.
          </p>
        </div>

        <form
          onSubmit={handleSubscribe}
          className="bg-white rounded-2xl p-2 flex items-center gap-2 shadow-lg"
        >
          <input
            type="email"
            name="email"
            required
            placeholder="Enter your email address"
            className="grow bg-transparent text-base-content px-4 py-3 outline-none placeholder:text-base-content/40"
          />
          <button
            type="submit"
            className="btn bg-amber-400 hover:bg-amber-500 text-slate-900 border-0 rounded-xl px-6"
          >
            Subscribe
          </button>
        </form>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* About */}
          <div>
            <p className="text-white/60 text-sm leading-relaxed">
              Africa's digital rotational funding infrastructure — verified
              clusters, automated contributions and transparent payouts for
              SMEs, traders and communities.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-3">
              <ShieldCheck className="w-4 h-4 text-green-400 shrink-0" />
              <span className="text-xs text-white/70">
                BVN &amp; NIN verified · AI fraud monitored
              </span>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-orange-400 font-bold mb-4">AGBAJO</h3>
            <ul className="space-y-3 text-sm text-white/70">
              {[
                "About Us",
                "How it works",
                "Funding plans",
                "News & Events",
                "FAQs",
                "Contact Us",
              ].map((l) => (
                <li key={l}>
                  <a href="#" className="hover:text-white transition-colors">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-bold mb-4">Contact</h3>
            <ul className="space-y-4 text-sm text-white/70">
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-orange-400 shrink-0" />
                info@agbajo.africa
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-orange-400 shrink-0" />
                +234 811 404 6816
              </li>
              <li className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-orange-400 shrink-0" />
                www.agbajo.africa
              </li>
            </ul>
          </div>

          {/* Follow */}
          <div>
            <h3 className="text-white font-bold mb-4">Follow</h3>
            <div className="flex items-center gap-3">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href="#"
                  aria-label={s.label}
                  className="w-9 h-9 rounded-full bg-orange-500 hover:bg-orange-600 flex items-center justify-center transition-colors"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="w-4 h-4 fill-white"
                    aria-hidden="true"
                  >
                    <path d={s.path} />
                  </svg>
                </a>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-white/15 p-5">
              <h4 className="text-orange-400 font-bold">
                Become a cluster lead
              </h4>
              <p className="text-sm text-white/60 mt-2">
                Build verified groups in your community and earn cluster
                incentives.
              </p>
            </div>

            <div className="mt-6 flex items-center gap-6 text-sm text-white/70">
              <a href="#" className="hover:text-white transition-colors">
                Privacy Policy.
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Terms &amp; Conditions
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 relative">
          <p className="text-xs text-white/50">
            © 2026 Agbajo-Africa. All rights reserved.
          </p>
          <p className="text-xs text-orange-400">
            Empowering people. Building Africa. Creating Legacy.
          </p>
          <button
            onClick={scrollTop}
            aria-label="Back to top"
            className="w-11 h-11 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center transition-colors sm:absolute sm:right-4 sm:-top-6 shadow-lg"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        </div>
      </div>
    </footer>
  );
}

// ── page ─────────────────────────────────────────────────────────────────────

function RouteComponent() {
  const query = useQuery<ApiResponse<FundingPlan[]>>({
    queryKey: ["public-plans"],
    queryFn: async () => {
      const resp = await apiClient.get("/plans/all");
      return resp.data;
    },
  });

  return (
    <div className="min-h-screen flex flex-col bg-base-100">
      <Navbar />

      <main className="flex-1">
        <Hero />

        <div className="max-w-6xl mx-auto px-4 py-16">
          <PageLoader query={query} loadingText="Loading plans...">
            {({ data: plans }) => (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-16">
                {plans.map((plan, idx) => {
                  const contribution = Number(plan.contributionAmount);
                  const protectionPct = Number(plan.protectionRiskPercentage);
                  const servicePct = Number(
                    plan.platformServiceChargePercentage,
                  );
                  const bankFee = Number(plan.bankTransactionFee);

                  const protection = (contribution * protectionPct) / 100;
                  const service = (contribution * servicePct) / 100;
                  const total = contribution + protection + service + bankFee;
                  const goal = contribution * GROUP_SIZE;

                  const label = freqLabel(plan.frequency, plan.frequencyAmount);
                  const color = PALETTES[idx % PALETTES.length];
                  const number = String(idx + 1).padStart(2, "0");

                  const items = [
                    {
                      icon: PiggyBank,
                      label: `${label} Contribution`,
                      value: contribution,
                    },
                    {
                      icon: ShieldCheck,
                      label: `Protection Risk (${protectionPct}%)`,
                      value: protection,
                    },
                    {
                      icon: Settings2,
                      label: `Platform Service Charge (${servicePct}%)`,
                      value: service,
                    },
                    {
                      icon: Landmark,
                      label: "Bank Transaction Fee",
                      value: bankFee,
                    },
                  ];

                  return (
                    <div
                      key={plan.id}
                      className="relative rounded-2xl bg-base-100 border border-base-200 shadow-sm flex flex-col overflow-hidden"
                    >
                      {/* Number badge */}
                      <div className="absolute left-1/2 -translate-x-1/2 -top-5 z-10">
                        <div
                          className={`w-10 h-10 rounded-full ${color} text-white flex items-center justify-center text-sm font-semibold ring-4 ring-base-100`}
                        >
                          {number}
                        </div>
                      </div>

                      {/* Header */}
                      <div
                        className={`${color} text-white pt-8 pb-6 px-6 text-center`}
                      >
                        <h3 className="text-xl font-bold leading-tight">
                          {plan.name}
                        </h3>
                      </div>

                      {/* Minimum goal */}
                      <div className="bg-base-200/40 py-5 px-6 text-center">
                        <p className="text-sm text-base-content/60">
                          Minimum group funding goal
                        </p>
                        <p className="text-2xl font-bold text-base-content mt-1">
                          {formatCurrency(goal)}
                        </p>
                      </div>

                      {/* Structure header */}
                      <div
                        className={`${color} text-white/90 py-2.5 px-6 text-center text-xs font-medium`}
                      >
                        Contribution Structure Per Member {label}
                      </div>

                      {/* Line items */}
                      <div className="flex-1 divide-y divide-base-200">
                        {items.map((item) => (
                          <div
                            key={item.label}
                            className="flex items-center gap-3 px-6 py-3.5"
                          >
                            <div
                              className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center shrink-0`}
                            >
                              <item.icon className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-base-content">
                                {item.label}
                              </p>
                              <p className="text-sm text-base-content/60">
                                {formatCurrency(item.value)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Total footer */}
                      <div
                        className={`${color} text-white py-5 px-6 text-center`}
                      >
                        <p className="text-xs text-white/80">
                          Total {label.toLowerCase()} contribution
                        </p>
                        <p className="text-2xl font-bold mt-1">
                          {formatCurrency(total)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </PageLoader>
        </div>

        <CommissionTiers />
      </main>

      <Footer />
    </div>
  );
}
