import React, { useState } from 'react';
import { Atleta, Categoria, ClubeEquipe, Inscricao, ProvaEvento, Ranking, UserRole } from '../../types/bmx';
import { ModalInscreverProvaAtleta } from '../Atleta/ModalInscreverProvaAtleta';
import {
  Calendar,
  MapPin,
  Plus,
  DollarSign,
  Trophy,
  CheckCircle2,
  Users,
  Edit,
  Trash2,
  Flag,
  UserCheck,
  Zap,
} from 'lucide-react';

interface CompetitionsManagerProps {
  provas: ProvaEvento[];
  setProvas: React.Dispatch<React.SetStateAction<ProvaEvento[]>>;
  rankings: Ranking[];
  categorias: Categoria[];
  currentRole?: UserRole | 'ESPECTADOR';
  atletas?: Atleta[];
  inscricoes?: Inscricao[];
  setInscricoes?: React.Dispatch<React.SetStateAction<Inscricao[]>>;
  authenticatedAthleteId?: string | null;
  clubes?: ClubeEquipe[];
}

export const CompetitionsManager: React.FC<CompetitionsManagerProps> = ({
  provas,
  setProvas,
  rankings,
  categorias,
  currentRole = 'ADMIN',
  atletas = [],
  inscricoes = [],
  setInscricoes = () => {},
  authenticatedAthleteId,
  clubes = [],
}) => {
  const [modalAberta, setModalAberta] = useState(false);
  const [modalInscricaoAtletaAberta, setModalInscricaoAtletaAberta] = useState(false);
  const [provaSelecionadaParaInscricao, setProvaSelecionadaParaInscricao] = useState<string>('');

  const [nome, setNome] = useState('');
  const [local, setLocal] = useState('');
  const [cidadeEstado, setCidadeEstado] = useState('');
  const [data, setData] = useState('');
  const [valorInscricao, setValorInscricao] = useState('120');
  const [minAtletasCategoria, setMinAtletasCategoria] = useState('4');
  const [rankingId, setRankingId] = useState('');
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<string[]>(
    categorias.map((c) => c.id)
  );

  const atletaLogado = atletas.find((a) => a.id === authenticatedAthleteId) || atletas[0];

  const handleSalvarProva = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !data || !local) return;

    const rankingEncontrado = rankings.find((r) => r.id === rankingId);

    const novaProva: ProvaEvento = {
      id: `prv-${Date.now()}`,
      nome,
      local,
      cidadeEstado: cidadeEstado || 'Brasil',
      data,
      bannerUrl:
        'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80',
      rankingId: rankingId || undefined,
      rankingNome: rankingEncontrado?.nomeRanking,
      valorInscricao: parseFloat(valorInscricao) || 0,
      minAtletasCategoria: parseInt(minAtletasCategoria) || 4,
      categoriasIds: categoriasSelecionadas,
      status: 'Inscrições Abertas',
      inscritosCount: 0,
      organizador: 'Federação Local de Ciclismo',
    };

    setProvas((prev) => [novaProva, ...prev]);
    setModalAberta(false);
    // Reset form
    setNome('');
    setLocal('');
    setCidadeEstado('');
    setData('');
  };

  const handleExcluirProva = (id: string) => {
    if (confirm('Deseja realmente remover esta prova?')) {
      setProvas((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const handleAbrirInscricaoAtleta = (provaId: string) => {
    setProvaSelecionadaParaInscricao(provaId);
    setModalInscricaoAtletaAberta(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-500 text-slate-950 text-xs font-black px-2.5 py-0.5 rounded uppercase flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> CALENDÁRIO DE PROVAS
            </span>
            <span className="text-slate-400 text-xs font-mono">
              Temporada 2026
            </span>
          </div>
          <h2 className="text-2xl font-black text-white">
            {currentRole === 'ATLETA' ? 'Inscrições e Etapas de BMX Racing' : 'Calendário e Eventos de BMX Racing'}
          </h2>
          <p className="text-sm text-slate-300 mt-0.5">
            {currentRole === 'ATLETA'
              ? 'Consulte as etapas oficiais da temporada e realize sua inscrição direta nas provas abertas.'
              : 'Cadastre novas etapas, defina categorias ativas, valores de inscrição e vínculos com os Rankings Nacionais CBC.'}
          </p>
        </div>

        {/* RESTRICTED: Only ADMIN and DIRIGENTE can create new competitions. ATHLETE CANNOT. */}
        {currentRole === 'ADMIN' && (
          <button
            onClick={() => setModalAberta(true)}
            className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-5 py-3 rounded-xl shadow-lg transition flex items-center gap-2 text-sm shrink-0"
          >
            <Plus className="w-5 h-5" />
            Nova Prova / Evento
          </button>
        )}

        {currentRole === 'ATLETA' && atletaLogado && (
          <button
            onClick={() => handleAbrirInscricaoAtleta(provas[0]?.id || '')}
            className="bg-blue-600 hover:bg-blue-500 text-white font-black px-5 py-3 rounded-xl shadow-lg transition flex items-center gap-2 text-sm shrink-0"
          >
            <Flag className="w-5 h-5" />
            Inscrever-se em uma Prova
          </button>
        )}
      </div>

      {/* Grid of Events */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {provas.map((p) => {
          // Check if current athlete is already enrolled
          const atletaInscrito =
            currentRole === 'ATLETA' && atletaLogado
              ? inscricoes.find((i) => i.provaId === p.id && i.atletaId === atletaLogado.id)
              : null;

          return (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col justify-between"
            >
              {/* Banner Header Image */}
              <div className="relative h-40 bg-slate-800 overflow-hidden">
                <img
                  src={p.bannerUrl}
                  alt={p.nome}
                  className="w-full h-full object-cover opacity-80 hover:scale-105 transition duration-500"
                />
                <div className="absolute top-3 left-3">
                  <span
                    className={`text-[11px] font-black uppercase px-2.5 py-1 rounded-lg shadow-md ${
                      p.status === 'Em Andamento'
                        ? 'bg-amber-400 text-slate-950 animate-pulse'
                        : p.status === 'Inscrições Abertas'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-900 text-slate-300'
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
                <div className="absolute bottom-2 right-3 text-white text-xs font-mono font-black bg-slate-950/80 px-2.5 py-1 rounded-lg backdrop-blur">
                  R$ {p.valorInscricao.toFixed(2)}
                </div>
              </div>

              {/* Event Info */}
              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-black text-slate-900 text-base leading-snug">
                    {p.nome}
                  </h3>

                  <div className="mt-2 space-y-1 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        Data:{' '}
                        <strong className="text-slate-900">
                          {new Date(p.data).toLocaleDateString('pt-BR')}
                        </strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 font-medium">
                      <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>
                        {p.local} — <strong className="text-slate-900">{p.cidadeEstado}</strong>
                      </span>
                    </div>
                    {p.rankingNome && (
                      <div className="flex items-center gap-1.5 font-medium text-blue-700">
                        <Trophy className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>{p.rankingNome}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Athlete Specific Registration CTA */}
                {currentRole === 'ATLETA' && (
                  <div className="pt-3 border-t border-slate-100">
                    {atletaInscrito ? (
                      <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-2.5 rounded-xl text-xs flex items-center justify-between font-bold">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Inscrito (Placa #{atletaInscrito.numeroPlaca})
                        </span>
                        <span className="text-[10px] bg-emerald-200 text-emerald-950 px-2 py-0.5 rounded font-mono">
                          {atletaInscrito.categoriaNome}
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAbrirInscricaoAtleta(p.id)}
                        disabled={p.status === 'Encerrado'}
                        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black text-xs py-2.5 px-4 rounded-xl transition shadow-md flex items-center justify-center gap-1.5"
                      >
                        <Flag className="w-4 h-4" />
                        <span>Inscrever-se nesta Etapa</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Admin / General Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    {p.inscritosCount || 0} Inscritos
                  </span>

                  {/* Admin Only Controls */}
                  {currentRole === 'ADMIN' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleExcluirProva(p.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                        title="Remover Prova"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Inscrição do Atleta */}
      {modalInscricaoAtletaAberta && atletaLogado && (
        <ModalInscreverProvaAtleta
          isOpen={modalInscricaoAtletaAberta}
          onClose={() => setModalInscricaoAtletaAberta(false)}
          atleta={atletaLogado}
          provas={provas}
          selectedProvaId={provaSelecionadaParaInscricao}
          categorias={categorias}
          inscricoes={inscricoes}
          setInscricoes={setInscricoes}
          setProvas={setProvas}
        />
      )}

      {/* Modal Nova Prova (Admin only) */}
      {modalAberta && currentRole === 'ADMIN' && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-scale-up space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Flag className="w-5 h-5 text-emerald-600" />
                Cadastrar Nova Prova / Etapa
              </h3>
              <button
                onClick={() => setModalAberta(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvarProva} className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-slate-700 mb-1">Nome do Evento / Prova *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 1ª Etapa Campeonato Brasileiro de BMX Racing 2026"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">Local da Pista *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Pista de BMX Péricles Picelli"
                    value={local}
                    onChange={(e) => setLocal(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">Cidade / Estado *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Indaiatuba / SP"
                    value={cidadeEstado}
                    onChange={(e) => setCidadeEstado(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">Data da Prova *</label>
                  <input
                    type="date"
                    required
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">Valor Inscrição (R$)</label>
                  <input
                    type="number"
                    value={valorInscricao}
                    onChange={(e) => setValorInscricao(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Vincular a Ranking Oficial</label>
                <select
                  value={rankingId}
                  onChange={(e) => setRankingId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Nenhum (Prova Avulsa)</option>
                  {rankings.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nomeRanking} ({r.temporada})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">
                  Mínimo de Atletas para formar Categoria
                </label>
                <input
                  type="number"
                  min="2"
                  max="8"
                  value={minAtletasCategoria}
                  onChange={(e) => setMinAtletasCategoria(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="border-t pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalAberta(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow font-bold flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Salvar e Publicar Prova
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
