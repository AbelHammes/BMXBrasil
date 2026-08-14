import React, { useState } from 'react';
import {
  BateriaMoto,
  Categoria,
  CategoriaCombinada,
  FaseMoto,
  Inscricao,
  PilotoMotoState,
  ProvaEvento,
} from '../../types/bmx';
import {
  calcularResultadoAcumuladoQualificatorias,
  desmembrarResultadosPorCategoriaOriginal,
  gerarBateriasQualificatorias,
  recalcularPontosBateria,
  calcularPontosPilotoMoto,
  MetodoSorteio,
  RiderInscritoInput,
} from '../../utils/uciBmEngine';
import {
  Award,
  CheckCircle2,
  Download,
  Play,
  RefreshCw,
  Trophy,
  Zap,
  Clock,
  UserCheck,
  Send,
  Sliders,
  ChevronRight,
  RotateCcw,
  Info,
  HelpCircle,
  Printer,
  ListOrdered,
  Search,
  ShieldCheck,
  HardDrive,
  X,
} from 'lucide-react';
import { salvarSnapshotNoStorage } from '../../utils/backupAndIntegrity';
import { enviarNotificacaoAtleta } from '../../utils/browserNotifications';
import { PrintBateriasModal } from './PrintBateriasModal';
import { PrintResultadosModal } from './PrintResultadosModal';

interface RaceEngineSQORZProps {
  provas: ProvaEvento[];
  setProvas?: React.Dispatch<React.SetStateAction<ProvaEvento[]>>;
  categorias: Categoria[];
  inscricoes: Inscricao[];
  setInscricoes?: React.Dispatch<React.SetStateAction<Inscricao[]>>;
  baterias: BateriaMoto[];
  setBaterias: React.Dispatch<React.SetStateAction<BateriaMoto[]>>;
}

export const RaceEngineSQORZ: React.FC<RaceEngineSQORZProps> = ({
  provas,
  setProvas,
  categorias,
  inscricoes,
  setInscricoes,
  baterias,
  setBaterias,
}) => {
  const [provaSelecionadaId, setProvaSelecionadaId] = useState<string>(
    provas[0]?.id || ''
  );
  const [categoriaSelecionadaId, setCategoriaSelecionadaId] = useState<string>(
    categorias[0]?.id || ''
  );
  const [faseFiltro, setFaseFiltro] = useState<FaseMoto>('Moto 1');
  const [modoEntrada, setModoEntrada] = useState<'POSICAO' | 'TEMPO'>('POSICAO');
  const [metodoSorteio, setMetodoSorteio] = useState<MetodoSorteio>('UCI_RANDOM');
  const [mensagemStatus, setMensagemStatus] = useState<string | null>(null);

  // Combine categories modal state
  const [showCombineModal, setShowCombineModal] = useState<boolean>(false);
  const [selectedCatIdsToCombine, setSelectedCatIdsToCombine] = useState<string[]>([]);
  const [nomeCombinadaInput, setNomeCombinadaInput] = useState<string>('');
  const [modoExibicaoStandings, setModoExibicaoStandings] = useState<'COMBINADO' | 'DESMEMBRADO'>('COMBINADO');

  // New features state
  const [modoVisualizacao, setModoVisualizacao] = useState<'POR_CATEGORIA' | 'ORDEM_CORRIDAS'>('POR_CATEGORIA');
  const [faseOrdemCorridas, setFaseOrdemCorridas] = useState<string>('TODAS');
  const [buscaOrdemCorridas, setBuscaOrdemCorridas] = useState<string>('');

  const [showPrintBateriasModal, setShowPrintBateriasModal] = useState<boolean>(false);
  const [showPrintResultadosModal, setShowPrintResultadosModal] = useState<boolean>(false);

  const provaAtiva = provas.find((p) => p.id === provaSelecionadaId);
  const minAtletasRegra = provaAtiva?.minAtletasCategoria || 4;

  // Build list of all categories applicable to this prova, including combined ones
  const categoriasDoEvento = React.useMemo(() => {
    const map = new Map<string, Categoria & { isCombinada?: boolean; countInscritos?: number }>();

    categorias.forEach((c) => {
      const count = inscricoes.filter((ins) => ins.provaId === provaSelecionadaId && ins.categoriaId === c.id).length;
      map.set(c.id, { ...c, isCombinada: false, countInscritos: count });
    });

    inscricoes
      .filter((ins) => ins.provaId === provaSelecionadaId)
      .forEach((ins) => {
        if (!map.has(ins.categoriaId)) {
          const count = inscricoes.filter((i) => i.provaId === provaSelecionadaId && i.categoriaId === ins.categoriaId).length;
          map.set(ins.categoriaId, {
            id: ins.categoriaId,
            nome: ins.categoriaNome,
            tipoBike: 'Aro 20"',
            idadeMin: 0,
            idadeMax: 99,
            sexo: 'Misto',
            isCombinada: true,
            countInscritos: count,
          });
        }
      });

    return Array.from(map.values());
  }, [categorias, inscricoes, provaSelecionadaId]);

  const categoriaAtiva = categoriasDoEvento.find((c) => c.id === categoriaSelecionadaId) || categoriasDoEvento[0] || categorias[0];

  const categoriasComPoucosInscritos = categoriasDoEvento.filter(
    (c) => !c.isCombinada && (c.countInscritos || 0) > 0 && (c.countInscritos || 0) < minAtletasRegra
  );

  const handleConfirmarUniaoCategorias = () => {
    if (selectedCatIdsToCombine.length < 2) {
      alert('Selecione ao menos 2 categorias para unir!');
      return;
    }

    const catsOrigem = categoriasDoEvento.filter((c) => selectedCatIdsToCombine.includes(c.id));
    const nomeAuto = `Combinada (${catsOrigem.map((c) => c.nome).join(' + ')})`;
    const finalName = nomeCombinadaInput.trim() || nomeAuto;
    const combCatId = `comb-${Date.now()}`;

    if (setInscricoes) {
      setInscricoes((prev) =>
        prev.map((ins) => {
          if (ins.provaId === provaSelecionadaId && selectedCatIdsToCombine.includes(ins.categoriaId)) {
            return {
              ...ins,
              categoriaOriginalId: ins.categoriaOriginalId || ins.categoriaId,
              categoriaOriginalNome: ins.categoriaOriginalNome || ins.categoriaNome,
              categoriaId: combCatId,
              categoriaNome: finalName,
            };
          }
          return ins;
        })
      );
    }

    if (setProvas) {
      setProvas((prev) =>
        prev.map((p) => {
          if (p.id !== provaSelecionadaId) return p;
          const novaComb: CategoriaCombinada = {
            id: combCatId,
            provaId: p.id,
            nomeCombinada: finalName,
            categoriasOrigemIds: selectedCatIdsToCombine,
            categoriasOrigemNomes: catsOrigem.map((c) => c.nome),
          };
          return {
            ...p,
            categoriasCombinadas: [...(p.categoriasCombinadas || []), novaComb],
            categoriasIds: Array.from(new Set([...p.categoriasIds, combCatId])),
          };
        })
      );
    }

    setCategoriaSelecionadaId(combCatId);
    setShowCombineModal(false);
    setSelectedCatIdsToCombine([]);
    setNomeCombinadaInput('');

    setMensagemStatus(`✅ Categorias unidas com sucesso em "${finalName}"! Os atletas competirão juntos na pista, mas a premiação e ranking serão desmembrados.`);
    setTimeout(() => setMensagemStatus(null), 5000);
  };

  const handleDesfazerCombinacao = (comb: CategoriaCombinada) => {
    if (!confirm(`Deseja desfazer a união "${comb.nomeCombinada}"?`)) return;

    if (setInscricoes) {
      setInscricoes((prev) =>
        prev.map((ins) => {
          if (ins.provaId === provaSelecionadaId && (ins.categoriaId === comb.id || ins.categoriaNome === comb.nomeCombinada)) {
            return {
              ...ins,
              categoriaId: ins.categoriaOriginalId || ins.categoriaId,
              categoriaNome: ins.categoriaOriginalNome || ins.categoriaNome,
              categoriaOriginalId: undefined,
              categoriaOriginalNome: undefined,
            };
          }
          return ins;
        })
      );
    }

    setBaterias((prev) => prev.filter((b) => !(b.provaId === provaSelecionadaId && (b.categoriaId === comb.id || b.categoriaNome === comb.nomeCombinada))));

    if (setProvas) {
      setProvas((prev) =>
        prev.map((p) => {
          if (p.id !== provaSelecionadaId) return p;
          return {
            ...p,
            categoriasCombinadas: (p.categoriasCombinadas || []).filter((c) => c.id !== comb.id),
          };
        })
      );
    }

    setMensagemStatus(`🔄 União "${comb.nomeCombinada}" desfeita com sucesso!`);
    setTimeout(() => setMensagemStatus(null), 4000);
  };

  // Filter inscritos for this event & category
  const inscritosCategoria = inscricoes.filter(
    (ins) =>
      ins.provaId === provaSelecionadaId &&
      ins.categoriaId === categoriaSelecionadaId
  );

  // Filter baterias for active selection (Por Categoria mode)
  const bateriasAtivas = baterias.filter(
    (b) =>
      b.provaId === provaSelecionadaId &&
      b.categoriaId === categoriaSelecionadaId &&
      b.fase === faseFiltro
  );

  // All baterias for this event & category (across all 3 qualifying motos)
  const todasBateriasCategoria = baterias.filter(
    (b) =>
      b.provaId === provaSelecionadaId &&
      b.categoriaId === categoriaSelecionadaId
  );

  // All baterias across all categories for the selected event (for Ordem de Corridas)
  const todasBateriasProva = baterias.filter((b) => b.provaId === provaSelecionadaId);

  // Sort baterias in sequence of races (Ordem de Corridas)
  const fasesOrdem: Record<string, number> = {
    'Classificatória 1': 1,
    'Classificatória 2': 2,
    'Classificatória 3': 3,
    'Semifinal': 4,
    'Final': 5,
  };

  const bateriasOrdemCorridasSemFiltro = [...todasBateriasProva].sort((a, b) => {
    const ordFaseA = fasesOrdem[a.fase] || 99;
    const ordFaseB = fasesOrdem[b.fase] || 99;
    if (ordFaseA !== ordFaseB) return ordFaseA - ordFaseB;
    if (a.categoriaNome !== b.categoriaNome) return a.categoriaNome.localeCompare(b.categoriaNome);
    return a.numeroBateria - b.numeroBateria;
  });

  const bateriasComNumeroCorrida = bateriasOrdemCorridasSemFiltro.map((bat, idx) => ({
    ...bat,
    numeroCorridaGeral: idx + 1,
  }));

  const bateriasOrdemCorridasFiltradas = bateriasComNumeroCorrida.filter((bat) => {
    if (faseOrdemCorridas !== 'TODAS' && bat.fase !== faseOrdemCorridas) {
      return false;
    }
    if (!buscaOrdemCorridas.trim()) return true;

    const query = buscaOrdemCorridas.toLowerCase();
    const matchCorridaNum =
      `corrida ${bat.numeroCorridaGeral}`.includes(query) ||
      `#${bat.numeroCorridaGeral}`.includes(query) ||
      `${bat.numeroCorridaGeral}` === query;
    const matchCategoria = bat.categoriaNome.toLowerCase().includes(query);
    const matchPiloto = bat.pilotos.some(
      (p) =>
        p.atletaNome.toLowerCase().includes(query) ||
        p.numeroPlaca.toLowerCase().includes(query) ||
        p.clubeNome.toLowerCase().includes(query)
    );

    return matchCorridaNum || matchCategoria || matchPiloto;
  });

  // Calculated UCI accumulated points for active category
  const standingsQualificatórias = calcularResultadoAcumuladoQualificatorias(
    todasBateriasCategoria
  );

  // Handle generating/resetting Motos
  const handleGerarBaterias = () => {
    if (inscritosCategoria.length === 0) {
      setMensagemStatus('⚠️ Nenhum atleta inscrito nesta categoria para esta prova!');
      setTimeout(() => setMensagemStatus(null), 3000);
      return;
    }

    // Auto-save backup snapshot before generating batteries
    salvarSnapshotNoStorage(
      `Auto Backup - Antes de Gerar Baterias (${categoriaAtiva?.nome || 'Categoria'})`,
      'PRE_OPERACAO',
      {
        categorias,
        clubes: [],
        atletas: [],
        rankings: [],
        provas,
        inscricoes,
        baterias,
        transponderLogs: [],
      }
    );

    const inscritosFormatados: RiderInscritoInput[] = inscritosCategoria.map((i, idx) => ({
      atletaId: i.atletaId,
      atletaNome: i.atletaNome,
      numeroPlaca: i.numeroPlaca,
      clubeNome: i.clubeNome,
      transponderId: i.transponderId,
      categoriaOriginalId: i.categoriaOriginalId,
      categoriaOriginalNome: i.categoriaOriginalNome,
      posicaoRanking: idx + 1, // Order of enrollment or ranking index
    }));

    const novasBaterias = gerarBateriasQualificatorias(
      provaSelecionadaId,
      categoriaSelecionadaId,
      categoriaAtiva?.nome || 'Categoria',
      inscritosFormatados,
      metodoSorteio
    );

    // Replace existing baterias for this category
    const outrasBaterias = baterias.filter(
      (b) =>
        !(
          b.provaId === provaSelecionadaId &&
          b.categoriaId === categoriaSelecionadaId
        )
    );

    setBaterias([...outrasBaterias, ...novasBaterias]);

    const nomeMetodo =
      metodoSorteio === 'UCI_RANKING'
        ? 'Formato UCI Anexo 2 (Ranking)'
        : metodoSorteio === 'SCRAMBLED'
        ? 'Formato Scrambled (Grupos Embaralhados)'
        : 'Formato UCI Anexo 2 (Aleatório)';

    setMensagemStatus(`✅ Baterias geradas com sucesso no ${nomeMetodo}!`);
    setTimeout(() => setMensagemStatus(null), 4000);
  };

  // Assign next available sequential position to athlete in heat
  const handleAtribuirProximaPosicao = (bateriaId: string, atletaId: string) => {
    setBaterias((prev) =>
      prev.map((bat) => {
        if (bat.id !== bateriaId) return bat;

        const posicoesOcupadas = bat.pilotos
          .map((p) => p.posicaoChegada)
          .filter((pos): pos is number => pos !== undefined && pos > 0);

        const proximaPosicao =
          posicoesOcupadas.length > 0 ? Math.max(...posicoesOcupadas) + 1 : 1;

        const pilotosAtualizados = bat.pilotos.map((p) => {
          if (p.atletaId !== atletaId) return p;
          return {
            ...p,
            posicaoChegada: proximaPosicao,
            statusResult: 'OK' as const,
          };
        });

        const bateriaAtualizada = recalcularPontosBateria({
          ...bat,
          pilotos: pilotosAtualizados,
          status: 'Em Curso' as const,
        });

        return bateriaAtualizada;
      })
    );
  };

  // Update position, status (DNF, DNS, REL), or time with dynamic UCI recalculation
  const handleAtualizarEntradaPiloto = (
    bateriaId: string,
    atletaId: string,
    val: string
  ) => {
    if (val === 'NEXT') {
      handleAtribuirProximaPosicao(bateriaId, atletaId);
      return;
    }

    setBaterias((prev) =>
      prev.map((bat) => {
        if (bat.id !== bateriaId) return bat;

        const pilotosAtualizados = bat.pilotos.map((p) => {
          if (p.atletaId !== atletaId) return p;

          if (val === 'DNF') {
            return {
              ...p,
              posicaoChegada: undefined,
              statusResult: 'DNF' as const,
            };
          } else if (val === 'DNS') {
            return {
              ...p,
              posicaoChegada: undefined,
              statusResult: 'DNS' as const,
            };
          } else if (val === 'REL') {
            return {
              ...p,
              posicaoChegada: undefined,
              statusResult: 'REL' as const,
            };
          } else if (val === '' || val === 'CLEAR') {
            return {
              ...p,
              posicaoChegada: undefined,
              statusResult: undefined,
            };
          } else {
            const pos = parseInt(val, 10);
            return {
              ...p,
              posicaoChegada: isNaN(pos) ? undefined : pos,
              statusResult: 'OK' as const,
            };
          }
        });

        const bateriaAtualizada = recalcularPontosBateria({
          ...bat,
          pilotos: pilotosAtualizados,
          status: 'Em Curso' as const,
        });

        return bateriaAtualizada;
      })
    );
  };

  // Handle direct time update
  const handleAtualizarTempoPiloto = (
    bateriaId: string,
    atletaId: string,
    tempoVal: number
  ) => {
    setBaterias((prev) =>
      prev.map((bat) => {
        if (bat.id !== bateriaId) return bat;

        const novosPilotos = bat.pilotos.map((piloto) => {
          if (piloto.atletaId !== atletaId) return piloto;
          return {
            ...piloto,
            tempoSegundos: tempoVal,
          };
        });

        // Automatically sort positions by fastest time
        const comTempo = novosPilotos.filter(
          (p) => p.tempoSegundos && p.tempoSegundos > 0
        );
        comTempo.sort((a, b) => (a.tempoSegundos || 999) - (b.tempoSegundos || 999));
        comTempo.forEach((p, idx) => {
          p.posicaoChegada = idx + 1;
          p.statusResult = 'OK';
        });

        const bateriaAtualizada = recalcularPontosBateria({
          ...bat,
          pilotos: novosPilotos,
          status: 'Em Curso' as const,
        });

        return bateriaAtualizada;
      })
    );
  };

  // Reset finish order in heat
  const handleResetarChegadaBateria = (bateriaId: string) => {
    setBaterias((prev) =>
      prev.map((bat) => {
        if (bat.id !== bateriaId) return bat;

        const pilotosLimpos = bat.pilotos.map((p) => ({
          ...p,
          posicaoChegada: undefined,
          statusResult: undefined,
          tempoSegundos: undefined,
          pontosMoto: undefined,
        }));

        return {
          ...bat,
          pilotos: pilotosLimpos,
          status: 'Aguardando' as const,
        };
      })
    );
  };

  // Finalize heat and notify athletes
  const handleFinalizarBateria = (bateriaId: string) => {
    const batTarget = baterias.find((b) => b.id === bateriaId);

    setBaterias((prev) =>
      prev.map((bat) =>
        bat.id === bateriaId ? { ...bat, status: 'Finalizado' as const } : bat
      )
    );

    // Trigger Web Browser Notification for Athletes
    enviarNotificacaoAtleta({
      title: `🏆 Resultado Publicado - Bateria ${batTarget?.numeroBateria || ''}`,
      body: `Bateria ${batTarget?.numeroBateria || ''} (${batTarget?.categoriaNome || ''} - ${batTarget?.fase || ''}) foi finalizada! Confira suas colocações no portal.`,
      tag: 'bmx-resultado-finalizado',
    });

    setMensagemStatus('🏁 Bateria Finalizada! Resultados e notificações disparados.');
    setTimeout(() => setMensagemStatus(null), 3000);
  };

  // Broadcast Callout Notification for Heat Start / Pré-Largada
  const handleIniciaChamadaBateria = (bat: BateriaMoto) => {
    setBaterias((prev) =>
      prev.map((b) => (b.id === bat.id ? { ...b, status: 'Em Curso' as const } : b))
    );

    enviarNotificacaoAtleta({
      title: `📢 CHAMADA PARA PRÉ-LARGADA!`,
      body: `Atenção Pilotos: Bateria ${bat.numeroBateria} (${bat.categoriaNome} - ${bat.fase}) chamada para alinhamento no GATE!`,
      tag: 'bmx-chamada-alinhamento',
    });

    setMensagemStatus(`🔔 Chamada iniciada e alerta disparado para Bateria ${bat.numeroBateria}!`);
    setTimeout(() => setMensagemStatus(null), 3000);
  };

  // Export CSV
  const handleExportarCSV = () => {
    const csvRows = [
      ['Posicao', 'Placa', 'Atleta', 'Clube', 'Moto 1', 'Moto 2', 'Moto 3', 'Total Pontos UCI', 'Status'],
      ...standingsQualificatórias.map((s, idx) => [
        idx + 1,
        s.numeroPlaca,
        s.atletaNome,
        s.clubeNome,
        s.pontosMoto1 || '-',
        s.pontosMoto2 || '-',
        s.pontosMoto3 || '-',
        s.totalPontos,
        s.classificadoProximaFase ? 'Classificado Final' : 'Eliminado',
      ]),
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' + csvRows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Resultados_${categoriaAtiva?.nome.replace(/\s+/g, '_')}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reusable heat card renderer
  const renderHeatCard = (
    bateria: BateriaMoto,
    numeroCorridaGlobal?: number
  ) => {
    const totalInscritosBateria = bateria.pilotos.length;
    const pilotosQueLargaram = bateria.pilotos.filter(
      (p) => p.statusResult !== 'DNS'
    ).length;
    const ptsDNF = pilotosQueLargaram;
    const ptsDNS = totalInscritosBateria + 2;
    const ptsREL = pilotosQueLargaram + 2;

    const posicoesPreenchidas = bateria.pilotos
      .map((p) => p.posicaoChegada)
      .filter((pos): pos is number => pos !== undefined && pos > 0);
    const proximaPosicaoDisponivel =
      posicoesPreenchidas.length > 0 ? Math.max(...posicoesPreenchidas) + 1 : 1;

    return (
      <div
        key={bateria.id}
        className="bg-slate-900 rounded-2xl border border-slate-800 shadow-lg overflow-hidden transition hover:border-slate-700"
      >
        {/* Heat Title Header */}
        <div className="bg-slate-800 px-4 py-3 border-b border-slate-700 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            {numeroCorridaGlobal ? (
              <span className="bg-amber-400 text-slate-950 font-black text-xs px-2.5 py-1 rounded-lg uppercase flex items-center gap-1 shadow">
                <Zap className="w-3.5 h-3.5 fill-slate-950" /> CORRIDA #{numeroCorridaGlobal}
              </span>
            ) : (
              <span className="bg-amber-400 text-slate-950 font-black text-xs px-2.5 py-1 rounded-lg uppercase">
                Bateria {bateria.numeroBateria}
              </span>
            )}
            <span className="text-slate-200 font-bold text-sm">
              {bateria.categoriaNome} — <span className="text-amber-300">{bateria.fase}</span> {numeroCorridaGlobal && `(Bat. ${bateria.numeroBateria})`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                bateria.status === 'Finalizado'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : bateria.status === 'Em Curso'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-slate-700 text-slate-300'
              }`}
            >
              {bateria.status}
            </span>

            <button
              onClick={() => handleIniciaChamadaBateria(bateria)}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-2.5 py-1 rounded-lg transition flex items-center gap-1 shadow"
              title="Disparar notificação do navegador para a pré-largada desta bateria"
            >
              <Zap className="w-3.5 h-3.5 fill-slate-950" />
              Chamar Pilotos
            </button>

            <button
              onClick={() => handleResetarChegadaBateria(bateria.id)}
              className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs px-2.5 py-1 rounded-lg transition flex items-center gap-1"
              title="Limpar posições e tempos informados nesta bateria"
            >
              <RotateCcw className="w-3 h-3" />
              Limpar
            </button>

            <button
              onClick={() => handleFinalizarBateria(bateria.id)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1 rounded-lg transition shadow"
            >
              Finalizar Bateria
            </button>
          </div>
        </div>

        {/* Heat UCI Rules Bar */}
        <div className="bg-slate-950/80 px-4 py-2 border-b border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-300 gap-2 font-mono">
          <div className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-amber-400" />
            <span>
              Inscritos: <strong className="text-white">{totalInscritosBateria}</strong> | Largaram:{' '}
              <strong className="text-emerald-400">{pilotosQueLargaram}</strong>
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[10px]">
            <span className="text-slate-400 font-sans">Regra UCI:</span>
            <span className="text-red-400 font-bold">DNF = {ptsDNF} pt</span>
            <span className="text-slate-300 font-bold">DNS = {ptsDNS} pt ({totalInscritosBateria}+2)</span>
            <span className="text-purple-300 font-bold">REL = {ptsREL} pt ({pilotosQueLargaram}+2)</span>
          </div>
        </div>

        {/* Heat Pilots List Table */}
        <div className="p-4 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-2 px-2 text-center w-12">GATE</th>
                <th className="py-2 px-2 w-16">PLACA</th>
                <th className="py-2 px-2">ATLETA</th>
                <th className="py-2 px-2">CLUBE / EQUIPE</th>
                <th className="py-2 px-2 text-center w-36">
                  {modoEntrada === 'POSICAO' ? 'POSIÇÃO / CHEGADA' : 'TEMPO (S)'}
                </th>
                <th className="py-2 px-2 text-center w-24">PONTOS UCI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {bateria.pilotos.map((p) => {
                const isUnassigned = !p.posicaoChegada && !p.statusResult;
                const selectValue =
                  p.statusResult === 'DNF'
                    ? 'DNF'
                    : p.statusResult === 'DNS'
                    ? 'DNS'
                    : p.statusResult === 'REL'
                    ? 'REL'
                    : p.posicaoChegada
                    ? String(p.posicaoChegada)
                    : '';

                return (
                  <tr key={p.atletaId} className="hover:bg-slate-800/40 transition">
                    {/* Gate Box */}
                    <td className="py-2.5 px-2 text-center">
                      <span className="inline-block w-8 h-8 rounded-lg bg-slate-800 border border-amber-400/50 text-amber-300 font-black text-sm leading-8 shadow-inner">
                        {p.gate}
                      </span>
                    </td>

                    {/* Placa */}
                    <td className="py-2.5 px-2 font-mono font-extrabold text-amber-400">
                      #{p.numeroPlaca}
                    </td>

                    {/* Atleta Name with quick click option */}
                    <td className="py-2.5 px-2 font-bold text-white">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <span>{p.atletaNome}</span>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Transponder: {p.transponderId}
                          </div>
                        </div>
                        {modoEntrada === 'POSICAO' && isUnassigned && (
                          <button
                            onClick={() => handleAtribuirProximaPosicao(bateria.id, p.atletaId)}
                            className="bg-amber-400/10 hover:bg-amber-400 hover:text-slate-950 text-amber-300 font-extrabold text-[11px] px-2 py-0.5 rounded border border-amber-400/30 transition shadow-sm whitespace-nowrap"
                            title="Clique para atribuir a próxima posição de chegada nesta bateria"
                          >
                            + {proximaPosicaoDisponivel}º Lugar
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Clube */}
                    <td className="py-2.5 px-2 text-slate-300 text-xs">
                      {p.clubeNome}
                    </td>

                    {/* Position or Time Input */}
                    <td className="py-2.5 px-2 text-center">
                      {modoEntrada === 'POSICAO' ? (
                        <div className="flex items-center justify-center gap-1">
                          <select
                            value={selectValue}
                            onChange={(e) =>
                              handleAtualizarEntradaPiloto(
                                bateria.id,
                                p.atletaId,
                                e.target.value
                              )
                            }
                            className={`font-bold border rounded-lg px-2 py-1 text-xs focus:outline-none ${
                              p.statusResult === 'DNF'
                                ? 'bg-red-950 text-red-300 border-red-700'
                                : p.statusResult === 'DNS'
                                ? 'bg-slate-800 text-slate-400 border-slate-600'
                                : p.statusResult === 'REL'
                                ? 'bg-purple-950 text-purple-300 border-purple-700'
                                : p.posicaoChegada
                                ? 'bg-slate-800 text-amber-300 border-amber-400/60'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            <option value="">Selecione...</option>
                            {isUnassigned && (
                              <option value="NEXT" className="font-bold text-amber-400">
                                ⚡ Atribuir {proximaPosicaoDisponivel}º Lugar (Sequencial)
                              </option>
                            )}
                            <option value="1">1º Lugar (1 pt)</option>
                            <option value="2">2º Lugar (2 pt)</option>
                            <option value="3">3º Lugar (3 pt)</option>
                            <option value="4">4º Lugar (4 pt)</option>
                            <option value="5">5º Lugar (5 pt)</option>
                            <option value="6">6º Lugar (6 pt)</option>
                            <option value="7">7º Lugar (7 pt)</option>
                            <option value="8">8º Lugar (8 pt)</option>
                            <option value="DNF">DNF - Não Terminou ({ptsDNF} pt)</option>
                            <option value="DNS">DNS - Não Largou ({ptsDNS} pt)</option>
                            <option value="REL">REL - Relegado ({ptsREL} pt)</option>
                            {!isUnassigned && <option value="CLEAR">❌ Limpar posição</option>}
                          </select>
                        </div>
                      ) : (
                        <input
                          type="number"
                          step="0.001"
                          placeholder="33.450"
                          value={p.tempoSegundos || ''}
                          onChange={(e) =>
                            handleAtualizarTempoPiloto(
                              bateria.id,
                              p.atletaId,
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-24 bg-slate-800 text-blue-300 font-mono font-bold text-center border border-slate-700 rounded-lg py-1 px-1 text-xs focus:outline-none focus:border-blue-400"
                        />
                      )}
                    </td>

                    {/* Points Output */}
                    <td className="py-2.5 px-2 text-center">
                      {p.statusResult === 'DNF' ? (
                        <span className="inline-block bg-red-500/20 text-red-400 border border-red-500/40 text-xs font-mono font-black px-2 py-0.5 rounded">
                          DNF ({p.pontosMoto} pt)
                        </span>
                      ) : p.statusResult === 'DNS' ? (
                        <span className="inline-block bg-slate-800 text-slate-400 border border-slate-700 text-xs font-mono font-bold px-2 py-0.5 rounded">
                          DNS ({p.pontosMoto} pt)
                        </span>
                      ) : p.statusResult === 'REL' ? (
                        <span className="inline-block bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-mono font-black px-2 py-0.5 rounded">
                          REL ({p.pontosMoto} pt)
                        </span>
                      ) : p.pontosMoto !== undefined ? (
                        <span className="font-mono font-black text-emerald-400 text-base">
                          {p.pontosMoto} pt
                        </span>
                      ) : (
                        <span className="text-slate-600 font-mono text-xs">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-6 rounded-2xl border border-emerald-500/30 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-amber-400 text-slate-950 text-xs font-black px-2.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" /> MOTOR DE PROVAS / UCI
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 text-xs border border-emerald-500/30 px-2 py-0.5 rounded font-mono">
              Apuração Instantânea
            </span>
          </div>
          <h2 className="text-2xl font-black text-white">
            Gerenciamento de Baterias e Apuração de Resultados
          </h2>
          <p className="text-sm text-slate-300 mt-0.5">
            Geração automática de gatilhos (Gates 1-8), apuração por Posição/Tempo, ordem de corridas e emissão de súmulas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleGerarBaterias}
            className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-3.5 py-2.5 rounded-xl shadow-lg transition flex items-center gap-1.5 text-xs sm:text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Gerar/Sorteiar
          </button>
          <button
            onClick={() => setShowCombineModal(true)}
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-3.5 py-2.5 rounded-xl shadow-lg transition flex items-center gap-1.5 text-xs sm:text-sm border border-purple-400/30"
            title="Unir categorias com menos de N atletas inscritos para competirem juntas"
          >
            <Sliders className="w-4 h-4" />
            Unir Categorias {categoriasComPoucosInscritos.length > 0 && `(${categoriasComPoucosInscritos.length})`}
          </button>
          <button
            onClick={() => setShowPrintBateriasModal(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3.5 py-2.5 rounded-xl shadow-lg transition flex items-center gap-1.5 text-xs sm:text-sm border border-blue-400/30"
          >
            <Printer className="w-4 h-4" />
            Imprimir Súmulas
          </button>
          <button
            onClick={() => setShowPrintResultadosModal(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-2.5 rounded-xl shadow-lg transition flex items-center gap-1.5 text-xs sm:text-sm border border-emerald-400/30"
          >
            <Printer className="w-4 h-4" />
            Imprimir Resultados
          </button>
          <button
            onClick={handleExportarCSV}
            className="bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 font-bold px-3 py-2.5 rounded-xl transition flex items-center gap-1.5 text-xs sm:text-sm"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
        </div>
      </div>

      {mensagemStatus && (
        <div className="bg-emerald-900/40 border border-emerald-500 text-emerald-200 px-4 py-3 rounded-xl text-sm font-semibold animate-fade-in flex items-center justify-between shadow-lg">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            {mensagemStatus}
          </span>
        </div>
      )}

      {/* Navigation View Mode Selector: Por Categoria vs. Por Ordem de Corridas */}
      <div className="bg-slate-900 p-2.5 rounded-2xl border border-slate-800 shadow-lg flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/80 w-full md:w-auto">
          <button
            onClick={() => setModoVisualizacao('POR_CATEGORIA')}
            className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-black transition flex items-center justify-center gap-2 ${
              modoVisualizacao === 'POR_CATEGORIA'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4" />
            Visão Por Categoria
          </button>
          <button
            onClick={() => setModoVisualizacao('ORDEM_CORRIDAS')}
            className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-black transition flex items-center justify-center gap-2 ${
              modoVisualizacao === 'ORDEM_CORRIDAS'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            Visão Por Ordem de Corridas ({todasBateriasProva.length} Corridas na Prova)
          </button>
        </div>

        {modoVisualizacao === 'ORDEM_CORRIDAS' && (
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Quick Phase Filter for Race Sequence */}
            <select
              value={faseOrdemCorridas}
              onChange={(e) => setFaseOrdemCorridas(e.target.value)}
              className="bg-slate-800 text-amber-300 text-xs font-bold rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:border-amber-400"
            >
              <option value="TODAS">Todas as Fases da Prova</option>
              <option value="Classificatória 1">Moto 1 - Classificatória</option>
              <option value="Classificatória 2">Moto 2 - Classificatória</option>
              <option value="Classificatória 3">Moto 3 - Classificatória</option>
              <option value="Semifinal">Semifinal</option>
              <option value="Final">Grande Final</option>
            </select>

            {/* Quick Search in Race Sequence */}
            <div className="relative flex-1 md:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar corrida #, atleta, placa..."
                value={buscaOrdemCorridas}
                onChange={(e) => setBuscaOrdemCorridas(e.target.value)}
                className="w-full bg-slate-800 text-white text-xs pl-8 pr-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-amber-400 placeholder:text-slate-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Draw Format / Sorteio Configuration Bar */}
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4" /> Formato de Sorteio das Baterias (Composição das Motos)
          </label>
          <span className="text-[11px] text-slate-400 font-mono">
            Defina a regra para divisão dos atletas antes de gerar
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* UCI Ranking Option */}
          <button
            type="button"
            onClick={() => setMetodoSorteio('UCI_RANKING')}
            className={`p-3 rounded-xl border text-left transition-all relative ${
              metodoSorteio === 'UCI_RANKING'
                ? 'bg-amber-500/10 border-amber-400 text-white ring-1 ring-amber-400/50 shadow-md'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-extrabold text-sm flex items-center gap-1.5 text-amber-300">
                <Trophy className="w-4 h-4 text-amber-400" />
                UCI Anexo 2: Ranking
              </span>
              {metodoSorteio === 'UCI_RANKING' && (
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded">
                  ATIVO
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 leading-snug">
              Atletas distribuídos nos grupos em formato serpente de acordo com o ranking informado.
            </p>
          </button>

          {/* UCI Random Option */}
          <button
            type="button"
            onClick={() => setMetodoSorteio('UCI_RANDOM')}
            className={`p-3 rounded-xl border text-left transition-all relative ${
              metodoSorteio === 'UCI_RANDOM'
                ? 'bg-amber-500/10 border-amber-400 text-white ring-1 ring-amber-400/50 shadow-md'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-extrabold text-sm flex items-center gap-1.5 text-emerald-300">
                <RefreshCw className="w-4 h-4 text-emerald-400" />
                UCI Anexo 2: Aleatório
              </span>
              {metodoSorteio === 'UCI_RANDOM' && (
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded">
                  ATIVO
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 leading-snug">
              Sorteio aleatório para a Moto 1. Composição de grupos mantida nas Motos 1, 2 e 3.
            </p>
          </button>

          {/* Scrambled Option */}
          <button
            type="button"
            onClick={() => setMetodoSorteio('SCRAMBLED')}
            className={`p-3 rounded-xl border text-left transition-all relative ${
              metodoSorteio === 'SCRAMBLED'
                ? 'bg-amber-500/10 border-amber-400 text-white ring-1 ring-amber-400/50 shadow-md'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-extrabold text-sm flex items-center gap-1.5 text-purple-300">
                <Zap className="w-4 h-4 text-purple-400" />
                Formato Scrambled
              </span>
              {metodoSorteio === 'SCRAMBLED' && (
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded">
                  ATIVO
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 leading-snug">
              Pilotos embaralhados em novos grupos e portões sorteados a cada Moto (1, 2 e 3).
            </p>
          </button>
        </div>
      </div>

      {/* Warning banner for low count categories */}
      {modoVisualizacao === 'POR_CATEGORIA' && categoriasComPoucosInscritos.length > 0 && (
        <div className="bg-amber-950/60 border border-amber-500/40 p-3 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-amber-200 shadow-md">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-amber-400 shrink-0" />
            <span>
              Atenção: <strong>{categoriasComPoucosInscritos.length} categorias</strong> possuem menos de <strong>{minAtletasRegra} atletas inscritos</strong> para formar categoria individual nesta prova ({categoriasComPoucosInscritos.map((c) => `${c.nome}: ${c.countInscritos}`).join(', ')}).
            </span>
          </div>
          <button
            onClick={() => {
              setSelectedCatIdsToCombine(categoriasComPoucosInscritos.map((c) => c.id));
              setShowCombineModal(true);
            }}
            className="bg-amber-400 text-slate-950 px-3.5 py-1.5 rounded-lg font-black hover:bg-amber-300 transition whitespace-nowrap shadow"
          >
            🔀 Unir Categorias Agora
          </button>
        </div>
      )}

      {/* Selectors Bar (Only if Por Categoria view mode) */}
      {modoVisualizacao === 'POR_CATEGORIA' && (
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-md grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Prova Event Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">
              Evento / Prova
            </label>
            <select
              value={provaSelecionadaId}
              onChange={(e) => setProvaSelecionadaId(e.target.value)}
              className="w-full bg-slate-800 text-white text-sm font-semibold rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:border-amber-400"
            >
              {provas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} ({p.cidadeEstado})
                </option>
              ))}
            </select>
          </div>

          {/* Categoria Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">
              Categoria
            </label>
            <select
              value={categoriaSelecionadaId}
              onChange={(e) => setCategoriaSelecionadaId(e.target.value)}
              className="w-full bg-slate-800 text-white text-sm font-semibold rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:border-amber-400"
            >
              {categoriasDoEvento.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.isCombinada ? '🔀 ' : ''}{c.nome} ({c.countInscritos ?? 0} inscritos){' '}
                  {c.countInscritos !== undefined && c.countInscritos > 0 && c.countInscritos < minAtletasRegra && !c.isCombinada ? `⚠️ (<${minAtletasRegra})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Phase Filter Tabs */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">
              Fase da Categoria
            </label>
            <select
              value={faseFiltro}
              onChange={(e) => setFaseFiltro(e.target.value as FaseMoto)}
              className="w-full bg-slate-800 text-amber-300 font-bold text-sm rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:border-amber-400"
            >
              <option value="Moto 1">Moto 1</option>
              <option value="Moto 2">Moto 2</option>
              <option value="Moto 3">Moto 3</option>
              <option value="Semifinal">Semifinal (Gatilho Direto)</option>
              <option value="Final">Grande Final (Gatilho de Ouro)</option>
            </select>
          </div>

          {/* Scoring Mode Toggle */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">
              Modo de Apuração
            </label>
            <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
              <button
                onClick={() => setModoEntrada('POSICAO')}
                className={`flex-1 py-1 text-xs font-bold rounded ${
                  modoEntrada === 'POSICAO'
                    ? 'bg-amber-400 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Posição (1º-8º)
              </button>
              <button
                onClick={() => setModoEntrada('TEMPO')}
                className={`flex-1 py-1 text-xs font-bold rounded ${
                  modoEntrada === 'TEMPO'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Tempo (Segundos)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main View Mode: POR_CATEGORIA */}
      {modoVisualizacao === 'POR_CATEGORIA' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2 Cols): Active Heats */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                Baterias & Alinhamento no Gate ({faseFiltro})
              </h3>
              <span className="text-xs bg-slate-200 text-slate-700 font-bold px-2.5 py-1 rounded-full">
                Inscritos na Categoria: {inscritosCategoria.length} atletas
              </span>
            </div>

            {bateriasAtivas.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-sm">
                <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-xl">
                  !
                </div>
                <h4 className="text-slate-900 font-bold text-base">
                  Nenhuma bateria gerada para esta fase
                </h4>
                <p className="text-slate-500 text-xs max-w-md mx-auto mt-1">
                  Clique no botão <span className="font-bold text-slate-800">"Gerar/Sorteiar Baterias"</span> no topo para realizar o sorteio aleatório de portões (Gates 1-8) de acordo com o regulamento UCI.
                </p>
                <button
                  onClick={handleGerarBaterias}
                  className="mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow transition"
                >
                  Gerar Agora
                </button>
              </div>
            ) : (
              bateriasAtivas.map((bateria) => renderHeatCard(bateria))
            )}
          </div>

          {/* Right Column: UCI Cumulative Standings */}
          <div className="space-y-4">
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 text-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <h3 className="font-black text-base text-white">
                    Classificação Geral de Motos (UCI)
                  </h3>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono border border-emerald-500/30">
                  Somatório M1+M2+M3
                </span>
              </div>

              {/* Toggle tab if category has combined riders */}
              {standingsQualificatórias.some((s) => s.categoriaOriginalNome) && (
                <div className="flex bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 mb-4">
                  <button
                    onClick={() => setModoExibicaoStandings('COMBINADO')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-black transition flex items-center justify-center gap-1 ${
                      modoExibicaoStandings === 'COMBINADO'
                        ? 'bg-amber-400 text-slate-950 shadow'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    🏁 Bateria Combinada
                  </button>
                  <button
                    onClick={() => setModoExibicaoStandings('DESMEMBRADO')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-black transition flex items-center justify-center gap-1 ${
                      modoExibicaoStandings === 'DESMEMBRADO'
                        ? 'bg-purple-600 text-white shadow'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    🏆 Premiação Separada
                  </button>
                </div>
              )}

              <p className="text-xs text-slate-400 mb-4">
                {modoExibicaoStandings === 'DESMEMBRADO'
                  ? 'Atletas desmembrados conforme a categoria original de cadastro para premiação e troféus:'
                  : 'Regra UCI BMX: Menor somatório de pontos avança para a próxima fase (Top 8 classificados).'}
              </p>

              {standingsQualificatórias.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6 font-semibold">
                  Nenhum resultado registrado ainda.
                </p>
              ) : modoExibicaoStandings === 'DESMEMBRADO' ? (
                <div className="space-y-4">
                  {desmembrarResultadosPorCategoriaOriginal(standingsQualificatórias).map((catGroup) => (
                    <div key={catGroup.categoriaOriginalNome} className="bg-slate-950/80 p-3.5 rounded-xl border border-purple-500/40 space-y-2">
                      <div className="flex items-center justify-between border-b border-purple-500/30 pb-2">
                        <span className="text-xs font-black text-purple-300 flex items-center gap-1">
                          <Trophy className="w-3.5 h-3.5 text-amber-400" />
                          {catGroup.categoriaOriginalNome}
                        </span>
                        <span className="text-[10px] bg-purple-500/20 text-purple-200 px-2 py-0.5 rounded font-mono">
                          Pódio Separado
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {catGroup.resultados.map((st, idx) => (
                          <div key={st.atletaId} className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                            <div className="flex items-center gap-2">
                              <span className={`w-5 h-5 rounded font-black text-[10px] flex items-center justify-center ${
                                idx === 0 ? 'bg-amber-400 text-slate-950' : idx === 1 ? 'bg-slate-300 text-slate-950' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-400'
                              }`}>
                                {idx + 1}º
                              </span>
                              <div>
                                <div className="font-bold text-white text-xs">#{st.numeroPlaca} {st.atletaNome}</div>
                                <div className="text-[10px] text-slate-400">{st.clubeNome}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-mono font-black text-amber-400 text-xs">{st.totalPontos} pts</span>
                              {idx === 0 && <div className="text-[9px] font-black text-amber-300 uppercase">🥇 Campeão</div>}
                              {idx === 1 && <div className="text-[9px] font-black text-slate-300 uppercase">🥈 Vice</div>}
                              {idx === 2 && <div className="text-[9px] font-black text-amber-600 uppercase">🥉 3º Lugar</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {standingsQualificatórias.map((st, idx) => (
                    <div
                      key={st.atletaId}
                      className={`p-3 rounded-xl border transition flex items-center justify-between ${
                        st.classificadoProximaFase
                          ? 'bg-slate-800/80 border-emerald-500/40 text-white'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-6 h-6 rounded-md font-black text-xs flex items-center justify-center ${
                            idx === 0
                              ? 'bg-amber-400 text-slate-950'
                              : idx === 1
                              ? 'bg-slate-300 text-slate-950'
                              : idx === 2
                              ? 'bg-amber-700 text-white'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-bold text-xs text-white flex items-center gap-1.5">
                            #{st.numeroPlaca} {st.atletaNome}
                            {st.categoriaOriginalNome && (
                              <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.2 rounded font-mono">
                                ({st.categoriaOriginalNome})
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {st.clubeNome}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-mono font-black text-amber-400 text-sm">
                          {st.totalPontos} pts
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          M1:{st.pontosMoto1 || '-'} | M2:{st.pontosMoto2 || '-'} | M3:{st.pontosMoto3 || '-'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main View Mode: ORDEM_CORRIDAS (Sequência Cronológica da Prova) */}
      {modoVisualizacao === 'ORDEM_CORRIDAS' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-white shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center font-bold">
                <ListOrdered className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base text-white">
                  Sequência Cronológica da Prova (Ordem de Corridas)
                </h3>
                <p className="text-xs text-slate-400">
                  Apuração sequencial na pista. Preencha os resultados diretamente na ordem de largada da prova.
                </p>
              </div>
            </div>

            <div className="text-xs font-mono bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-amber-300 font-bold">
              Mostrando {bateriasOrdemCorridasFiltradas.length} de {todasBateriasProva.length} corridas
            </div>
          </div>

          {bateriasOrdemCorridasFiltradas.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-sm">
              <h4 className="text-slate-900 font-bold text-base">
                Nenhuma corrida encontrada nesta sequência
              </h4>
              <p className="text-slate-500 text-xs mt-1">
                Ajuste os filtros de busca ou gere as baterias das categorias para esta prova.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {bateriasOrdemCorridasFiltradas.map((bateria) =>
                renderHeatCard(bateria, bateria.numeroCorridaGeral)
              )}
            </div>
          )}
        </div>
      )}

      {/* Print Modals */}
      <PrintBateriasModal
        isOpen={showPrintBateriasModal}
        onClose={() => setShowPrintBateriasModal(false)}
        provas={provas}
        categorias={categorias}
        baterias={baterias}
        provaSelecionadaId={provaSelecionadaId}
        categoriaSelecionadaId={categoriaSelecionadaId}
      />

      <PrintResultadosModal
        isOpen={showPrintResultadosModal}
        onClose={() => setShowPrintResultadosModal(false)}
        provas={provas}
        categorias={categorias}
        baterias={baterias}
        provaSelecionadaId={provaSelecionadaId}
        categoriaSelecionadaId={categoriaSelecionadaId}
      />

      {/* Modal para Unir / Combinar Categorias */}
      {showCombineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full text-slate-100 shadow-2xl p-6 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center font-bold">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white">Unir / Combinar Categorias</h3>
                  <p className="text-xs text-slate-400">
                    Junte categorias sem quorum mínimo ({minAtletasRegra} atletas) para correrem juntas no sorteio
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCombineModal(false)}
                className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Selecione as Categorias a Serem Combinadas:
                </label>
                <div className="max-h-60 overflow-y-auto space-y-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  {categoriasDoEvento.filter((c) => !c.isCombinada).map((c) => {
                    const isChecked = selectedCatIdsToCombine.includes(c.id);
                    const count = c.countInscritos || 0;
                    const isLow = count < minAtletasRegra;
                    return (
                      <label
                        key={c.id}
                        className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition ${
                          isChecked
                            ? 'bg-purple-900/30 border-purple-500/60 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCatIdsToCombine((prev) => [...prev, c.id]);
                              } else {
                                setSelectedCatIdsToCombine((prev) => prev.filter((id) => id !== c.id));
                              }
                            }}
                            className="rounded border-slate-700 text-purple-600 focus:ring-purple-500 bg-slate-800 w-4 h-4"
                          />
                          <div>
                            <span className="font-bold text-sm block">{c.nome}</span>
                            <span className="text-[10px] text-slate-400">{c.tipoBike}</span>
                          </div>
                        </div>
                        <span
                          className={`font-mono text-xs px-2 py-0.5 rounded font-bold ${
                            isLow ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {count} inscritos {isLow ? `⚠️ (<${minAtletasRegra})` : 'OK'}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Nome da Categoria Combinada (Opcional):
                </label>
                <input
                  type="text"
                  placeholder="Ex: Boys 15/16 Anos (Combinada)"
                  value={nomeCombinadaInput}
                  onChange={(e) => setNomeCombinadaInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-semibold text-xs focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="bg-purple-950/40 border border-purple-500/30 p-3 rounded-xl text-[11px] text-purple-200 space-y-1">
                <strong className="block text-purple-300 font-bold">ℹ️ Regra de Negócio para Categoria Combinada:</strong>
                <p>• Os atletas competirão nos mesmos portões e baterias da categoria combinada.</p>
                <p>• Na premiação e relatórios de pódio, os atletas são desmembrados para premiar conforme a categoria de cadastro original.</p>
              </div>

              {/* Uniaões Existentes */}
              {provaAtiva?.categoriasCombinadas && provaAtiva.categoriasCombinadas.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="font-bold text-slate-300 text-xs block">Uniaões Existentes nesta Prova:</span>
                  {provaAtiva.categoriasCombinadas.map((comb) => (
                    <div key={comb.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                      <div>
                        <span className="font-bold text-purple-300">{comb.nomeCombinada}</span>
                        <div className="text-[10px] text-slate-400">Origem: {comb.categoriasOrigemNomes.join(', ')}</div>
                      </div>
                      <button
                        onClick={() => handleDesfazerCombinacao(comb)}
                        className="bg-rose-900/40 hover:bg-rose-900 text-rose-300 border border-rose-700/50 text-[10px] font-bold px-2.5 py-1 rounded-lg transition"
                      >
                        Desfazer União
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowCombineModal(false)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-bold transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarUniaoCategorias}
                className="bg-purple-600 hover:bg-purple-500 text-white font-black px-5 py-2.5 rounded-xl text-xs shadow-lg transition flex items-center gap-1.5"
              >
                <Sliders className="w-4 h-4" />
                Confirmar União de Categorias
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
