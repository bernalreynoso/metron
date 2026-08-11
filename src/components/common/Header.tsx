import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { formatSpanishDate, getLocalDateString } from '../../utils/dates';
import { LogOut, User as UserIcon } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
}

export const Header: React.FC<HeaderProps> = ({ currentTab }) => {
  const { user, logoutUser } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const todayFormatted = formatSpanishDate(getLocalDateString());

  return (
    <header className="bg-[#080809]/90 border-b border-[#1e1e20] backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo & Title */}
        <div className="flex items-center space-x-3 min-w-0">
          <img
            src="/metron-mark.png"
            alt="METRON"
            className="h-[42px] sm:h-[46px] md:h-[50px] w-auto object-contain shrink-0"
          />
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h1 className="font-serif tracking-[0.2em] text-base sm:text-lg font-bold text-[#e2e2e2] uppercase truncate">
                METRON
              </h1>
              <span className="text-[10px] tracking-widest px-1.5 py-0.5 rounded border border-[#c5a059]/30 text-[#c5a059] bg-[#c5a059]/10 uppercase font-mono shrink-0 hidden xs:inline-block">
                Μέτρον
              </span>
            </div>
            <p className="text-[11px] text-[#888888] hidden sm:block font-light truncate">
              Medición, observación y evolución
            </p>
          </div>
        </div>

        {/* Date Display for HOY tab */}
        {currentTab === 'hoy' && (
          <div className="text-right hidden md:block">
            <p className="text-xs font-medium text-[#e2e2e2]">{todayFormatted}</p>
            <p className="text-[10px] text-[#666666]">Día lógico actual</p>
          </div>
        )}

        {/* User Account Menu */}
        <div className="relative">
          <button
            id="user-menu-btn"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2 p-1.5 rounded-lg border border-[#1e1e20] bg-[#131315] hover:border-[#c5a059]/50 transition-colors text-[#e2e2e2]"
            aria-label="Menú de usuario"
          >
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'Usuario'}
                className="w-7 h-7 rounded-full object-cover border border-[#c5a059]/50"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-[#1e1e20] flex items-center justify-center text-[#c5a059]">
                <UserIcon className="w-4 h-4" />
              </div>
            )}
            <span className="text-xs font-medium text-[#e2e2e2] max-w-[120px] truncate hidden sm:inline">
              {user?.displayName || user?.email?.split('@')[0]}
            </span>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-[#131315] border border-[#1e1e20] rounded-xl shadow-2xl py-2 z-50 text-[#e2e2e2]">
              <div className="px-4 py-2 border-b border-[#1e1e20]">
                <p className="text-xs font-semibold text-[#e2e2e2] truncate">
                  {user?.displayName || 'Usuario'}
                </p>
                <p className="text-[11px] text-[#888888] truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  logoutUser();
                }}
                className="w-full text-left px-4 py-2 text-xs text-rose-400 hover:bg-[#1e1e20] flex items-center space-x-2 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Cerrar sesión</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
