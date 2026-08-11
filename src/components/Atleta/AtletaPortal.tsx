import React, { useState, useEffect } from 'react';
import { Atleta, BateriaMoto, Inscricao, Ranking } from '../../types/bmx';
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
}

export const AtletaPortal: React.FC<AtletaPortalProps> = ({
  atletas,
  baterias,
  inscricoes,
  rankings,
}) => {
  // Select active athlete
  const [atletaId, setAtletaId] = useState<string>(atletas[0]?.id || '');
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    getNotificationPermission()
  );
  const [toastAtivo, setToastAtivo] = useState<NotificationPayload | null>(null);

  const atletaAtivo = atletas.find((a) => a.id === atletaId) || atletas[0];

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

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-emerald-950 p-6 rounded-2xl border border-blue-500/30 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
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
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-amber-400 text-slate-950 text-xs font-black px-2 py-0.5 rounded uppercase flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> ATLETA OFICIAL
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 text-xs border border-emerald-500/30 px-2 py-0.5 rounded font-mono">
                {atletaAtivo?.categoriaNome}
              </span>
            </div>
            <h2 className="text-2xl font-black text-white">{atletaAtivo?.nome}</h2>
            <p className="text-xs text-slate-300 font-mono mt-0.5">
              CPF: {atletaAtivo?.cpf} | Clube: {atletaAtivo?.clubeNome}
            </p>
          </div>
        </div>

        {/* Right Controls: Notifications & Athlete Switcher */}
        <div className="flex flex-wrap items-center gap-3">
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

          {/* Athlete Switcher for Demo */}
          <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-700 text-xs">
            <label className="block text-slate-400 font-bold uppercase mb-1">
              Alternar Atleta
            </label>
            <select
              value={atletaId}
              onChange={(e) => setAtletaId(e.target.value)}
              className="bg-slate-800 text-amber-300 font-bold rounded-lg px-3 py-1.5 border border-slate-700 focus:outline-none"
            >
              {atletas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome} ({a.categoriaNome})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid: Left Athlete Health & Credentials / Right Gate Draws & Heat Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Athlete Profile Card */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-black text-slate-900 text-base border-b pb-2 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Ficha Médica e Filiações
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-bold uppercase block text-[10px]">
                  Tipo Sanguíneo
                </span>
                <span className="text-red-600 font-black text-base flex items-center gap-1">
                  <Heart className="w-4 h-4 fill-red-500" /> {atletaAtivo?.tipoSanguineo}
                </span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-bold uppercase block text-[10px]">
                  Transponder Cadastrado
                </span>
                <span className="text-amber-600 font-mono font-black text-sm flex items-center gap-1">
                  <Radio className="w-4 h-4" /> {atletaAtivo?.transponderId}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-500 font-bold">Alergias / Restrições:</span>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {atletaAtivo?.alergias || 'Nenhuma alergia relatada'}
                </p>
              </div>
              <div className="pt-2 border-t font-mono">
                <span className="text-slate-500 font-bold">Matrícula CBC:</span>{' '}
                <span className="text-slate-900 font-bold">{atletaAtivo?.matriculaCBC || 'Pendente'}</span>
              </div>
              <div className="font-mono">
                <span className="text-slate-500 font-bold">Matrícula UCI:</span>{' '}
                <span className="text-slate-900 font-bold">{atletaAtivo?.matriculaUCI || 'Pendente'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (2 Cols): Live Gate Draws Schedule */}
        <div className="lg:col-span-2 space-y-6">
          {/* Live Gate Draws Box */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 text-white shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-lg text-white">
                  Meus Portões de Largada (Gates 1 a 8)
                </h3>
              </div>
              <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full font-mono">
                Atualização Ao Vivo
              </span>
            </div>

            <p className="text-xs text-slate-300">
              Verifique o número do portão sorteado (Gate) para cada bateria e acompanhe seus resultados de volta:
            </p>

            {meusMotosGatilhos.length === 0 ? (
              <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-center text-xs text-slate-400">
                Ainda não há baterias/gatilhos sorteados para este atleta nesta competição.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {meusMotosGatilhos.map((m, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-amber-400 uppercase">
                        {m.fase}
                      </span>
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                        Bateria {m.numeroBateria}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <div className="text-xs text-slate-400 font-semibold">Portão Sorteado:</div>
                        <div className="text-3xl font-black text-emerald-400 font-mono">
                          GATE {m.gate}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-slate-400 font-semibold">Resultado:</div>
                        {m.posicaoChegada ? (
                          <div className="text-lg font-black text-amber-300">
                            {m.posicaoChegada}º Lugar ({m.pontosMoto} pt)
                          </div>
                        ) : (
                          <div className="text-xs text-slate-500 italic">
                            Aguardando Largada
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
