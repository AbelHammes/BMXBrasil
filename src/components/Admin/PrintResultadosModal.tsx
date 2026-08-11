import React, { useState } from 'react';
import { BateriaMoto, Categoria, ProvaEvento } from '../../types/bmx';
import { calcularResultadoAcumuladoQualificatorias } from '../../utils/uciBmEngine';
import { Printer, X, Trophy, Award, CheckCircle2, ShieldCheck } from 'lucide-react';

interface PrintResultadosModalProps {
  isOpen: boolean;
  onClose: () => void;
  provas: ProvaEvento[];
  categorias: Categoria[];
  baterias: BateriaMoto[];
  provaSelecionadaId: string;
  categoriaSelecionadaId: string;
}

export const PrintResultadosModal: React.FC<PrintResultadosModalProps> = ({
  isOpen,
  onClose,
  provas,
  categorias,
  baterias,
  provaSelecionadaId,
  categoriaSelecionadaId,
}) => {
  const [escopoCategoria, setEscopoCategoria] = useState<'TODAS' | 'SELECIONADA'>('SELECIONADA');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>(categoriaSelecionadaId);
  const [escopoBateria, setEscopoBateria] = useState<'TODAS' | 'SELECIONADA'>('TODAS');
  const [bateriaFiltroId, setBateriaFiltroId] = useState<string>('');
  
  const [tipoFiltroResultado, setTipoFiltroResultado] = useState<
    'POR_BATERIA' | 'GERAL_ACUMULADO' | 'TOP_8_FINALISTAS' | 'PREMIACAO_ELEGIVEIS'
  >('GERAL_ACUMULADO');

  const [topPremiacaoCount, setTopPremiacaoCount] = useState<number>(3); // Top 3, Top 5, or Top 8

  if (!isOpen) return null;

  const provaAtiva = provas.find((p) => p.id === provaSelecionadaId);

  // Filter categories to print
  const categoriasParaImprimir = escopoCategoria === 'TODAS'
    ? categorias
    : categorias.filter((c) => c.id === categoriaFiltro);

  const handleImprimir = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full text-slate-100 shadow-2xl overflow-hidden my-8 print:border-none print:shadow-none print:bg-white print:text-black print:max-w-none print:w-full">
        {/* Modal Controls Header - Hidden on Print */}
        <div className="p-5 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg text-white">Impressão de Relatório de Resultados</h3>
              <p className="text-xs text-slate-400">
                Emita relatórios oficiais de apuração, classificação geral, finalistas top 8 e pódio de premiação
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

        {/* Modal Options Configuration - Hidden on Print */}
        <div className="p-5 bg-slate-950/60 border-b border-slate-800 space-y-4 print:hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Category Scope */}
            <div>
              <label className="block text-xs font-bold text-amber-400 uppercase mb-1">
                Filtro de Categorias
              </label>
              <select
                value={escopoCategoria}
                onChange={(e) => setEscopoCategoria(e.target.value as 'TODAS' | 'SELECIONADA')}
                className="w-full bg-slate-800 text-white font-semibold text-xs rounded-lg p-2.5 border border-slate-700 focus:outline-none focus:border-amber-400"
              >
                <option value="SELECIONADA">🏷️ Apenas Categoria Selecionada</option>
                <option value="TODAS">🌐 Todas as Categorias da Prova</option>
              </select>
            </div>

            {/* Selected Category dropdown */}
            {escopoCategoria === 'SELECIONADA' && (
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

            {/* Type of Result Report */}
            <div>
              <label className="block text-xs font-bold text-emerald-400 uppercase mb-1">
                Tipo / Filtro do Relatório
              </label>
              <select
                value={tipoFiltroResultado}
                onChange={(e) =>
                  setTipoFiltroResultado(
                    e.target.value as
                      | 'POR_BATERIA'
                      | 'GERAL_ACUMULADO'
                      | 'TOP_8_FINALISTAS'
                      | 'PREMIACAO_ELEGIVEIS'
                  )
                }
                className="w-full bg-slate-800 text-amber-300 font-bold text-xs rounded-lg p-2.5 border border-slate-700 focus:outline-none focus:border-amber-400"
              >
                <option value="GERAL_ACUMULADO">🏆 Resultado Geral Acumulado (Motos M1+M2+M3)</option>
                <option value="TOP_8_FINALISTAS">⚡ Somente os 8 Melhores Colocados (Finalistas)</option>
                <option value="PREMIACAO_ELEGIVEIS">🏅 Somente Elegíveis para Premiação (Pódio)</option>
                <option value="POR_BATERIA">🏁 Resultados Detalhados por Bateria</option>
              </select>
            </div>

            {/* Heat Scope if POR_BATERIA */}
            {tipoFiltroResultado === 'POR_BATERIA' && (
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Filtro de Baterias
                </label>
                <select
                  value={escopoBateria}
                  onChange={(e) => setEscopoBateria(e.target.value as 'TODAS' | 'SELECIONADA')}
                  className="w-full bg-slate-800 text-white font-semibold text-xs rounded-lg p-2.5 border border-slate-700 focus:outline-none focus:border-amber-400"
                >
                  <option value="TODAS">Todas as Baterias</option>
                  <option value="SELECIONADA">Apenas Bateria Específica</option>
                </select>
              </div>
            )}

            {/* Podium size if PREMIACAO_ELEGIVEIS */}
            {tipoFiltroResultado === 'PREMIACAO_ELEGIVEIS' && (
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Atletas Elegíveis no Pódio
                </label>
                <select
                  value={topPremiacaoCount}
                  onChange={(e) => setTopPremiacaoCount(Number(e.target.value))}
                  className="w-full bg-slate-800 text-amber-300 font-bold text-xs rounded-lg p-2.5 border border-slate-700 focus:outline-none focus:border-amber-400"
                >
                  <option value={3}>Top 3 (Troféus 1º, 2º e 3º Lugar)</option>
                  <option value={5}>Top 5 (Premiação até 5º Lugar)</option>
                  <option value={8}>Top 8 (Finalistas Elegíveis a Troféu/Medalha)</option>
                </select>
              </div>
            )}

            {/* Specific Heat Selector */}
            {tipoFiltroResultado === 'POR_BATERIA' && escopoBateria === 'SELECIONADA' && (
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Bateria
                </label>
                <select
                  value={bateriaFiltroId}
                  onChange={(e) => setBateriaFiltroId(e.target.value)}
                  className="w-full bg-slate-800 text-white font-semibold text-xs rounded-lg p-2.5 border border-slate-700 focus:outline-none focus:border-amber-400"
                >
                  <option value="">-- Selecione uma bateria --</option>
                  {baterias
                    .filter(
                      (b) =>
                        b.provaId === provaSelecionadaId &&
                        (escopoCategoria === 'TODAS' || b.categoriaId === categoriaFiltro)
                    )
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.categoriaNome} - {b.fase} - Bateria {b.numeroBateria}
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-emerald-400 font-mono">
              Relatório Pronto para Impressão:{' '}
              <strong className="text-white">
                {tipoFiltroResultado === 'GERAL_ACUMULADO' && 'Resultado Geral (Pontos UCI)'}
                {tipoFiltroResultado === 'TOP_8_FINALISTAS' && 'Top 8 Finalistas'}
                {tipoFiltroResultado === 'PREMIACAO_ELEGIVEIS' && `Elegíveis ao Pódio (Top ${topPremiacaoCount})`}
                {tipoFiltroResultado === 'POR_BATERIA' && 'Apuração Detalhada por Bateria'}
              </strong>
            </div>

            <button
              onClick={handleImprimir}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-5 py-2.5 rounded-xl shadow-lg transition flex items-center gap-2 text-sm"
            >
              <Printer className="w-4 h-4" />
              Imprimir Relatório de Resultados
            </button>
          </div>
        </div>

        {/* Printable Document Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-8 print:max-h-none print:overflow-visible print:p-0 print:space-y-6">
          {categoriasParaImprimir.map((cat) => {
            const bateriasCategoria = baterias.filter(
              (b) => b.provaId === provaSelecionadaId && b.categoriaId === cat.id
            );

            const standings = calcularResultadoAcumuladoQualificatorias(bateriasCategoria);

            let standingsExibicao = standings;

            if (tipoFiltroResultado === 'TOP_8_FINALISTAS') {
              standingsExibicao = standings.slice(0, 8);
            } else if (tipoFiltroResultado === 'PREMIACAO_ELEGIVEIS') {
              standingsExibicao = standings.slice(0, topPremiacaoCount);
            }

            // Filter heats if POR_BATERIA is selected
            let bateriasExibicao = bateriasCategoria;
            if (escopoBateria === 'SELECIONADA' && bateriaFiltroId) {
              bateriasExibicao = bateriasCategoria.filter((b) => b.id === bateriaFiltroId);
            }

            if (
              tipoFiltroResultado === 'POR_BATERIA' &&
              bateriasExibicao.length === 0
            ) {
              return null;
            }

            if (
              tipoFiltroResultado !== 'POR_BATERIA' &&
              standingsExibicao.length === 0
            ) {
              return (
                <div key={cat.id} className="p-4 bg-slate-950 rounded-xl text-slate-400 text-xs">
                  Categoria: <strong>{cat.nome}</strong> — Nenhum resultado apurado ainda.
                </div>
              );
            }

            return (
              <div
                key={cat.id}
                className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4 print:bg-white print:text-black print:border-2 print:border-black print:rounded-none print:break-after-page print:p-4"
              >
                {/* Header Banner */}
                <div className="border-b-2 border-slate-700 print:border-black pb-3 flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 print:text-gray-700 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 print:hidden" /> RELATÓRIO OFICIAL DE RESULTADOS / BMX APURAÇÃO
                    </span>
                    <h2 className="text-xl font-black text-white print:text-black uppercase">
                      {provaAtiva?.nome || 'CAMPEONATO DE BMX'}
                    </h2>
                    <p className="text-xs text-slate-300 print:text-gray-800 font-bold">
                      Categoria: <span className="text-amber-300 print:text-black">{cat.nome}</span> ({cat.tipoBike}) |{' '}
                      Tipo: <span className="text-emerald-400 print:text-black">
                        {tipoFiltroResultado === 'GERAL_ACUMULADO' && 'Resultado Geral Acumulado'}
                        {tipoFiltroResultado === 'TOP_8_FINALISTAS' && 'Somente Melhores 8 Colocados (Finalistas)'}
                        {tipoFiltroResultado === 'PREMIACAO_ELEGIVEIS' && `Somente Elegíveis para Premiação (Top ${topPremiacaoCount})`}
                        {tipoFiltroResultado === 'POR_BATERIA' && 'Resultados das Baterias'}
                      </span>
                    </p>
                  </div>
                  <div className="text-right text-xs text-slate-400 print:text-gray-800 font-mono">
                    <div>Data: {new Date().toLocaleDateString('pt-BR')}</div>
                    <div>Horário: {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>

                {/* Table Rendering Based on Selection */}
                {tipoFiltroResultado === 'POR_BATERIA' ? (
                  /* Display results grouped by heat */
                  <div className="space-y-4">
                    {bateriasExibicao.map((b) => (
                      <div key={b.id} className="border border-slate-800 print:border-black p-3 rounded-lg">
                        <div className="font-bold text-xs text-amber-300 print:text-black mb-2 flex justify-between">
                          <span>{b.fase} — Bateria {b.numeroBateria}</span>
                          <span className="font-mono text-slate-400 print:text-black">Status: {b.status}</span>
                        </div>
                        <table className="w-full text-left border-collapse border border-slate-700 print:border-black text-xs">
                          <thead>
                            <tr className="bg-slate-800 print:bg-gray-200 text-slate-200 print:text-black uppercase font-black text-[10px]">
                              <th className="py-1.5 px-2 text-center border-r border-slate-700 print:border-black w-12">GATE</th>
                              <th className="py-1.5 px-2 text-center border-r border-slate-700 print:border-black w-16">PLACA</th>
                              <th className="py-1.5 px-2 border-r border-slate-700 print:border-black">ATLETA</th>
                              <th className="py-1.5 px-2 border-r border-slate-700 print:border-black">CLUBE / EQUIPE</th>
                              <th className="py-1.5 px-2 text-center border-r border-slate-700 print:border-black w-20">POSIÇÃO</th>
                              <th className="py-1.5 px-2 text-center w-20">PONTOS</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800 print:divide-black">
                            {b.pilotos.map((p) => (
                              <tr key={p.atletaId}>
                                <td className="py-1.5 px-2 text-center border-r border-slate-800 print:border-black font-black text-amber-400 print:text-black">
                                  {p.gate}
                                </td>
                                <td className="py-1.5 px-2 text-center border-r border-slate-800 print:border-black font-mono font-black text-white print:text-black">
                                  #{p.numeroPlaca}
                                </td>
                                <td className="py-1.5 px-2 border-r border-slate-800 print:border-black font-bold text-white print:text-black">
                                  {p.atletaNome}
                                </td>
                                <td className="py-1.5 px-2 border-r border-slate-800 print:border-black text-slate-300 print:text-gray-800">
                                  {p.clubeNome}
                                </td>
                                <td className="py-1.5 px-2 text-center border-r border-slate-800 print:border-black font-bold font-mono">
                                  {p.statusResult === 'DNF'
                                    ? 'DNF'
                                    : p.statusResult === 'DNS'
                                    ? 'DNS'
                                    : p.statusResult === 'REL'
                                    ? 'REL'
                                    : p.posicaoChegada
                                    ? `${p.posicaoChegada}º`
                                    : '-'}
                                </td>
                                <td className="py-1.5 px-2 text-center font-mono font-black text-emerald-400 print:text-black">
                                  {p.pontosMoto !== undefined ? `${p.pontosMoto} pt` : '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Display accumulated / finalists / podium table */
                  <table className="w-full text-left border-collapse border border-slate-700 print:border-black text-xs">
                    <thead>
                      <tr className="bg-slate-800 print:bg-gray-200 text-slate-200 print:text-black uppercase font-black text-[11px] border-b border-slate-700 print:border-black">
                        <th className="py-2 px-2 text-center border-r border-slate-700 print:border-black w-12">POS</th>
                        <th className="py-2 px-2 text-center border-r border-slate-700 print:border-black w-16">PLACA</th>
                        <th className="py-2 px-2 border-r border-slate-700 print:border-black">ATLETA</th>
                        <th className="py-2 px-2 border-r border-slate-700 print:border-black">CLUBE / EQUIPE</th>
                        <th className="py-2 px-2 text-center border-r border-slate-700 print:border-black w-12">M1</th>
                        <th className="py-2 px-2 text-center border-r border-slate-700 print:border-black w-12">M2</th>
                        <th className="py-2 px-2 text-center border-r border-slate-700 print:border-black w-12">M3</th>
                        <th className="py-2 px-2 text-center border-r border-slate-700 print:border-black w-24">TOTAL PTS</th>
                        <th className="py-2 px-2 text-center w-28">SITUAÇÃO</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 print:divide-black">
                      {standingsExibicao.map((st, idx) => (
                        <tr key={st.atletaId} className="print:text-black">
                          <td className="py-2 px-2 text-center border-r border-slate-800 print:border-black font-black text-amber-400 print:text-black text-sm">
                            {idx + 1}º
                          </td>
                          <td className="py-2 px-2 text-center border-r border-slate-800 print:border-black font-mono font-black text-white print:text-black">
                            #{st.numeroPlaca}
                          </td>
                          <td className="py-2 px-2 border-r border-slate-800 print:border-black font-bold text-white print:text-black">
                            {st.atletaNome}
                          </td>
                          <td className="py-2 px-2 border-r border-slate-800 print:border-black text-slate-300 print:text-gray-800">
                            {st.clubeNome}
                          </td>
                          <td className="py-2 px-2 text-center border-r border-slate-800 print:border-black font-mono text-slate-300 print:text-black">
                            {st.pontosMoto1 || '-'}
                          </td>
                          <td className="py-2 px-2 text-center border-r border-slate-800 print:border-black font-mono text-slate-300 print:text-black">
                            {st.pontosMoto2 || '-'}
                          </td>
                          <td className="py-2 px-2 text-center border-r border-slate-800 print:border-black font-mono text-slate-300 print:text-black">
                            {st.pontosMoto3 || '-'}
                          </td>
                          <td className="py-2 px-2 text-center border-r border-slate-800 print:border-black font-mono font-black text-amber-400 print:text-black text-sm">
                            {st.totalPontos} pts
                          </td>
                          <td className="py-2 px-2 text-center font-bold text-[10px]">
                            {idx < topPremiacaoCount && tipoFiltroResultado === 'PREMIACAO_ELEGIVEIS' ? (
                              <span className="bg-amber-400/20 text-amber-300 print:text-black border border-amber-400/40 px-2 py-0.5 rounded uppercase font-black">
                                🏅 PÓDIO ({idx + 1}º LUGAR)
                              </span>
                            ) : st.classificadoProximaFase ? (
                              <span className="bg-emerald-500/20 text-emerald-300 print:text-black border border-emerald-500/30 px-2 py-0.5 rounded">
                                CLASSIFICADO TOP 8
                              </span>
                            ) : (
                              <span className="text-slate-400 print:text-gray-600">
                                ELIMINADO
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* Footer Signatures for Official Approval */}
                <div className="pt-6 flex justify-between items-end text-[10px] text-slate-400 print:text-black font-sans">
                  <div>
                    <div>COMISSÃO TÉCNICA E ARBITRAGEM BMX</div>
                    <div>Relatório Homologado e Publicado Oficialmente</div>
                  </div>
                  <div className="flex gap-8 text-center">
                    <div>
                      <span className="block border-t border-slate-600 print:border-black pt-1 w-36 font-bold">
                        Diretor da Prova
                      </span>
                    </div>
                    <div>
                      <span className="block border-t border-slate-600 print:border-black pt-1 w-36 font-bold">
                        Árbitro Geral UCI
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
