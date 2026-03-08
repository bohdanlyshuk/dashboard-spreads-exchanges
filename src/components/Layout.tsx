import { Outlet, NavLink } from "react-router-dom";

const BarChart2Icon = ({ size = 24 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

export default function Layout() {
  return (
    <div className="min-h-screen text-gray-100 relative bg-gray-900">
      {/* Background: mexc-sync style */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800/95 to-gray-900 -z-10" />
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(16,185,129,0.08),transparent_50%)]" />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/5 via-transparent to-cyan-900/5 shimmer-slow" />
      </div>

      <header className="relative z-10 bg-gray-900/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-3">
            <div className="w-9 h-9 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center text-white shadow-[0_0_20px_rgba(16,185,129,0.25)]">
              <BarChart2Icon size={20} />
            </div>
            <div>
              <h1 className="text-lg font-black bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent leading-tight">
                Spreads
              </h1>
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Exchanges Dashboard</p>
            </div>
            <nav className="ml-8 flex items-center gap-1">
              <NavLink
                to="/prices"
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? "bg-white/10 text-white" : "text-gray-400 hover:text-gray-200 hover:bg-white/5"}`
                }
              >
                Prices
              </NavLink>
              <NavLink
                to="/spread-history"
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? "bg-white/10 text-white" : "text-gray-400 hover:text-gray-200 hover:bg-white/5"}`
                }
              >
                Spread history
              </NavLink>
            </nav>
          </div>
        </div>
      </header>

      <main className="relative z-10 min-h-[400px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
