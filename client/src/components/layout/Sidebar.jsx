import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Upload, FolderOpen, Brain, Calendar, BookOpen, X, Menu } from 'lucide-react';

const links = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/upload', icon: Upload, label: 'Upload' },
  { to: '/materials', icon: FolderOpen, label: 'My Materials' },
  { to: '/simplify', icon: Brain, label: 'Simplify Notes' },
  { to: '/timetable', icon: Calendar, label: 'Study Timetable' },
];

function NavItems({ onClose }) {
  return (
    <nav className="flex-1 p-3 space-y-0.5">
      {links.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`
          }
        >
          <Icon size={18} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
        <BookOpen size={18} className="text-white" />
      </div>
      <div>
        <span className="font-bold text-gray-900 text-lg">StudyAI</span>
        <p className="text-xs text-gray-400 leading-none">Smart Study Assistant</p>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* ── Desktop sidebar (hidden on mobile) ── */}
      <aside className="hidden md:flex w-60 bg-white border-r border-gray-100 flex-col">
        <div className="p-5 border-b border-gray-100">
          <Logo />
        </div>
        <NavItems onClose={() => {}} />
        <div className="p-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center">Powered by KikiPixel</p>
        </div>
      </aside>

      {/* ── Mobile top bar ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-100 flex items-center justify-between px-4 py-3">
        <Logo />
        <button
          onClick={() => setOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-indigo-600 text-white"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* ── Mobile drawer backdrop ── */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Mobile drawer ── */}
      <div
        className={`md:hidden fixed top-0 left-0 h-full w-72 bg-white z-50 flex flex-col shadow-2xl transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <Logo />
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <NavItems onClose={() => setOpen(false)} />

        <div className="p-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center">Powered by KikiPixel</p>
        </div>
      </div>
    </>
  );
}
