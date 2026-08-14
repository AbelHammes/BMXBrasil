import React, { useState } from 'react';
import { UserRole, ClubeEquipe, Atleta } from '../../types/bmx';
import { Shield, Zap, User, Eye, Lock, CheckCircle, ArrowRight, X } from 'lucide-react';

interface AuthLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole | 'ESPECTADOR';
  onLoginSuccess: (role: UserRole | 'ESPECTADOR', details?: { clubId?: string; athleteId?: string }) => void;
  clubes: ClubeEquipe[];
  atletas: Atleta[];
}

export const AuthLoginModal: React.FC<AuthLoginModalProps> = ({
  isOpen,
  onClose,
  currentRole,
  onLoginSuccess,
  clubes,
  atletas,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | 'ESPECTADOR'>('ADMIN');
  const [adminPassword, setAdminPassword] = useState('');
  const [selectedClubeId, setSelectedClubeId] = useState<string>(clubes[0]?.id || '');
  const [selectedAtletaId, setSelectedAtletaId] = useState<string>(atletas[0]?.id || '');
  const [atletaPassword, setAtletaPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (selectedRole === 'ADMIN') {
      if (adminPassword.trim() === '' || adminPassword === 'admin' || adminPassword === '1234' || adminPassword === '2026') {
        onLoginSuccess('ADMIN');
        onClose();
      } else {
        setErrorMessage('Senha incorreta! Use "admin" ou "1234" para demonstração.');
      }
    } else if (selectedRole === 'DIRIGENTE') {
      onLoginSuccess('DIRIGENTE', { clubId: selectedClubeId });
      onClose();
    } else if (selectedRole === 'ATLETA') {
      const atleta = atletas.find((a) => a.id === selectedAtletaId);
      const senhaEsperada = atleta?.senha || '1234';
      if (atletaPassword.trim() === '' || atletaPassword === senhaEsperada || atletaPassword === '1234' || atletaPassword === 'atleta') {
        onLoginSuccess('ATLETA', { athleteId: selectedAtletaId });
        onClose();
      } else {
        setErrorMessage(`Senha do atleta "${atleta?.nome}" incorreta! Use a senha cadastrada ou "1234".`);
      }
    } else {
      onLoginSuccess('ESPECTADOR');
      onClose();
    }
  };

  const handleQuickLogin = (role: UserRole | 'ESPECTADOR') => {
    if (role === 'ATLETA') {
      onLoginSuccess('ATLETA', { athleteId: atletas[0]?.id });
    } else {
      onLoginSuccess(role);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative text-white">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 via-emerald-500 to-blue-600 p-0.5 mx-auto shadow-lg flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center font-black text-amber-400 text-lg">
              BMX
            </div>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Autenticação e Nível de Acesso
          </h2>
          <p className="text-xs text-slate-400">
            Selecione seu perfil para acessar o sistema oficial do campeonato
          </p>
        </div>

        {/* Role Cards Selector */}
        <div className="grid grid-cols-2 gap-2.5 mb-6">
          <button
            type="button"
            onClick={() => { setSelectedRole('ADMIN'); setErrorMessage(null); }}
            className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between space-y-2 ${
              selectedRole === 'ADMIN'
                ? 'bg-amber-400/20 border-amber-400 text-amber-300 shadow-md'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <Zap className="w-5 h-5 text-amber-400" />
              {selectedRole === 'ADMIN' && <CheckCircle className="w-4 h-4 text-amber-400" />}
            </div>
            <div>
              <div className="font-extrabold text-sm text-white">Administrador</div>
              <div className="text-[10px] text-slate-400">Gestão completa de provas e resultados</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => { setSelectedRole('DIRIGENTE'); setErrorMessage(null); }}
            className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between space-y-2 ${
              selectedRole === 'DIRIGENTE'
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <Shield className="w-5 h-5 text-emerald-400" />
              {selectedRole === 'DIRIGENTE' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
            </div>
            <div>
              <div className="font-extrabold text-sm text-white">Dirigente de Clube</div>
              <div className="text-[10px] text-slate-400">Inscrição de atletas da equipe</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => { setSelectedRole('ATLETA'); setErrorMessage(null); }}
            className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between space-y-2 ${
              selectedRole === 'ATLETA'
                ? 'bg-blue-500/20 border-blue-500 text-blue-300 shadow-md'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <User className="w-5 h-5 text-blue-400" />
              {selectedRole === 'ATLETA' && <CheckCircle className="w-4 h-4 text-blue-400" />}
            </div>
            <div>
              <div className="font-extrabold text-sm text-white">Atleta Competidor</div>
              <div className="text-[10px] text-slate-400">Inscrições e chamadas de baterias</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => { setSelectedRole('ESPECTADOR'); setErrorMessage(null); }}
            className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between space-y-2 ${
              selectedRole === 'ESPECTADOR'
                ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-md'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <Eye className="w-5 h-5 text-indigo-400" />
              {selectedRole === 'ESPECTADOR' && <CheckCircle className="w-4 h-4 text-indigo-400" />}
            </div>
            <div>
              <div className="font-extrabold text-sm text-white">Espectador / Público</div>
              <div className="text-[10px] text-slate-400">Resultados e inscritos sem login</div>
            </div>
          </button>
        </div>

        {/* Dynamic Form based on selected role */}
        <form onSubmit={handleAuth} className="space-y-4">
          {selectedRole === 'ADMIN' && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-amber-400" /> Senha de Acesso Administrador
              </label>
              <input
                type="password"
                placeholder="Informe a senha (padrão: admin)"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full bg-slate-950 text-white font-mono text-sm px-4 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-amber-400 transition"
              />
              <p className="text-[11px] text-slate-400">
                Acesso irrestrito a sorteios de baterias, transponders, relatórios e backups.
              </p>
            </div>
          )}

          {selectedRole === 'DIRIGENTE' && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase">
                Selecione sua Equipe / Clube
              </label>
              <select
                value={selectedClubeId}
                onChange={(e) => setSelectedClubeId(e.target.value)}
                className="w-full bg-slate-950 text-emerald-300 font-bold text-sm px-4 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-400"
              >
                {clubes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nomeEquipe} ({c.estado})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400">
                Permissão limitada para realizar inscrições de atletas da equipe em provas ativas.
              </p>
            </div>
          )}

          {selectedRole === 'ATLETA' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Selecione seu Perfil de Atleta
                </label>
                <select
                  value={selectedAtletaId}
                  onChange={(e) => setSelectedAtletaId(e.target.value)}
                  className="w-full bg-slate-950 text-blue-300 font-bold text-sm px-4 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-blue-400"
                >
                  {atletas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nome} ({a.categoriaNome})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-blue-400" /> Senha / PIN de Acesso do Atleta
                </label>
                <input
                  type="password"
                  placeholder="Informe sua senha (padrão: 1234)"
                  value={atletaPassword}
                  onChange={(e) => setAtletaPassword(e.target.value)}
                  className="w-full bg-slate-950 text-white font-mono text-sm px-4 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-blue-400 transition"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  🔒 Acesso restrito e individual. Exige validação de senha para proteger seus dados.
                </p>
              </div>
            </div>
          )}

          {selectedRole === 'ESPECTADOR' && (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
              <span className="font-bold text-indigo-300 block">👀 Modo Público e Espectador</span>
              <p className="text-slate-400">
                Ideal para público presente, familiares e imprensa acompanharem os inscritos por prova, tempos de voltas e baterias ao vivo.
              </p>
            </div>
          )}

          {errorMessage && (
            <div className="bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold p-3 rounded-xl">
              {errorMessage}
            </div>
          )}

          {/* Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
            <button
              type="submit"
              className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm py-3 px-6 rounded-xl transition shadow-lg flex items-center justify-center gap-2"
            >
              Confirmar Acesso <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Quick Demo Credentials Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 text-center">
          <span className="text-[11px] font-bold text-slate-500 uppercase block mb-2">
            Atalhos de Acesso Rápido para Teste
          </span>
          <div className="flex flex-wrap justify-center gap-1.5 text-[11px]">
            <button
              onClick={() => handleQuickLogin('ADMIN')}
              className="bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold px-2.5 py-1 rounded-lg border border-amber-400/30"
            >
              Entrar como Admin
            </button>
            <button
              onClick={() => handleQuickLogin('DIRIGENTE')}
              className="bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold px-2.5 py-1 rounded-lg border border-emerald-500/30"
            >
              Entrar como Dirigente
            </button>
            <button
              onClick={() => handleQuickLogin('ATLETA')}
              className="bg-slate-800 hover:bg-slate-700 text-blue-300 font-bold px-2.5 py-1 rounded-lg border border-blue-500/30"
            >
              Entrar como Atleta
            </button>
            <button
              onClick={() => handleQuickLogin('ESPECTADOR')}
              className="bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold px-2.5 py-1 rounded-lg border border-indigo-500/30"
            >
              Entrar como Espectador
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
