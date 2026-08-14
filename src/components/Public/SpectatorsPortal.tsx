import React, { useState } from 'react';
import {
  BateriaMoto,
  Categoria,
  ClubeEquipe,
  Inscricao,
  ProvaEvento,
  Ranking,
} from '../../types/bmx';
import { ordenarPilotosPorChegada } from '../../utils/uciBmEngine';
import {
  Eye,
  Users,
  Trophy,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Medal,
  Zap,
  MapPin,
  Clock,
  ChevronRight,
  Sparkles,
  Building,
  Radio,
} from 'lucide-react';

interface SpectatorsPortalProps {
  provas: ProvaEvento[];
  categorias: Categoria[];
  inscricoes: Inscricao[];
  baterias: BateriaMoto[];
  clubes?: ClubeEquipe[];
}

export const SpectatorsPortal: React.FC<SpectatorsPortalProps> = ({
  provas,
  categorias,
  inscricoes,
  baterias,
  clubes = [],
}) => {
  const [selectedProvaId, setSelectedProvaId] = useState<string>(
    provas[0]?.id || ''
  );
  const [selectedCategoriaId, setSelectedCategoriaId] = useState<string>('TODAS');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeSubTab, setActiveSubTab] = useState<'INSCRITOS' | 'RESULTADOS' | 'CLUBES'>(
    'INSCRITOS'
  );

  const provaAtual = provas.find((p) => p.id === selectedProvaId) || provas[0];

  // Filter Enrolled Athletes
  const inscricoesDaProva = inscricoes.filter((ins) => {
    const matchProva = ins.provaId === selectedProvaId;
    const matchCat =
      selectedCategoriaId === 'TODAS' || ins.categoriaId === selectedCategoriaId;
    const matchSearch =
      searchTerm === '' ||
      ins.atletaNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ins.numeroPlaca.includes(searchTerm) ||
      ins.clubeNome.toLowerCase().includes(searchTerm.toLowerCase());

    return matchProva && matchCat && matchSearch;
  });

  // Filter Heats / Motos for Results
  const bateriasDaProva = baterias.filter((b) => {
    const matchProva = b.provaId === selectedProvaId;
    const matchCat =
      selectedCategoriaId === 'TODAS' || b.categoriaId === selectedCategoriaId;
    const matchSearch =
      searchTerm === '' ||
      b.pilotos.some(
        (p) =>
          p.atletaNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.numeroPlaca.includes(searchTerm)
      );
    return matchProva && matchCat && matchSearch;
  });

  // Group inscritos by category for summary counts
  const categoriasAtivasComInscritos = categorias.map((cat) => {
    const qtd = inscricoes.filter(
      (i) => i.provaId === selectedProvaId && i.categoriaId === cat.id
    ).length;
    return { ...cat, totalInscritos: qtd };
  });

  // Calculate rider results summary (sum of positions)
  const riderResultsMap = new Map<
    string,
    {
      atletaId: string;
      atletaNome: string;
      numeroPlaca: string;
      clubeNome: string;
      categoriaNome: string;
      pontosTotal: number;
      melhorTempo: number | null;
      posicoes: number[];
    }
  >();

  baterias
    .filter((b) => b.provaId === selectedProvaId)
    .forEach((bateria) => {
      bateria.pilotos.forEach((piloto) => {
        if (!riderResultsMap.has(piloto.atletaId)) {
          riderResultsMap.set(piloto.atletaId, {
            atletaId: piloto.atletaId,
            atletaNome: piloto.atletaNome,
            numeroPlaca: piloto.numeroPlaca,
            clubeNome: piloto.clubeNome,
            categoriaNome: bateria.categoriaNome,
            pontosTotal: 0,
            melhorTempo: null,
            posicoes: [],
          });
        }
        const record = riderResultsMap.get(piloto.atletaId)!;
        if (piloto.posicaoChegada) {
          record.pontosTotal += piloto.posicaoChegada;
          record.posicoes.push(piloto.posicaoChegada);
        }
        if (
          piloto.tempoSegundos &&
          (record.melhorTempo === null || piloto.tempoSegundos < record.melhorTempo)
        ) {
          record.melhorTempo = piloto.tempoSegundos;
        }
      });
    });

  const riderResultsList = Array.from(riderResultsMap.values()).sort(
    (a, b) => a.pontosTotal - b.pontosTotal
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Spectator Top Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-3 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-indigo-500/30 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 sm:gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2 flex-wrap">
              <span className="bg-indigo-500 text-white text-[10px] sm:text-xs font-black px-2 sm:px-3 py-0.5 sm:py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-md">
                <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-pulse text-amber-300" />
                ESPECTADORES
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] sm:text-xs font-mono font-bold px-2 py-0.5 rounded-full">
                OFICIAL CBC / UCI BMX
              </span>
            </div>

            <h2 className="text-xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight flex items-center gap-2">
              Portal do Espectador BMX
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-0.5 hidden sm:block">
              Consulte a lista completa de atletas inscritos por prova, acompanhe as baterias classificatórias e veja a tabela final de resultados em tempo real.
            </p>
          </div>

          {/* Quick Stat Badges */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full lg:w-auto shrink-0">
            <div className="bg-slate-900/80 backdrop-blur border border-indigo-500/30 rounded-xl sm:rounded-2xl p-2 sm:p-3 text-center">
              <div className="text-lg sm:text-2xl font-black text-amber-400 font-mono">
                {inscricoes.filter((i) => i.provaId === selectedProvaId).length}
              </div>
              <div className="text-[9px] sm:text-[10px] font-extrabold uppercase text-slate-400">
                Inscritos
              </div>
            </div>

            <div className="bg-slate-900/80 backdrop-blur border border-indigo-500/30 rounded-xl sm:rounded-2xl p-2 sm:p-3 text-center">
              <div className="text-lg sm:text-2xl font-black text-emerald-400 font-mono">
                {baterias.filter((b) => b.provaId === selectedProvaId).length}
              </div>
              <div className="text-[9px] sm:text-[10px] font-extrabold uppercase text-slate-400">
                Baterias
              </div>
            </div>

            <div className="bg-slate-900/80 backdrop-blur border border-indigo-500/30 rounded-xl sm:rounded-2xl p-2 sm:p-3 text-center">
              <div className="text-lg sm:text-2xl font-black text-blue-400 font-mono">
                {categorias.length}
              </div>
              <div className="text-[9px] sm:text-[10px] font-extrabold uppercase text-slate-400">
                Categorias
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selector & Filters Header */}
      <div className="bg-slate-900 p-3 sm:p-5 rounded-2xl border border-slate-800 shadow-xl space-y-3 sm:space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {/* Race Event Selector */}
          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-400" /> Prova / Evento
            </label>
            <select
              value={selectedProvaId}
              onChange={(e) => setSelectedProvaId(e.target.value)}
              className="w-full bg-slate-950 text-amber-300 font-black text-xs sm:text-sm rounded-xl px-2.5 sm:px-3.5 py-2 sm:py-2.5 border border-slate-700 focus:outline-none focus:border-amber-400 transition"
            >
              {provas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} ({p.local})
                </option>
              ))}
            </select>
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-emerald-400" /> Categoria
            </label>
            <select
              value={selectedCategoriaId}
              onChange={(e) => setSelectedCategoriaId(e.target.value)}
              className="w-full bg-slate-950 text-white font-bold text-xs sm:text-sm rounded-xl px-2.5 sm:px-3.5 py-2 sm:py-2.5 border border-slate-700 focus:outline-none focus:border-emerald-400 transition"
            >
              <option value="TODAS">Todas as Categorias ({categorias.length})</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome} ({c.faixaEtaria})
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div className="sm:col-span-2 md:col-span-1">
            <label className="block text-[11px] sm:text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
              <Search className="w-3.5 h-3.5 text-indigo-400" /> Buscar Piloto / Placa
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Ex: Speed, #101, Paulínia..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 text-white text-xs sm:text-sm font-semibold rounded-xl pl-8 pr-3 py-1.5 sm:py-2 border border-slate-700 focus:outline-none focus:border-indigo-400 transition"
              />
            </div>
          </div>
        </div>

        {/* Selected Race Details Ribbon */}
        {provaAtual && (
          <div className="bg-slate-950/80 p-2.5 sm:p-3 rounded-xl border border-slate-800 text-[11px] sm:text-xs text-slate-300 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1 font-bold text-amber-300">
                <MapPin className="w-3 h-3 text-amber-400" /> {provaAtual.local}
              </span>
              <span className="flex items-center gap-1 font-mono text-slate-400">
                <Clock className="w-3 h-3 text-slate-400" /> {provaAtual.dataInicio}
              </span>
            </div>
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-bold text-[10px]">
              {provaAtual.status}
            </span>
          </div>
        )}
      </div>

      {/* Sub Tabs Navigation (Inscritos vs Resultados vs Clubes) */}
      <div className="flex items-center overflow-x-auto pb-1 scrollbar-none gap-2 border-b border-slate-800">
        <button
          onClick={() => setActiveSubTab('INSCRITOS')}
          className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl font-black text-xs transition flex items-center gap-1.5 shrink-0 ${
            activeSubTab === 'INSCRITOS'
              ? 'bg-amber-400 text-slate-950 shadow-lg'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          Inscritos ({inscricoesDaProva.length})
        </button>

        <button
          onClick={() => setActiveSubTab('RESULTADOS')}
          className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl font-black text-xs transition flex items-center gap-1.5 shrink-0 ${
            activeSubTab === 'RESULTADOS'
              ? 'bg-emerald-500 text-slate-950 shadow-lg'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          Resultados & Baterias ({bateriasDaProva.length})
        </button>

        <button
          onClick={() => setActiveSubTab('CLUBES')}
          className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl font-black text-xs transition flex items-center gap-1.5 shrink-0 ${
            activeSubTab === 'CLUBES'
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Building className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          Equipes
        </button>
      </div>

      {/* TAB CONTENT: INSCRITOS DA PROVA */}
      {activeSubTab === 'INSCRITOS' && (
        <div className="space-y-6">
          {/* Quick Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategoriaId('TODAS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition ${
                selectedCategoriaId === 'TODAS'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
              }`}
            >
              Todas ({inscricoes.filter((i) => i.provaId === selectedProvaId).length})
            </button>
            {categoriasAtivasComInscritos.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoriaId(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition flex items-center gap-1.5 ${
                  selectedCategoriaId === cat.id
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <span>{cat.nome}</span>
                <span className="bg-slate-950/40 text-xs px-1.5 py-0.2 rounded font-mono">
                  {cat.totalInscritos}
                </span>
              </button>
            ))}
          </div>

          {/* Table / List of Athletes */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
            <div className="px-3 sm:px-6 py-3 sm:py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-black text-sm sm:text-lg text-white flex items-center gap-1.5 sm:gap-2">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                  Lista Oficial de Atletas
                </h3>
                <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 hidden sm:block">
                  Confirmados para competir na prova selecionada
                </p>
              </div>
              <span className="bg-amber-400/20 text-amber-300 font-mono font-bold text-[10px] sm:text-xs px-2.5 py-1 rounded-full border border-amber-400/30">
                {inscricoesDaProva.length} Atletas
              </span>
            </div>

            {/* Mobile Cards View (< sm) */}
            <div className="sm:hidden divide-y divide-slate-800/80">
              {inscricoesDaProva.length === 0 ? (
                <div className="text-center py-8 text-slate-500 font-bold text-xs">
                  Nenhum atleta localizado para os filtros informados.
                </div>
              ) : (
                inscricoesDaProva.map((ins) => (
                  <div key={ins.id} className="p-2.5 bg-slate-900/60 hover:bg-slate-800/80 transition space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono font-black text-amber-400 text-sm bg-slate-950 px-2 py-0.5 rounded border border-amber-400/30 shrink-0">
                          #{ins.numeroPlaca}
                        </span>
                        <div className="font-bold text-white text-xs truncate">
                          {ins.atletaNome}
                        </div>
                      </div>
                      <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] font-black px-1.5 py-0.5 rounded uppercase shrink-0">
                        {ins.statusPagamento}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 truncate text-slate-300">
                        <Building className="w-3 h-3 text-indigo-400 shrink-0" />
                        <span className="truncate">{ins.clubeNome}</span>
                      </span>
                      <span className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded text-[10px] font-bold shrink-0">
                        {ins.categoriaNome}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table View (>= sm) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-black uppercase tracking-wider">
                    <th className="py-3 px-4 w-20 text-center">PLACA</th>
                    <th className="py-3 px-4">ATLETA</th>
                    <th className="py-3 px-4">CLUBE / EQUIPE</th>
                    <th className="py-3 px-4">CATEGORIA</th>
                    <th className="py-3 px-4">TRANSPONDER</th>
                    <th className="py-3 px-4 text-center">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-semibold text-slate-200">
                  {inscricoesDaProva.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center py-10 text-slate-500 font-bold"
                      >
                        Nenhum atleta localizado para os filtros informados.
                      </td>
                    </tr>
                  ) : (
                    inscricoesDaProva.map((ins) => (
                      <tr
                        key={ins.id}
                        className="hover:bg-slate-800/60 transition group"
                      >
                        <td className="py-3.5 px-4 text-center font-mono font-black text-amber-400 text-base">
                          #{ins.numeroPlaca}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-extrabold text-white text-sm group-hover:text-amber-300 transition">
                            {ins.atletaNome}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            ID: {ins.atletaId}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          <div className="flex items-center gap-1.5 font-bold">
                            <Building className="w-3.5 h-3.5 text-indigo-400" />
                            {ins.clubeNome}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold px-2.5 py-1 rounded-lg">
                            {ins.categoriaNome}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-amber-400 font-extrabold">
                          {ins.transponderId || 'S/ TRANSPONDER'}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-black px-2.5 py-1 rounded-full uppercase flex items-center justify-center gap-1 w-28 mx-auto">
                            <CheckCircle2 className="w-3 h-3" />
                            {ins.statusPagamento}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: RESULTADOS & BATERIAS */}
      {activeSubTab === 'RESULTADOS' && (
        <div className="space-y-8">
          {/* Standings Summary Podium Card */}
          {riderResultsList.length > 0 && (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-amber-400" />
                  Classificação Geral e Menor Tempo de Volta
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  Somatório de Pontos (Regra UCI: Menor Pontuação Vence)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {riderResultsList.slice(0, 3).map((result, idx) => {
                  const colors = [
                    {
                      bg: 'bg-gradient-to-tr from-amber-500/20 via-amber-400/10 to-slate-900',
                      border: 'border-amber-400',
                      text: 'text-amber-400',
                      badge: '1º LUGAR — OURO 🥇',
                    },
                    {
                      bg: 'bg-gradient-to-tr from-slate-400/20 via-slate-300/10 to-slate-900',
                      border: 'border-slate-300',
                      text: 'text-slate-300',
                      badge: '2º LUGAR — PRATA 🥈',
                    },
                    {
                      bg: 'bg-gradient-to-tr from-amber-700/20 via-amber-600/10 to-slate-900',
                      border: 'border-amber-600',
                      text: 'text-amber-600',
                      badge: '3º LUGAR — BRONZE 🥉',
                    },
                  ][idx];

                  return (
                    <div
                      key={result.atletaId}
                      className={`${colors.bg} rounded-2xl border-2 ${colors.border} p-5 space-y-3 relative overflow-hidden`}
                    >
                      <div className="flex justify-between items-center">
                        <span
                          className={`text-[10px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-slate-950 ${colors.text}`}
                        >
                          {colors.badge}
                        </span>
                        <span className="font-mono font-black text-2xl text-amber-400">
                          #{result.numeroPlaca}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-black text-white text-lg leading-tight">
                          {result.atletaNome}
                        </h4>
                        <p className="text-xs text-slate-400 font-semibold mt-0.5">
                          {result.clubeNome}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-slate-500 text-[10px] uppercase font-bold block">
                            Total Pontos
                          </span>
                          <span className="font-mono font-black text-emerald-400 text-sm">
                            {result.pontosTotal} pts
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-500 text-[10px] uppercase font-bold block">
                            Melhor Volta
                          </span>
                          <span className="font-mono font-black text-blue-400 text-sm">
                            {result.melhorTempo
                              ? `${result.melhorTempo.toFixed(3)}s`
                              : '-'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* List of Heats (Motos UCI) */}
          <div className="space-y-6">
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Detalhamento de Baterias e Tempos
            </h3>

            {bateriasDaProva.length === 0 ? (
              <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 text-center text-slate-500 font-bold">
                Nenhuma bateria iniciada para os filtros selecionados.
              </div>
            ) : (
              bateriasDaProva.map((bateria) => (
                <div
                  key={bateria.id}
                  className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl"
                >
                  <div className="bg-slate-950 px-6 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="bg-amber-400 text-slate-950 text-xs font-black px-2.5 py-1 rounded uppercase">
                        Bateria {bateria.numeroBateria}
                      </span>
                      <h4 className="font-black text-white text-base">
                        {bateria.categoriaNome} — <span className="text-amber-300">{bateria.fase}</span>
                      </h4>
                    </div>

                    <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold px-3 py-0.5 rounded-full">
                      {bateria.status}
                    </span>
                  </div>

                  {/* Mobile View (< sm) */}
                  <div className="sm:hidden divide-y divide-slate-800/80">
                    {ordenarPilotosPorChegada(bateria.pilotos).map((p) => (
                      <div key={p.atletaId} className="p-2 bg-slate-900/60 hover:bg-slate-800/80 transition flex items-center justify-between text-xs gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono font-black text-amber-400 text-xs bg-slate-950 px-1.5 py-0.5 rounded border border-amber-400/30 shrink-0">
                            G{p.gate}
                          </span>
                          <span className="font-mono font-bold text-amber-300 text-xs shrink-0">
                            #{p.numeroPlaca}
                          </span>
                          <div className="truncate font-bold text-white text-xs">
                            {p.atletaNome}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono font-black text-emerald-400 text-xs">
                            {p.statusResult === 'DNF' ? (
                              <span className="bg-red-500/20 text-red-400 border border-red-500/40 text-[9px] px-1 py-0.2 rounded font-black">DNF</span>
                            ) : p.statusResult === 'DNS' ? (
                              <span className="bg-slate-800 text-slate-400 text-[9px] px-1 py-0.2 rounded font-bold">DNS</span>
                            ) : p.statusResult === 'REL' ? (
                              <span className="bg-purple-500/20 text-purple-300 text-[9px] px-1 py-0.2 rounded font-black">REL</span>
                            ) : p.posicaoChegada ? (
                              `${p.posicaoChegada}º`
                            ) : (
                              '-'
                            )}
                          </span>

                          <span className="font-mono font-bold text-blue-400 text-[11px]">
                            {p.tempoSegundos ? `${p.tempoSegundos.toFixed(2)}s` : '-'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop View (>= sm) */}
                  <div className="hidden sm:block p-4 overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase">
                          <th className="py-2 px-3 text-center w-16">GATE</th>
                          <th className="py-2 px-3 w-20">PLACA</th>
                          <th className="py-2 px-3">ATLETA</th>
                          <th className="py-2 px-3">CLUBE / EQUIPE</th>
                          <th className="py-2 px-3 text-center w-28">POSIÇÃO</th>
                          <th className="py-2 px-3 text-right w-32">TEMPO (S)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80 font-semibold">
                        {ordenarPilotosPorChegada(bateria.pilotos).map((p) => (
                          <tr
                            key={p.atletaId}
                            className="hover:bg-slate-800/50 transition"
                          >
                            <td className="py-2.5 px-3 text-center font-mono font-black text-amber-400 text-sm">
                              {p.gate}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-black text-amber-300 text-sm">
                              #{p.numeroPlaca}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-white text-sm">
                              {p.atletaNome}
                            </td>
                            <td className="py-2.5 px-3 text-slate-400">
                              {p.clubeNome}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-black text-emerald-400 text-base">
                              {p.statusResult === 'DNF' ? (
                                <span className="inline-block bg-red-500/20 text-red-400 border border-red-500/40 text-xs px-2 py-0.5 rounded font-black">
                                  DNF
                                </span>
                              ) : p.statusResult === 'DNS' ? (
                                <span className="inline-block bg-slate-800 text-slate-400 border border-slate-700 text-xs px-2 py-0.5 rounded font-bold">
                                  DNS
                                </span>
                              ) : p.statusResult === 'REL' ? (
                                <span className="inline-block bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs px-2 py-0.5 rounded font-black">
                                  REL
                                </span>
                              ) : p.posicaoChegada ? (
                                `${p.posicaoChegada}º`
                              ) : (
                                '-'
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-black text-blue-400 text-sm">
                              {p.tempoSegundos
                                ? `${p.tempoSegundos.toFixed(3)}s`
                                : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: EQUIPES NA DISPUTA */}
      {activeSubTab === 'CLUBES' && (
        <div className="space-y-6">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <Building className="w-5 h-5 text-indigo-400" />
              Equipes Representadas na Prova
            </h3>
            <p className="text-xs text-slate-400">
              Distribuição de inscritos e representantes por clube / equipe
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {clubes.map((clube) => {
                const atletasNoClube = inscricoes.filter(
                  (i) => i.provaId === selectedProvaId && i.clubeNome === clube.nomeEquipe
                );

                return (
                  <div
                    key={clube.id}
                    className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 flex flex-col justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={clube.logoUrl}
                        alt={clube.nomeEquipe}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-800 shrink-0"
                      />
                      <div>
                        <h4 className="font-extrabold text-white text-sm">
                          {clube.nomeEquipe}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {clube.estado}, {clube.pais}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-semibold">Inscritos na prova:</span>
                      <span className="bg-amber-400/20 text-amber-300 font-mono font-black px-2.5 py-0.5 rounded border border-amber-400/30">
                        {atletasNoClube.length} Atleta(s)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
