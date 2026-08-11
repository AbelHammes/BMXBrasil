import React, { useState } from 'react';
import { BateriaMoto, Categoria, ProvaEvento } from '../../types/bmx';
import { Printer, X, FileText, CheckCircle2, Zap } from 'lucide-react';

interface PrintBateriasModalProps {
  isOpen: boolean;
  onClose: () => void;
  provas: ProvaEvento[];
  categorias: Categoria[];
  baterias: BateriaMoto[];
  provaSelecionadaId: string;
  categoriaSelecionadaId: string;
}

export const PrintBateriasModal: React.FC<PrintBateriasModalProps> = ({
  isOpen,
  onClose,
  provas,
  categorias,
  baterias,
  provaSelecionadaId,
  categoriaSelecionadaId,
}) => {
  const [escopo, setEscopo] = useState<'TODA_PROVA' | 'CATEGORIA' | 'BATERIA'>('TODA_PROVA');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>(categoriaSelecionadaId);
  const [bateriaFiltroId, setBateriaFiltroId] = useState<string>('');
  const [faseFiltro, setFaseFiltro] = useState<string>('TODAS');

  if (!isOpen) return null;

  const provaAtiva = provas.find((p) => p.id === provaSelecionadaId);

  // Filter baterias according to user selection
  let bateriasParaImprimir = baterias.filter((b) => b.provaId === provaSelecionadaId);

  if (escopo === 'CATEGORIA') {
    bateriasParaImprimir = bateriasParaImprimir.filter((b) => b.categoriaId === categoriaFiltro);
  } else if (escopo === 'BATERIA') {
    if (bateriaFiltroId) {
      bateriasParaImprimir = bateriasParaImprimir.filter((b) => b.id === bateriaFiltroId);
    } else if (categoriaFiltro) {
      bateriasParaImprimir = bateriasParaImprimir.filter((b) => b.categoriaId === categoriaFiltro);
    }
  }

  if (faseFiltro !== 'TODAS') {
    bateriasParaImprimir = bateriasParaImprimir.filter((b) => b.fase === faseFiltro);
  }

  // Sort baterias in race sequence
  bateriasParaImprimir.sort((a, b) => {
    if (a.fase !== b.fase) return a.fase.localeCompare(b.fase);
    if (a.categoriaNome !== b.categoriaNome) return a.categoriaNome.localeCompare(b.categoriaNome);
    return a.numeroBateria - b.numeroBateria;
  });

  const handleImprimir = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
      {/* Printable Area - styled for paper when printing */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full text-slate-100 shadow-2xl overflow-hidden my-8 print:border-none print:shadow-none print:bg-white print:text-black print:max-w-none print:w-full">
        {/* Modal Controls Header - Hidden on Print */}
        <div className="p-5 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-400 flex items-center justify-center font-bold">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg text-white">Impressão de Baterias / Súmulas</h3>
              <p className="text-xs text-slate-400">
                Gere súmulas de largada com alinhamento nos gates 1-8 para arbitragem e pista
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Configuration Form - Hidden on Print */}
        <div className="p-5 bg-slate-950/60 border-b border-slate-800 space-y-4 print:hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Escopo Selection */}
            <div>
              <label className="block text-xs font-bold text-amber-400 uppercase mb-1">
                Escopo da Impressão
              </label>
              <select
                value={escopo}
                onChange={(e) =>
                  setEscopo(e.target.value as 'TODA_PROVA' | 'CATEGORIA' | 'BATERIA')
                }
                className="w-full bg-slate-800 text-white font-semibold text-xs rounded-lg p-2.5 border border-slate-700 focus:outline-none focus:border-amber-400"
              >
                <option value="TODA_PROVA">🌐 Toda a Prova (Todas as Categorias)</option>
                <option value="CATEGORIA">🏷️ Somente Categoria Selecionada</option>
                <option value="BATERIA">🏁 Somente Bateria Específica</option>
              </select>
            </div>

            {/* Category selector if applicable */}
            {(escopo === 'CATEGORIA' || escopo === 'BATERIA') && (
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Selecione a Categoria
                </label>
                <select
                  value={categoriaFiltro}
                  onChange={(e) => {
                    setCategoriaFiltro(e.target.value);
                    setBateriaFiltroId('');
                  }}
                  className="w-full bg-slate-800 text-white font-semibold text-xs rounded-lg p-2.5 border border-slate-700 focus:outline-none focus:border-amber-400"
                >
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} ({c.tipoBike})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Specific Heat selector if applicable */}
            {escopo === 'BATERIA' && (
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Selecione a Bateria
                </label>
                <select
                  value={bateriaFiltroId}
                  onChange={(e) => setBateriaFiltroId(e.target.value)}
                  className="w-full bg-slate-800 text-white font-semibold text-xs rounded-lg p-2.5 border border-slate-700 focus:outline-none focus:border-amber-400"
                >
                  <option value="">-- Todas as baterias da categoria --</option>
                  {baterias
                    .filter(
                      (b) => b.provaId === provaSelecionadaId && b.categoriaId === categoriaFiltro
                    )
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.fase} - Bateria {b.numeroBateria} ({b.pilotos.length} pilotos)
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Phase filter */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                Fase da Corrida
              </label>
              <select
                value={faseFiltro}
                onChange={(e) => setFaseFiltro(e.target.value)}
                className="w-full bg-slate-800 text-white font-semibold text-xs rounded-lg p-2.5 border border-slate-700 focus:outline-none focus:border-amber-400"
              >
                <option value="TODAS">Todas as Fases</option>
                <option value="Classificatória 1">Moto 1 - Classificatória</option>
                <option value="Classificatória 2">Moto 2 - Classificatória</option>
                <option value="Classificatória 3">Moto 3 - Classificatória</option>
                <option value="Semifinal">Semifinal</option>
                <option value="Final">Grande Final</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-amber-300 font-mono">
              Total de Baterias Selecionadas para Impressão:{' '}
              <strong className="text-white text-sm">{bateriasParaImprimir.length}</strong>
            </div>

            <button
              onClick={handleImprimir}
              disabled={bateriasParaImprimir.length === 0}
              className="bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-black px-5 py-2.5 rounded-xl shadow-lg transition flex items-center gap-2 text-sm"
            >
              <Printer className="w-4 h-4" />
              Imprimir Súmulas ({bateriasParaImprimir.length})
            </button>
          </div>
        </div>

        {/* Printable Content View */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-8 print:max-h-none print:overflow-visible print:p-0 print:space-y-6">
          {bateriasParaImprimir.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-8">
              Nenhuma bateria encontrada com os filtros selecionados.
            </p>
          ) : (
            bateriasParaImprimir.map((bateria, idx) => (
              <div
                key={bateria.id}
                className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4 print:bg-white print:text-black print:border-2 print:border-black print:rounded-none print:break-after-page print:p-4"
              >
                {/* Printable Header */}
                <div className="border-b-2 border-slate-700 print:border-black pb-3 flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 print:text-gray-600">
                      SÚMULA DE LARGADA / START LIST — BMX MOTO ENGINE
                    </span>
                    <h2 className="text-xl font-black text-white print:text-black uppercase">
                      {provaAtiva?.nome || 'CAMPEONATO DE BMX'}
                    </h2>
                    <p className="text-xs text-slate-300 print:text-gray-700 font-bold">
                      Categoria: <span className="text-amber-300 print:text-black">{bateria.categoriaNome}</span> |{' '}
                      Fase: <span className="text-emerald-400 print:text-black">{bateria.fase}</span> |{' '}
                      Bateria: <span className="text-amber-400 print:text-black">#{bateria.numeroBateria}</span>
                    </p>
                  </div>
                  <div className="text-right text-xs text-slate-400 print:text-gray-800 font-mono">
                    <div>Data: {new Date().toLocaleDateString('pt-BR')}</div>
                    <div>Corrida #{idx + 1}</div>
                  </div>
                </div>

                {/* Riders Table */}
                <table className="w-full text-left border-collapse border border-slate-700 print:border-black text-xs">
                  <thead>
                    <tr className="bg-slate-800 print:bg-gray-200 text-slate-200 print:text-black uppercase font-black text-[11px] border-b border-slate-700 print:border-black">
                      <th className="py-2 px-2 text-center border-r border-slate-700 print:border-black w-12">GATE</th>
                      <th className="py-2 px-2 text-center border-r border-slate-700 print:border-black w-16">PLACA</th>
                      <th className="py-2 px-2 border-r border-slate-700 print:border-black">ATLETA</th>
                      <th className="py-2 px-2 border-r border-slate-700 print:border-black">CLUBE / EQUIPE</th>
                      <th className="py-2 px-2 text-center border-r border-slate-700 print:border-black w-24">TRANSPONDER</th>
                      <th className="py-2 px-2 text-center border-r border-slate-700 print:border-black w-20">POSIÇÃO</th>
                      <th className="py-2 px-2 text-center w-24">TEMPO (S)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 print:divide-black">
                    {bateria.pilotos.map((p) => (
                      <tr key={p.atletaId} className="print:text-black">
                        <td className="py-2 px-2 text-center border-r border-slate-800 print:border-black font-black text-amber-400 print:text-black text-sm">
                          {p.gate}
                        </td>
                        <td className="py-2 px-2 text-center border-r border-slate-800 print:border-black font-mono font-black text-white print:text-black">
                          #{p.numeroPlaca}
                        </td>
                        <td className="py-2 px-2 border-r border-slate-800 print:border-black font-bold text-white print:text-black">
                          {p.atletaNome}
                        </td>
                        <td className="py-2 px-2 border-r border-slate-800 print:border-black text-slate-300 print:text-gray-800">
                          {p.clubeNome}
                        </td>
                        <td className="py-2 px-2 text-center border-r border-slate-800 print:border-black font-mono text-slate-400 print:text-black text-[10px]">
                          {p.transponderId || '-'}
                        </td>
                        <td className="py-2 px-2 text-center border-r border-slate-800 print:border-black font-mono font-bold text-emerald-400 print:text-black">
                          {p.statusResult === 'DNF'
                            ? 'DNF'
                            : p.statusResult === 'DNS'
                            ? 'DNS'
                            : p.statusResult === 'REL'
                            ? 'REL'
                            : p.posicaoChegada
                            ? `${p.posicaoChegada}º`
                            : '[   ]'}
                        </td>
                        <td className="py-2 px-2 text-center font-mono text-blue-300 print:text-black">
                          {p.tempoSegundos ? `${p.tempoSegundos.toFixed(3)}s` : '[       ]'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Footer Signature for Referees */}
                <div className="pt-4 flex justify-between items-end text-[10px] text-slate-400 print:text-black font-sans">
                  <div>
                    <span>Observações do Árbitro: ____________________________________________________</span>
                  </div>
                  <div className="text-right">
                    <span className="block border-t border-slate-600 print:border-black pt-1 w-48 font-bold text-center">
                      Assinatura do Árbitro Geral
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
