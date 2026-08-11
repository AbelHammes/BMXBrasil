import React, { useState } from 'react';
import { Categoria, Inscricao, ProvaEvento, Ranking } from '../../types/bmx';
import { Award, Plus, Trophy, Sliders, ChevronRight } from 'lucide-react';

interface RankingsManagerProps {
  rankings: Ranking[];
  setRankings: React.Dispatch<React.SetStateAction<Ranking[]>>;
  provas: ProvaEvento[];
  categorias: Categoria[];
  inscricoes: Inscricao[];
}

export const RankingsManager: React.FC<RankingsManagerProps> = ({
  rankings,
  setRankings,
  provas,
  categorias,
  inscricoes,
}) => {
  const [rankingAtivoId, setRankingAtivoId] = useState<string>(
    rankings[0]?.id || ''
  );
  const [categoriaId, setCategoriaId] = useState<string>(
    categorias[0]?.id || ''
  );

  const rankingAtivo = rankings.find((r) => r.id === rankingAtivoId);
  const categoriaAtiva = categorias.find((c) => c.id === categoriaId);

  // Filter events linked to this ranking
  const provasDoRanking = provas.filter((p) => p.rankingId === rankingAtivoId);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-amber-950 p-6 rounded-2xl border border-amber-500/30 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-amber-400 text-slate-950 text-xs font-black px-2.5 py-0.5 rounded uppercase flex items-center gap-1">
              <Award className="w-3.5 h-3.5" /> RANKINGS NACIONAIS
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 text-xs border border-emerald-500/30 px-2 py-0.5 rounded font-mono">
              Temporada 2026 CBC
            </span>
          </div>
          <h2 className="text-2xl font-black text-white">
            Classificação Geral Acumulada de Campeonatos
          </h2>
          <p className="text-sm text-slate-300 mt-0.5">
            Pontuação automática distribuída por posição de chegada em cada etapa do ranking.
          </p>
        </div>
      </div>

      {/* Selectors Bar */}
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-md grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">
            Campeonato / Ranking
          </label>
          <select
            value={rankingAtivoId}
            onChange={(e) => setRankingAtivoId(e.target.value)}
            className="w-full bg-slate-800 text-amber-300 font-bold text-sm rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:border-amber-400"
          >
            {rankings.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nomeRanking} ({r.etapasCount} Etapas)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">
            Categoria
          </label>
          <select
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            className="w-full bg-slate-800 text-white text-sm font-bold rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:border-amber-400"
          >
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome} ({c.tipoBike})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Ranking Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Standings Table (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Tabela de Pontuação — {categoriaAtiva?.nome}
            </h3>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full">
              Etapas Vinculadas: {provasDoRanking.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                  <th className="py-2.5 px-3 text-center">POS</th>
                  <th className="py-2.5 px-3">ATLETA</th>
                  <th className="py-2.5 px-3">CLUBE / EQUIPE</th>
                  <th className="py-2.5 px-3 text-center">ETAPA 1 (IND)</th>
                  <th className="py-2.5 px-3 text-center">ETAPA 2 (AME)</th>
                  <th className="py-2.5 px-3 text-center font-black text-emerald-700">TOTAL PTS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {/* Mocked Athlete Standings for display */}
                <tr className="hover:bg-slate-50 font-medium">
                  <td className="py-3 px-3 text-center font-black text-amber-500 text-sm">
                    1º
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-900">
                    Pedro Henrique "Speed" Santos
                  </td>
                  <td className="py-3 px-3 text-slate-500">Clube BMX São José dos Campos</td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">100</td>
                  <td className="py-3 px-3 text-center font-mono text-slate-400">-</td>
                  <td className="py-3 px-3 text-center font-mono font-black text-emerald-600 text-base">
                    100 pts
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 font-medium">
                  <td className="py-3 px-3 text-center font-black text-slate-400 text-sm">
                    2º
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-900">
                    Lucas "Fly" Vasconcelos
                  </td>
                  <td className="py-3 px-3 text-slate-500">Paulínia Racing BMX</td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">80</td>
                  <td className="py-3 px-3 text-center font-mono text-slate-400">-</td>
                  <td className="py-3 px-3 text-center font-mono font-black text-emerald-600 text-base">
                    80 pts
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 font-medium">
                  <td className="py-3 px-3 text-center font-black text-amber-700 text-sm">
                    3º
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-900">
                    Gabriel "Rocket" Almeida
                  </td>
                  <td className="py-3 px-3 text-slate-500">Serra BMX Racing Team</td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">65</td>
                  <td className="py-3 px-3 text-center font-mono text-slate-400">-</td>
                  <td className="py-3 px-3 text-center font-mono font-black text-emerald-600 text-base">
                    65 pts
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 font-medium">
                  <td className="py-3 px-3 text-center font-black text-slate-600 text-sm">
                    4º
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-900">
                    Matheus "Jump" Ferreira
                  </td>
                  <td className="py-3 px-3 text-slate-500">ASSOBMX Rio</td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">55</td>
                  <td className="py-3 px-3 text-center font-mono text-slate-400">-</td>
                  <td className="py-3 px-3 text-center font-mono font-black text-emerald-600 text-base">
                    55 pts
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Scoring Scale Config Box */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 text-white shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sliders className="w-5 h-5 text-amber-400" />
            <h3 className="font-black text-base text-white">
              Regra de Pontuação Oficial UCI / CBC
            </h3>
          </div>

          <p className="text-xs text-slate-400">
            Pontos concedidos de acordo com a colocação final na prova:
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            {rankingAtivo?.pontuacaoRegra.map((p) => (
              <div
                key={p.posicao}
                className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex justify-between items-center"
              >
                <span className="text-slate-400 font-bold">{p.posicao}º Lugar</span>
                <span className="text-amber-400 font-black">{p.pontos} pts</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
