import React, { useState } from 'react';
import { Categoria, ProvaEvento, Ranking } from '../../types/bmx';
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
} from 'lucide-react';

interface CompetitionsManagerProps {
  provas: ProvaEvento[];
  setProvas: React.Dispatch<React.SetStateAction<ProvaEvento[]>>;
  rankings: Ranking[];
  categorias: Categoria[];
}

export const CompetitionsManager: React.FC<CompetitionsManagerProps> = ({
  provas,
  setProvas,
  rankings,
  categorias,
}) => {
  const [modalAberta, setModalAberta] = useState(false);
  const [nome, setNome] = useState('');
  const [local, setLocal] = useState('');
  const [cidadeEstado, setCidadeEstado] = useState('');
  const [data, setData] = useState('');
  const [valorInscricao, setValorInscricao] = useState('120');
  const [rankingId, setRankingId] = useState('');
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<string[]>(
    categorias.map((c) => c.id)
  );

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

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-500 text-slate-950 text-xs font-black px-2.5 py-0.5 rounded uppercase flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> GESTÃO DE PROVAS
            </span>
            <span className="text-slate-400 text-xs font-mono">
              Temporada 2026
            </span>
          </div>
          <h2 className="text-2xl font-black text-white">
            Calendário e Eventos de BMX Racing
          </h2>
          <p className="text-sm text-slate-300 mt-0.5">
            Cadastre novas etapas, defina categorias ativas, valores de inscrição e vínculos com os Rankings Nacionais CBC.
          </p>
        </div>

        <button
          onClick={() => setModalAberta(true)}
          className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-5 py-3 rounded-xl shadow-lg transition flex items-center gap-2 text-sm shrink-0"
        >
          <Plus className="w-5 h-5" />
          Nova Prova / Evento
        </button>
      </div>

      {/* Grid of Events */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {provas.map((p) => (
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

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  {p.inscritosCount || 0} Inscritos
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleExcluirProva(p.id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                    title="Remover Prova"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Nova Prova */}
      {modalAberta && (
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
                  <label className="block text-slate-700 mb-1">Valor da Inscrição (R$) *</label>
                  <input
                    type="number"
                    required
                    step="5"
                    value={valorInscricao}
                    onChange={(e) => setValorInscricao(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Vínculo de Ranking Nacional</label>
                <select
                  value={rankingId}
                  onChange={(e) => setRankingId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Nenhum (Prova Amistosa / Isolada)</option>
                  {rankings.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nomeRanking}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalAberta(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-md"
                >
                  Salvar Evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
