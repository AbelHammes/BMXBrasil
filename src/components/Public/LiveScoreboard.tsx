import React, { useState } from 'react';
import { BateriaMoto, Categoria, ProvaEvento } from '../../types/bmx';
import { ordenarPilotosPorChegada } from '../../utils/uciBmEngine';
import {
  Volume2,
  Trophy,
  Zap,
  Radio,
  Search,
  CheckCircle2,
  Users,
} from 'lucide-react';

interface LiveScoreboardProps {
  provas: ProvaEvento[];
  categorias: Categoria[];
  baterias: BateriaMoto[];
}

export const LiveScoreboard: React.FC<LiveScoreboardProps> = ({
  provas,
  categorias,
  baterias,
}) => {
  const [provaId, setProvaId] = useState<string>(provas[0]?.id || '');
  const [categoriaId, setCategoriaId] = useState<string>(categorias[0]?.id || '');
  const [busca, setBusca] = useState<string>('');

  const bateriasFiltradas = baterias.filter(
    (b) =>
      b.provaId === provaId &&
      b.categoriaId === categoriaId &&
      (busca === '' ||
        b.pilotos.some(
          (p) =>
            p.atletaNome.toLowerCase().includes(busca.toLowerCase()) ||
            p.numeroPlaca.includes(busca)
        ))
  );

  return (
    <div className="space-y-6">
      {/* Broadcast Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-slate-950 to-blue-900 p-6 rounded-2xl border-2 border-amber-400 text-white shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-red-600 text-white text-xs font-black px-2.5 py-0.5 rounded uppercase animate-pulse flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
              TRANSMISSÃO AO VIVO
            </span>
            <span className="bg-amber-400 text-slate-950 text-xs font-mono font-bold px-2 py-0.5 rounded">
              SISTEMA DE CRONOMETRAGEM
            </span>
          </div>
          <h2 className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
            PLACAR NACIONAL DE PROVA <Volume2 className="w-6 h-6 text-amber-400" />
          </h2>
          <p className="text-sm text-slate-300 mt-0.5">
            Acompanhamento em tempo real dos tempos de volta, gatilhos de largada e posições de chegada.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={provaId}
            onChange={(e) => setProvaId(e.target.value)}
            className="bg-slate-900 text-amber-300 font-extrabold text-xs rounded-xl px-3 py-2.5 border border-slate-700 focus:outline-none"
          >
            {provas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>

          <select
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            className="bg-slate-900 text-white font-extrabold text-xs rounded-xl px-3 py-2.5 border border-slate-700 focus:outline-none"
          >
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        <input
          type="text"
          placeholder="Filtrar piloto por Nome ou Placa (ex: Speed ou 101)..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 shadow-sm"
        />
      </div>

      {/* Heats Scoreboard Cards */}
      {bateriasFiltradas.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500 font-bold text-sm">
          Nenhuma bateria encontrada para os filtros selecionados.
        </div>
      ) : (
        <div className="space-y-6">
          {bateriasFiltradas.map((bateria) => (
            <div
              key={bateria.id}
              className="bg-slate-950 rounded-2xl border-2 border-slate-800 shadow-2xl overflow-hidden text-white"
            >
              {/* Heat Header */}
              <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="bg-amber-400 text-slate-950 font-black text-sm px-3 py-1 rounded-lg uppercase">
                    Bateria {bateria.numeroBateria}
                  </span>
                  <h3 className="text-xl font-black text-white">
                    {bateria.categoriaNome} — <span className="text-amber-300">{bateria.fase}</span>
                  </h3>
                </div>

                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-3 py-1 rounded-full text-xs font-mono font-bold">
                  {bateria.status}
                </span>
              </div>

              {/* Table of Athletes */}
              <div className="p-4 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <th className="py-2 px-3 text-center w-16">GATE</th>
                      <th className="py-2 px-3 w-20">PLACA</th>
                      <th className="py-2 px-3">ATLETA</th>
                      <th className="py-2 px-3">CLUBE / EQUIPE</th>
                      <th className="py-2 px-3 text-center w-28">POSIÇÃO</th>
                      <th className="py-2 px-3 text-right w-32">TEMPO (S)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-sm font-semibold">
                    {ordenarPilotosPorChegada(bateria.pilotos).map((p) => (
                      <tr key={p.atletaId} className="hover:bg-slate-900/80 transition">
                        <td className="py-3 px-3 text-center font-mono font-black text-amber-400 text-base">
                          {p.gate}
                        </td>
                        <td className="py-3 px-3 font-mono font-black text-amber-300 text-base">
                          #{p.numeroPlaca}
                        </td>
                        <td className="py-3 px-3 font-bold text-white text-base">
                          {p.atletaNome}
                        </td>
                        <td className="py-3 px-3 text-slate-400 text-xs">{p.clubeNome}</td>
                        <td className="py-3 px-3 text-center font-mono font-black text-emerald-400 text-lg">
                          {p.statusResult === 'DNF' ? (
                            <span className="inline-block bg-red-500/20 text-red-400 border border-red-500/40 text-xs px-2.5 py-0.5 rounded font-black">
                              DNF
                            </span>
                          ) : p.statusResult === 'DNS' ? (
                            <span className="inline-block bg-slate-800 text-slate-400 border border-slate-700 text-xs px-2.5 py-0.5 rounded font-bold">
                              DNS
                            </span>
                          ) : p.statusResult === 'REL' ? (
                            <span className="inline-block bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs px-2.5 py-0.5 rounded font-black">
                              REL
                            </span>
                          ) : p.posicaoChegada ? (
                            `${p.posicaoChegada}º`
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-black text-blue-400 text-base">
                          {p.tempoSegundos ? `${p.tempoSegundos.toFixed(3)}s` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
