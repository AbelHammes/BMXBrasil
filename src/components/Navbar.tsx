import React, { useState } from 'react';
import { UserRole } from '../types/bmx';
import {
  ShieldAlert,
  ShieldCheck,
  Award,
  Calendar,
  Layers,
  Radio,
  RadioTower,
  UserCheck,
  Users,
  Volume2,
  Zap,
  User,
  Flag,
  Eye,
  Key,
  Share2,
  Check,
} from 'lucide-react';

interface NavbarProps {
  currentRole: UserRole | 'ESPECTADOR';
  setCurrentRole: (role: UserRole | 'ESPECTADOR') => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenLoginModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  activeTab,
  setActiveTab,
  onOpenLoginModal,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopySpectatorLink = () => {
    const spectatorUrl = `${window.location.origin}${window.location.pathname}?modo=espectadores`;
    navigator.clipboard.writeText(spectatorUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <header className="bg-slate-900 text-white shadow-xl border-b-4 border-emerald-500 sticky top-0 z-50">
      {/* Top Ticker / Flag Bar */}
      <div className="bg-gradient-to-r from-emerald-800 via-amber-500 to-blue-900 text-slate-950 px-2 sm:px-4 py-0.5 sm:py-1 text-[11px] sm:text-xs font-bold flex items-center justify-between shadow-inner">
        <div className="flex items-center space-x-1.5 sm:space-x-2 truncate">
          <span className="bg-emerald-950 text-emerald-300 text-[9px] sm:text-[10px] uppercase px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded font-mono flex items-center gap-1 shrink-0">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-ping"></span>
            AO VIVO
          </span>
          <span className="text-slate-950 font-semibold truncate text-[10px] sm:text-xs">
            1ª Etapa Campeonato Brasileiro Indaiatuba - Pista Aberta | Cronometragem On-line
          </span>
        </div>
        <div className="hidden sm:flex items-center space-x-3 text-slate-950 text-[11px] shrink-0">
          <span className="flex items-center gap-1">
            <Radio className="w-3 h-3 text-emerald-900" /> Transponders & Timing System
          </span>
          <span className="font-mono">UCI BMX Rules 2026</span>
        </div>
      </div>

      {/* Main Branding & Role Switcher */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-1.5 sm:py-3 flex flex-row items-center justify-between gap-2">
        {/* Logo */}
        <div className="flex items-center gap-2 sm:gap-3 cursor-pointer shrink-0" onClick={() => setActiveTab('espectadores')}>
          <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-emerald-600 via-yellow-400 to-blue-700 p-0.5 shadow-lg flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[8px] sm:rounded-[10px] flex items-center justify-center font-black text-amber-400 text-sm sm:text-xl tracking-tighter">
              BMX
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1">
              <h1 className="text-base sm:text-xl font-extrabold tracking-tight text-white flex items-center gap-1">
                BMX <span className="text-amber-400">BRASIL</span>
              </h1>
              <span className="bg-emerald-600/30 text-emerald-400 text-[9px] sm:text-[10px] border border-emerald-500/40 px-1 py-0.2 sm:px-1.5 sm:py-0.5 rounded font-mono">
                PRO
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Gestão de Provas, Baterias e Ranking Nacional</p>
          </div>
        </div>

        {/* Right Action Bar: Copy Spectator Link + Login / Role Profile */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* Share Spectator Link Button */}
          <button
            onClick={handleCopySpectatorLink}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-2.5 sm:px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-md border border-indigo-400/30"
            title="Copiar link público direto para o Portal do Espectador"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span className="text-[11px]">Link Copiado!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Link Espectadores</span>
              </>
            )}
          </button>

          {/* Current Role Badge & Login Trigger */}
          <button
            onClick={onOpenLoginModal}
            className="bg-slate-800 hover:bg-slate-700 p-1.5 sm:p-2 rounded-xl border border-slate-700 flex items-center gap-1.5 sm:gap-2 transition shadow-inner"
          >
            <div className="flex items-center gap-1 text-[11px] sm:text-xs font-bold">
              {currentRole === 'ADMIN' && (
                <span className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded-lg flex items-center gap-1">
                  <Zap className="w-3 h-3 fill-slate-950" /> Admin
                </span>
              )}
              {currentRole === 'DIRIGENTE' && (
                <span className="bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-lg flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" /> Dirigente
                </span>
              )}
              {currentRole === 'ATLETA' && (
                <span className="bg-blue-600 text-white px-2 py-0.5 rounded-lg flex items-center gap-1">
                  <User className="w-3 h-3" /> Atleta
                </span>
              )}
              {currentRole === 'ESPECTADOR' && (
                <span className="bg-indigo-600 text-white px-2 py-0.5 rounded-lg flex items-center gap-1">
                  <Eye className="w-3 h-3" /> Espectador
                </span>
              )}
            </div>

            <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-1 rounded-md border border-slate-800 hidden sm:flex items-center gap-1">
              <Key className="w-3 h-3 text-amber-400" /> Entrar / Login
            </span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Menu Bar */}
      <nav className="bg-slate-950 border-t border-slate-800 px-2 sm:px-4">
        <div className="max-w-7xl mx-auto flex items-center overflow-x-auto space-x-1 py-1 scrollbar-none text-[11px] sm:text-xs">
          {/* Spectator / Public links always available */}
          <button
            onClick={() => setActiveTab('espectadores')}
            className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg font-bold flex items-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'espectadores'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-indigo-400" />
            Espectadores <span className="hidden sm:inline">(Inscritos e Resultados)</span>
          </button>

          <button
            onClick={() => setActiveTab('placar-ao-vivo')}
            className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg font-bold flex items-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'placar-ao-vivo'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="hidden sm:inline">TV / Placar Ao Vivo</span>
            <span className="sm:hidden">Ao Vivo</span>
          </button>

          {/* ADMIN Menu Items */}
          {currentRole === 'ADMIN' && (
            <>
              <button
                onClick={() => setActiveTab('motor-provas')}
                className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg font-bold flex items-center gap-1.5 whitespace-nowrap transition ${
                  activeTab === 'motor-provas'
                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Motor de Provas (SQORZ)
              </button>
              <button
                onClick={() => setActiveTab('transponder-booth')}
                className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg font-bold flex items-center gap-1.5 whitespace-nowrap transition ${
                  activeTab === 'transponder-booth'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <RadioTower className="w-3.5 h-3.5 text-blue-400" />
                Transponders
              </button>
              <button
                onClick={() => setActiveTab('provas')}
                className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg font-bold flex items-center gap-1.5 whitespace-nowrap transition ${
                  activeTab === 'provas'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                Provas
              </button>
              <button
                onClick={() => setActiveTab('inscricoes')}
                className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg font-bold flex items-center gap-1.5 whitespace-nowrap transition ${
                  activeTab === 'inscricoes'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                Inscritos
              </button>
              <button
                onClick={() => setActiveTab('clubes')}
                className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg font-bold flex items-center gap-1.5 whitespace-nowrap transition ${
                  activeTab === 'clubes'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                Equipes
              </button>
              <button
                onClick={() => setActiveTab('rankings')}
                className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg font-bold flex items-center gap-1.5 whitespace-nowrap transition ${
                  activeTab === 'rankings'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Award className="w-3.5 h-3.5 text-emerald-400" />
                Rankings
              </button>
              <button
                onClick={() => setActiveTab('categorias')}
                className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg font-bold flex items-center gap-1.5 whitespace-nowrap transition ${
                  activeTab === 'categorias'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                Categorias
              </button>
              <button
                onClick={() => setActiveTab('backups-integridade')}
                className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg font-bold flex items-center gap-1.5 whitespace-nowrap transition ${
                  activeTab === 'backups-integridade'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                Backups
              </button>
            </>
          )}

          {/* DIRIGENTE Menu - Permission Restricted ONLY to Team Inscriptions & Race Calendar */}
          {currentRole === 'DIRIGENTE' && (
            <>
              <button
                onClick={() => setActiveTab('equipe-dirigente')}
                className={`px-3 py-2 rounded-lg font-bold flex items-center gap-1.5 whitespace-nowrap transition ${
                  activeTab === 'equipe-dirigente'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
                Inscrição da Minha Equipe
              </button>
              <button
                onClick={() => setActiveTab('inscrever-equipe')}
                className={`px-3 py-2 rounded-lg font-bold flex items-center gap-1.5 whitespace-nowrap transition ${
                  activeTab === 'inscrever-equipe'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                Gerenciar Inscrições em Provas
              </button>
              <button
                onClick={() => setActiveTab('provas')}
                className={`px-3 py-2 rounded-lg font-bold flex items-center gap-1.5 whitespace-nowrap transition ${
                  activeTab === 'provas'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                Calendário de Provas
              </button>
            </>
          )}

          {/* ATLETA Menu - Permission Restricted ONLY to Athlete Inscriptions & Rankings */}
          {currentRole === 'ATLETA' && (
            <>
              <button
                onClick={() => setActiveTab('painel-atleta')}
                className={`px-3 py-2 rounded-lg font-bold flex items-center gap-1.5 whitespace-nowrap transition ${
                  activeTab === 'painel-atleta'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <User className="w-3.5 h-3.5 text-blue-400" />
                Meu Painel
              </button>
              <button
                onClick={() => setActiveTab('provas')}
                className={`px-3 py-2 rounded-lg font-bold flex items-center gap-1.5 whitespace-nowrap transition ${
                  activeTab === 'provas'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Flag className="w-3.5 h-3.5 text-blue-400" />
                Minhas Inscrições em Provas
              </button>
              <button
                onClick={() => setActiveTab('rankings')}
                className={`px-3 py-2 rounded-lg font-bold flex items-center gap-1.5 whitespace-nowrap transition ${
                  activeTab === 'rankings'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Award className="w-3.5 h-3.5 text-amber-400" />
                Pontuação de Ranking
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};
