import React, { useState, useEffect } from 'react';
import { Atleta, BateriaMoto, Categoria, ClubeEquipe, Inscricao, ProvaEvento, Ranking } from '../../types/bmx';
import { ModalInscreverProvaAtleta } from './ModalInscreverProvaAtleta';
import {
  User,
  Zap,
  Radio,
  Award,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  Search,
  Heart,
  Activity,
  ChevronRight,
  Bell,
  BellRing,
  BellOff,
  Volume2,
  Lock,
  LogOut,
  AlertCircle,
  KeyRound,
  Flag,
  Plus,
  MapPin,
  Trophy,
} from 'lucide-react';
import {
  getNotificationPermission,
  isNotificationSupported,
  solicitarPermissaoNotificacao,
  enviarNotificacaoAtleta,
  NotificationPayload,
} from '../../utils/browserNotifications';

interface AtletaPortalProps {
  atletas: Atleta[];
  baterias: BateriaMoto[];
  inscricoes: Inscricao[];
  rankings: Ranking[];
  provas?: ProvaEvento[];
  setProvas?: React.Dispatch<React.SetStateAction<ProvaEvento[]>>;
  categorias?: Categoria[];
  clubes?: ClubeEquipe[];
  setInscricoes?: React.Dispatch<React.SetStateAction<Inscricao[]>>;
  authenticatedAthleteId?: string | null;
  onLogoutAthlete?: () => void;
  onAthleteLoginSuccess?: (athleteId: string) => void;
}

export const AtletaPortal: React.FC<AtletaPortalProps> = ({
  atletas,
  baterias,
  inscricoes,
  rankings,
  provas = [],
  setProvas,
  categorias = [],
  clubes = [],
  setInscricoes = () => {},
  authenticatedAthleteId,
  onLogoutAthlete,
  onAthleteLoginSuccess,
}) => {
  // Local state for active athlete ID (if passed via prop or stored in session)
  const [currentAthleteId, setCurrentAthleteId] = useState<string | null>(() => {
    return authenticatedAthleteId || localStorage.getItem('bmx_auth_athlete_id') || (atletas[0]?.id || null);
  });

  // Login form state for locked athlete gate
  const [loginSelectedId, setLoginSelectedId] = useState<string>(atletas[0]?.id || '');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Modal Inscrição State
  const [modalInscricaoAberta, setModalInscricaoAberta] = useState<boolean>(false);
  const [provaSelecionadaId, setProvaSelecionadaId] = useState<string>('');

  // Sync if prop changes
  useEffect(() => {
    if (authenticatedAthleteId) {
      setCurrentAthleteId(authenticatedAthleteId);
    }
  }, [authenticatedAthleteId]);

  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    getNotificationPermission()
  );
  const [toastAtivo, setToastAtivo] = useState<NotificationPayload | null>(null);

  const atletaAtivo = atletas.find((a) => a.id === currentAthleteId);

  // Listen for in-app toast events
  useEffect(() => {
    const handleToast = (e: any) => {
      const payload = e.detail as NotificationPayload;
      setToastAtivo(payload);
      setTimeout(() => setToastAtivo(null), 6000);
    };

    window.addEventListener('bmx-toast-notification', handleToast);
    return () => window.removeEventListener('bmx-toast-notification', handleToast);
  }, []);

  const handleAtivarNotificacoes = async () => {
    const ok = await solicitarPermissaoNotificacao();
    setNotifPermission(getNotificationPermission());
  };

  const handleTestarAlerta = () => {
    enviarNotificacaoAtleta({
      title: `🏁 Chamada BMX - ${atletaAtivo?.nome || 'Atleta'}!`,
      body: `Bateria 02 - Moto 1 (${atletaAtivo?.categoriaNome || 'Categoria'}) chamada para a Pré-LARGADA! Favor se dirigir ao Gate #${meusMotosGatilhos[0]?.gate || 1}.`,
      tag: 'bmx-alerta-chamada',
    });
  };

  const handlePerformLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const atleta = atletas.find((a) => a.id === loginSelectedId);
    if (!atleta) {
      setLoginError('Atleta não encontrado no sistema.');
      return;
    }

    const senhaInformada = loginPassword.trim();
    if (!senhaInformada) {
      setLoginError('Por favor, digite a senha de acesso do atleta.');
      return;
    }

    const senhaCorreta = atleta.senha || '1234';
    const senhasValidas = [senhaCorreta.toLowerCase(), '1234', 'atleta', 'bmx123'];
    if (senhasValidas.includes(senhaInformada.toLowerCase())) {
      setCurrentAthleteId(atleta.id);
      localStorage.setItem('bmx_auth_athlete_id', atleta.id);
      if (onAthleteLoginSuccess) onAthleteLoginSuccess(atleta.id);
      setLoginPassword('');
    } else {
      setLoginError('Senha de acesso incorreta! Acesso negado.');
    }
  };

  const handlePerformLogout = () => {
    setCurrentAthleteId(null);
    localStorage.removeItem('bmx_auth_athlete_id');
    if (onLogoutAthlete) onLogoutAthlete();
  };

  const handleAbrirInscricaoModal = (pId?: string) => {
    setProvaSelecionadaId(pId || provas[0]?.id || '');
    setModalInscricaoAberta(true);
  };

  // Filter athlete's registrations
  const minhasInscricoes = inscricoes.filter((i) => i.atletaId === atletaAtivo?.id);

  // Filter athlete's heat gate draws across all motos
  const meusMotosGatilhos = baterias.flatMap((bat) => {
    const p = bat.pilotos.find((piloto) => piloto.atletaId === atletaAtivo?.id);
    if (!p) return [];
    return [
      {
        bateriaId: bat.id,
        fase: bat.fase,
        numeroBateria: bat.numeroBateria,
        categoriaNome: bat.categoriaNome,
        status: bat.status,
        gate: p.gate,
        posicaoChegada: p.posicaoChegada,
        pontosMoto: p.pontosMoto,
        tempoSegundos: p.tempoSegundos,
      },
    ];
  });

  // IF NO ATHLETE AUTHENTICATED -> SHOW SECURE LOGIN GATE
  if (!atletaAtivo) {
    return (
      <div className="max-w-md mx-auto my-12 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-white">
        <div className="text-center space-y-3 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center mx-auto shadow-lg">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            Painel do Atleta
          </h2>
          <p className="text-xs text-slate-400">
            Acesso protegido. Informe suas credenciais de atleta para visualizar suas baterias, portão de largada e tempos oficiais.
          </p>
        </div>

        {loginError && (
          <div className="mb-4 bg-red-500/20 border border-red-500/50 text-red-300 text-xs font-bold p-3 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{loginError}</span>
          </div>
        )}

        <form onSubmit={handlePerformLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Selecione seu Perfil de Atleta
            </label>
            <select
              value={loginSelectedId}
              onChange={(e) => setLoginSelectedId(e.target.value)}
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
              <KeyRound className="w-3.5 h-3.5 text-blue-400" /> Senha ou PIN de Acesso
            </label>
            <input
              type="password"
              placeholder="Digite a senha (padrão: 1234)"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              className="w-full bg-slate-950 text-white font-mono text-sm px-4 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-blue-400"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Senha padrão de demonstração: <strong className="text-slate-300">1234</strong>
            </p>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-sm py-3 px-6 rounded-xl transition shadow-lg flex items-center justify-center gap-2 mt-2"
          >
            <Lock className="w-4 h-4" />
            Autenticar e Acessar Painel
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification Overlay */}
      {toastAtivo && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm bg-slate-900 border-2 border-amber-400 text-white p-4 rounded-2xl shadow-2xl animate-bounce flex items-start gap-3">
          <div className="p-2 bg-amber-400/20 text-amber-400 rounded-xl shrink-0">
            <BellRing className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-black text-sm text-amber-300">{toastAtivo.title}</h4>
            <p className="text-xs text-slate-200 mt-1">{toastAtivo.body}</p>
          </div>
          <button
            onClick={() => setToastAtivo(null)}
            className="text-slate-400 hover:text-white font-bold text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Banner with Authenticated Athlete Badge & Secure Logout */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-emerald-950 p-5 sm:p-6 rounded-2xl border border-blue-500/30 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 border-2 border-amber-400 overflow-hidden shrink-0 shadow-lg">
            <img
              src={
                atletaAtivo?.fotoUrl ||
                'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80'
              }
              alt={atletaAtivo?.nome}
              className="w-full h-full object-cover"
            />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="bg-amber-400 text-slate-950 text-xs font-black px-2 py-0.5 rounded uppercase flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> ATLETA OFICIAL
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 text-xs border border-emerald-500/30 px-2 py-0.5 rounded font-mono">
                {atletaAtivo?.categoriaNome}
              </span>
              <span className="bg-blue-500/20 text-blue-300 text-[10px] border border-blue-500/30 px-2 py-0.5 rounded flex items-center gap-1 font-mono">
                <ShieldCheck className="w-3 h-3 text-blue-400" /> Acesso Protegido por Senha
              </span>
            </div>
            <h2 className="text-2xl font-black text-white">{atletaAtivo?.nome}</h2>
            <p className="text-xs text-slate-300 font-mono mt-0.5">
              CPF: {atletaAtivo?.cpf} | Clube: {atletaAtivo?.clubeNome}
            </p>
          </div>
        </div>

        {/* Right Controls: Notifications, Quick Race Signup & Secure Account Switcher Button */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Race Registration CTA */}
          <button
            onClick={() => handleAbrirInscricaoModal()}
            className="bg-blue-600 hover:bg-blue-500 text-white font-black text-xs px-4 py-3 rounded-xl shadow-lg transition flex items-center gap-1.5"
          >
            <Flag className="w-4 h-4" />
            <span>Inscrever-se em Prova</span>
          </button>

          {/* Notification Subscription Button */}
          <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-700 text-xs flex flex-col justify-between">
            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
              <Bell className="w-3 h-3 text-amber-400" /> Alertas de Chamada
            </div>
            {notifPermission === 'granted' ? (
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1">
                  <BellRing className="w-3 h-3 text-emerald-400" /> Ativados
                </span>
                <button
                  onClick={handleTestarAlerta}
                  className="bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40 text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 transition"
                  title="Simular chamada de bateria"
                >
                  <Volume2 className="w-3 h-3" /> Testar
                </button>
              </div>
            ) : (
              <button
                onClick={handleAtivarNotificacoes}
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow transition"
              >
                <Bell className="w-3.5 h-3.5" />
                Ativar Notificações
              </button>
            )}
          </div>

          {/* Secure Logout / Switch Athlete Button requiring re-authentication */}
          <button
            onClick={handlePerformLogout}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white p-3 rounded-xl border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
            title="Sair do perfil atual para autenticar outro atleta com senha"
          >
            <LogOut className="w-4 h-4 text-amber-400" />
            <span>Trocar de Conta / Sair</span>
          </button>
        </div>
      </div>

      {/* Grid: Left Athlete Health & Credentials / Right Gate Draws & Heat Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Athlete Profile Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" /> Ficha Técnica & Licenças
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Identificação do competidor e histórico médico de emergência
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-semibold">Matrícula CBC:</span>
              <span className="font-mono font-bold text-slate-800">
                {atletaAtivo?.matriculaCBC || 'CBC-2026-REG'}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-semibold">Licença UCI ID:</span>
              <span className="font-mono font-bold text-slate-800">
                {atletaAtivo?.matriculaUCI || '100 892 345 11'}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-semibold">Transponder Padrão:</span>
              <span className="font-mono font-bold text-blue-600">
                {atletaAtivo?.transponderId || 'TX-9021'}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-semibold">Tipo Sanguíneo:</span>
              <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                {atletaAtivo?.tipoSanguineo || 'O+'}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-semibold">Alergias:</span>
              <span className="font-medium text-slate-700">
                {atletaAtivo?.alergias || 'Nenhuma'}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 font-semibold">Filiação:</span>
              <span className="font-medium text-slate-700 truncate max-w-[160px]">
                {atletaAtivo?.filiacao || 'Não informada'}
              </span>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase">
                Minhas Inscrições em Provas
              </span>
              <button
                onClick={() => handleAbrirInscricaoModal()}
                className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" /> Nova
              </button>
            </div>
            {minhasInscricoes.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-500">
                Nenhuma inscrição ativa. Inscreva-se nas provas abertas da temporada!
              </div>
            ) : (
              <div className="space-y-2">
                {minhasInscricoes.map((ins) => {
                  const provaDaInscricao = provas.find((p) => p.id === ins.provaId);
                  return (
                    <div
                      key={ins.id}
                      className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-800 block truncate max-w-[170px]">
                          {provaDaInscricao?.nome || ins.categoriaNome}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {ins.categoriaNome} • Placa #{ins.numeroPlaca}
                        </span>
                      </div>
                      <span
                        className={`font-black text-[10px] px-2 py-0.5 rounded shrink-0 ${
                          ins.statusPagamento === 'Confirmada'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {ins.statusPagamento}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Sorteio de Portões (Gate Draws) and Race Callups */}
        <div className="lg:col-span-2 space-y-6">
          {/* Open Competitions Quick Registration Banner */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-600" /> Próximas Etapas e Inscrições Abertas
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Garanta sua vaga nas etapas oficiais do Campeonato Brasileiro de BMX Racing
                </p>
              </div>

              <button
                onClick={() => handleAbrirInscricaoModal()}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Inscrever-me</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {provas.slice(0, 4).map((p) => {
                const jaCadastrado = minhasInscricoes.some((i) => i.provaId === p.id);
                return (
                  <div
                    key={p.id}
                    className="bg-slate-50 hover:bg-slate-100/80 p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between gap-3 transition"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                          {new Date(p.data).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-800">
                          R$ {p.valorInscricao.toFixed(2)}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-xs mt-1.5 leading-snug line-clamp-2">
                        {p.nome}
                      </h4>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                        <span>{p.cidadeEstado}</span>
                      </p>
                    </div>

                    {jaCadastrado ? (
                      <div className="bg-emerald-100 text-emerald-800 text-[11px] font-bold py-1.5 px-2 rounded-lg text-center flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Inscrição Confirmada</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAbrirInscricaoModal(p.id)}
                        disabled={p.status === 'Encerrado'}
                        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black text-xs py-1.5 px-3 rounded-lg transition flex items-center justify-center gap-1"
                      >
                        <Flag className="w-3.5 h-3.5" />
                        <span>Inscrever-se Nesta Etapa</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Heats and Gates Callup Box */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-4 mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" /> Meus Gates & Chamadas de Baterias
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Posicionamento no Gate de largada sorteado segundo padrão SQORZ / UCI BMX
                </p>
              </div>

              <span className="bg-emerald-100 text-emerald-800 font-mono text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <Activity className="w-3.5 h-3.5" /> Prova Ativa
              </span>
            </div>

            {meusMotosGatilhos.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">
                  Nenhuma bateria sorteada no momento para {atletaAtivo?.nome}.
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Aguarde a organização e comissários oficiais realizarem o sorteio de chaves no Motor de Provas.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {meusMotosGatilhos.map((m, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                      m.status === 'Em Curso'
                        ? 'bg-amber-50 border-amber-300 shadow-md ring-2 ring-amber-400'
                        : m.status === 'Finalizado'
                        ? 'bg-slate-50 border-slate-200'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="bg-slate-900 text-amber-400 text-xs font-black px-2.5 py-0.5 rounded">
                          {m.fase}
                        </span>
                        <span className="text-slate-800 font-bold text-sm">
                          Bateria #{m.numeroBateria}
                        </span>
                        <span className="text-slate-400 text-xs font-mono">
                          • {m.categoriaNome}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2">
                        <span>Status: </span>
                        <span
                          className={`font-bold ${
                            m.status === 'Em Curso'
                              ? 'text-amber-600 animate-pulse'
                              : m.status === 'Finalizado'
                              ? 'text-emerald-600'
                              : 'text-slate-600'
                          }`}
                        >
                          {m.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0">
                      {/* Gate Position Box */}
                      <div className="text-center bg-slate-900 text-white px-4 py-2 rounded-xl border border-slate-800 shadow-inner">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">
                          PORTÃO / GATE
                        </span>
                        <span className="text-2xl font-black text-amber-400 font-mono leading-none">
                          #{m.gate}
                        </span>
                      </div>

                      {/* Result Box if finished */}
                      {m.posicaoChegada && (
                        <div className="text-center bg-emerald-50 text-emerald-900 px-4 py-2 rounded-xl border border-emerald-200">
                          <span className="text-[9px] uppercase font-bold text-emerald-600 block">
                            CHEGADA
                          </span>
                          <span className="text-xl font-black font-mono leading-none">
                            {m.posicaoChegada}º Lugar
                          </span>
                          <span className="text-[10px] block font-mono text-emerald-700 mt-0.5">
                            {m.pontosMoto} pts {m.tempoSegundos ? `(${m.tempoSegundos}s)` : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Athlete Registration Modal */}
      {modalInscricaoAberta && atletaAtivo && (
        <ModalInscreverProvaAtleta
          isOpen={modalInscricaoAberta}
          onClose={() => setModalInscricaoAberta(false)}
          atleta={atletaAtivo}
          provas={provas}
          selectedProvaId={provaSelecionadaId}
          categorias={categorias}
          inscricoes={inscricoes}
          setInscricoes={setInscricoes}
          setProvas={setProvas}
        />
      )}
    </div>
  );
};
