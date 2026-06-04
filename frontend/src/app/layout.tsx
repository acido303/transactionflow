import type { Metadata } from 'next'
import './globals.css'
import Link from 'next/link'
import {
  LayoutDashboard,
  Network,
  Zap,
  Map,
  BarChart2,
  List,
  TrendingUp,
  Database,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'TransactionFlow',
  description: 'Real-time transaction data pipeline dashboard',
}

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/architecture', label: 'Architecture', icon: Network },
  { href: '/generator', label: 'Generator', icon: Zap },
  { href: '/map', label: 'Map', icon: Map },
  { href: '/metrics', label: 'Metrics', icon: BarChart2 },
  { href: '/transactions', label: 'Transactions', icon: List },
  { href: '/high-value', label: 'High Value', icon: TrendingUp },
  { href: '/hdfs', label: 'HDFS', icon: Database },
]

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex">
        {/* Sidebar */}
        <aside className="w-56 flex-shrink-0 bg-slate-900 border-r border-slate-700/50 flex flex-col">
          {/* Logo */}
          <div className="p-5 border-b border-slate-700/50">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">TF</span>
              </div>
              <div>
                <p className="text-slate-100 font-semibold text-sm leading-tight">TransactionFlow</p>
                <p className="text-slate-500 text-xs">Pipeline Dashboard</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-3 space-y-0.5">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors text-sm group"
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span>{label}</span>
              </Link>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-700/50">
            <p className="text-xs text-slate-600 text-center">v1.0.0</p>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-auto">
          {children}
        </main>
      </body>
    </html>
  )
}
