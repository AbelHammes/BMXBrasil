import {
  Atleta,
  BateriaMoto,
  Categoria,
  ClubeEquipe,
  Inscricao,
  ProvaEvento,
  Ranking,
  TransponderValidationLog,
} from '../types/bmx';
import { recalcularPontosBateria } from './uciBmEngine';

export interface BMXSystemState {
  categorias: Categoria[];
  clubes: ClubeEquipe[];
  atletas: Atleta[];
  rankings: Ranking[];
  provas: ProvaEvento[];
  inscricoes: Inscricao[];
  baterias: BateriaMoto[];
  transponderLogs: TransponderValidationLog[];
}

export interface BackupSnapshot {
  id: string;
  timestamp: string;
  nome: string;
  tipo: 'AUTOMATICO' | 'MANUAL' | 'PRE_OPERACAO';
  estatisticas: {
    totalProvas: number;
    totalInscricoes: number;
    totalBaterias: number;
    totalAtletas: number;
    totalClubes: number;
  };
  data: BMXSystemState;
}

export interface IntegrityIssue {
  id: string;
  severidade: 'CRITICAL' | 'WARNING' | 'INFO';
  categoria: 'BATERIAS' | 'INSCRICOES' | 'PONTUACAO' | 'TRANSPONDERS' | 'ESTRUTURA';
  titulo: string;
  descricao: string;
  localizacao: string;
  corrigivelAutomaticamente: boolean;
  detalhes?: string;
}

export interface IntegrityAuditResult {
  scoreIntegridade: number; // 0 to 100%
  statusGeral: 'SAUDAVEL' | 'ATENCAO' | 'CRITICO';
  totalErrosCriticos: number;
  totalAlertas: number;
  totalInfos: number;
  dataUltimaVerificacao: string;
  issues: IntegrityIssue[];
}

const STORAGE_KEY_BACKUPS = 'bmx_backup_snapshots';

/**
 * Loads all stored snapshots from LocalStorage
 */
export function carregarSnapshotsDoStorage(): BackupSnapshot[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_BACKUPS);
    if (!saved) return [];
    return JSON.parse(saved);
  } catch (err) {
    console.error('Erro ao carregar snapshots do LocalStorage:', err);
    return [];
  }
}

/**
 * Saves a new system snapshot to LocalStorage (retains up to 20 snapshots)
 */
export function salvarSnapshotNoStorage(
  nome: string,
  tipo: 'AUTOMATICO' | 'MANUAL' | 'PRE_OPERACAO',
  state: BMXSystemState
): BackupSnapshot {
  const snapshots = carregarSnapshotsDoStorage();

  const novoSnapshot: BackupSnapshot = {
    id: `snap-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    nome,
    tipo,
    estatisticas: {
      totalProvas: state.provas?.length || 0,
      totalInscricoes: state.inscricoes?.length || 0,
      totalBaterias: state.baterias?.length || 0,
      totalAtletas: state.atletas?.length || 0,
      totalClubes: state.clubes?.length || 0,
    },
    data: state,
  };

  // Keep up to 20 most recent snapshots
  const listaAtualizada = [novoSnapshot, ...snapshots].slice(0, 20);

  try {
    localStorage.setItem(STORAGE_KEY_BACKUPS, JSON.stringify(listaAtualizada));
  } catch (e) {
    console.warn('LocalStorage limit reached when saving backup snapshot:', e);
    // If quota exceeded, save only last 5 snapshots
    const listaReduzida = [novoSnapshot, ...snapshots.slice(0, 4)];
    try {
      localStorage.setItem(STORAGE_KEY_BACKUPS, JSON.stringify(listaReduzida));
    } catch (err2) {
      console.error('Falha crítica ao salvar backup no LocalStorage:', err2);
    }
  }

  return novoSnapshot;
}

/**
 * Removes a snapshot by ID
 */
export function deletarSnapshotDoStorage(snapshotId: string): BackupSnapshot[] {
  const snapshots = carregarSnapshotsDoStorage();
  const filtrados = snapshots.filter((s) => s.id !== snapshotId);
  localStorage.setItem(STORAGE_KEY_BACKUPS, JSON.stringify(filtrados));
  return filtrados;
}

/**
 * Exports complete backup JSON file to client download
 */
export function exportarBackupJSON(state: BMXSystemState, filename?: string) {
  const backupPayload = {
    versaoSistema: '2026.1.0-UCI-PRO',
    dataExportacao: new Date().toISOString(),
    ambiente: 'BMX BRASIL - OFICIAL',
    state,
  };

  const jsonStr = JSON.stringify(backupPayload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download =
    filename ||
    `BACKUP_BMX_BRASIL_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Validates and parses an uploaded backup JSON string
 */
export function validarEImportarBackupJSON(jsonString: string): {
  valido: boolean;
  state?: BMXSystemState;
  erro?: string;
} {
  try {
    const parsed = JSON.parse(jsonString);

    // Can be raw BMXSystemState or wrapped in { state: BMXSystemState }
    const state: BMXSystemState = parsed.state ? parsed.state : parsed;

    if (!Array.isArray(state.provas) || !Array.isArray(state.categorias)) {
      return {
        valido: false,
        erro: 'Arquivo de backup inválido! Estrutura de dados incompatível.',
      };
    }

    return {
      valido: true,
      state: {
        categorias: state.categorias || [],
        clubes: state.clubes || [],
        atletas: state.atletas || [],
        rankings: state.rankings || [],
        provas: state.provas || [],
        inscricoes: state.inscricoes || [],
        baterias: state.baterias || [],
        transponderLogs: state.transponderLogs || [],
      },
    };
  } catch (err: any) {
    return {
      valido: false,
      erro: `Erro de sintaxe JSON: ${err?.message || 'Arquivo corrompido'}`,
    };
  }
}

/**
 * Comprehensive System Integrity Audit
 * Scans all heats, registrations, points, gate allocations and transponders for discrepancies.
 */
export function auditarIntegridadeSistema(
  state: BMXSystemState
): IntegrityAuditResult {
  const issues: IntegrityIssue[] = [];

  const { baterias, inscricoes, provas, categorias, atletas } = state;

  // 1. Audit Baterias (Heats)
  baterias.forEach((bat) => {
    // Check duplicate arrival positions within the same heat
    const posicoes = bat.pilotos
      .map((p) => p.posicaoChegada)
      .filter((p): p is number => p !== undefined && p > 0);

    const posContagem = new Map<number, number>();
    posicoes.forEach((pos) => {
      posContagem.set(pos, (posContagem.get(pos) || 0) + 1);
    });

    posContagem.forEach((qtd, pos) => {
      if (qtd > 1) {
        issues.push({
          id: `dup-pos-${bat.id}-${pos}`,
          severidade: 'CRITICAL',
          categoria: 'BATERIAS',
          titulo: 'Posição de Chegada Duplicada na Bateria',
          descricao: `A posição ${pos}º lugar foi atribuída a ${qtd} pilotos na mesma bateria.`,
          localizacao: `${bat.categoriaNome} — ${bat.fase} (Bateria #${bat.numeroBateria})`,
          corrigivelAutomaticamente: true,
          detalhes: `ID Bateria: ${bat.id}`,
        });
      }
    });

    // Check duplicate gate assignments in the same heat
    const gates = bat.pilotos.map((p) => p.gate);
    const gateContagem = new Map<number, number>();
    gates.forEach((g) => {
      if (g) gateContagem.set(g, (gateContagem.get(g) || 0) + 1);
    });

    gateContagem.forEach((qtd, g) => {
      if (qtd > 1) {
        issues.push({
          id: `dup-gate-${bat.id}-${g}`,
          severidade: 'CRITICAL',
          categoria: 'BATERIAS',
          titulo: 'Gatilho / Portão (Gate) Duplicado',
          descricao: `O Gate ${g} foi atribuído a ${qtd} pilotos no mesmo alinhamento de largada.`,
          localizacao: `${bat.categoriaNome} — ${bat.fase} (Bateria #${bat.numeroBateria})`,
          corrigivelAutomaticamente: true,
        });
      }
    });

    // Check rider score points recalculation accuracy (UCI Rules compliance)
    const totalInscritos = bat.pilotos.length;
    const pilotosQueLargaram = bat.pilotos.filter(
      (p) => p.statusResult !== 'DNS'
    ).length;

    bat.pilotos.forEach((piloto) => {
      let pontosEsperados = totalInscritos;
      if (piloto.statusResult === 'DNS') {
        pontosEsperados = totalInscritos + 2;
      } else if (piloto.statusResult === 'DNF') {
        pontosEsperados = pilotosQueLargaram;
      } else if (piloto.statusResult === 'REL') {
        pontosEsperados = pilotosQueLargaram + 2;
      } else if (piloto.posicaoChegada && piloto.posicaoChegada > 0) {
        pontosEsperados = piloto.posicaoChegada;
      }

      if (
        piloto.pontosMoto !== undefined &&
        piloto.pontosMoto !== pontosEsperados
      ) {
        issues.push({
          id: `score-mismatch-${bat.id}-${piloto.atletaId}`,
          severidade: 'WARNING',
          categoria: 'PONTUACAO',
          titulo: 'Divergência no Cálculo de Pontos UCI',
          descricao: `Atleta "${piloto.atletaNome}" consta com ${piloto.pontosMoto} pts, mas a regra UCI calcula ${pontosEsperados} pts.`,
          localizacao: `${bat.categoriaNome} — ${bat.fase} (Bateria #${bat.numeroBateria})`,
          corrigivelAutomaticamente: true,
        });
      }
    });

    // Check empty heats
    if (bat.pilotos.length === 0) {
      issues.push({
        id: `empty-heat-${bat.id}`,
        severidade: 'WARNING',
        categoria: 'BATERIAS',
        titulo: 'Bateria Sem Pilotos Alocados',
        descricao: 'Bateria criada sem nenhum atleta associado.',
        localizacao: `${bat.categoriaNome} — ${bat.fase} (Bateria #${bat.numeroBateria})`,
        corrigivelAutomaticamente: true,
      });
    }
  });

  // 2. Audit Inscricoes (Registrations)
  const provaIds = new Set(provas.map((p) => p.id));
  const categoriaIds = new Set(categorias.map((c) => c.id));
  const atletaIds = new Set(atletas.map((a) => a.id));

  inscricoes.forEach((ins) => {
    if (!provaIds.has(ins.provaId)) {
      issues.push({
        id: `orphan-ins-prova-${ins.id}`,
        severidade: 'WARNING',
        categoria: 'INSCRICOES',
        titulo: 'Inscrição com Prova Inexistente',
        descricao: `Inscrição do atleta "${ins.atletaNome}" faz referência a uma prova removida (ID ${ins.provaId}).`,
        localizacao: `Inscrição #${ins.id}`,
        corrigivelAutomaticamente: true,
      });
    }

    if (!categoriaIds.has(ins.categoriaId)) {
      issues.push({
        id: `orphan-ins-cat-${ins.id}`,
        severidade: 'WARNING',
        categoria: 'INSCRICOES',
        titulo: 'Inscrição com Categoria Inexistente',
        descricao: `Inscrição do atleta "${ins.atletaNome}" faz referência a uma categoria removida (ID ${ins.categoriaId}).`,
        localizacao: `Inscrição #${ins.id}`,
        corrigivelAutomaticamente: true,
      });
    }

    if (!ins.transponderId || ins.transponderId.trim() === '') {
      issues.push({
        id: `missing-transponder-${ins.id}`,
        severidade: 'INFO',
        categoria: 'TRANSPONDERS',
        titulo: 'Atleta Sem Transponder Vinculado',
        descricao: `Atleta "${ins.atletaNome}" (Placa #${ins.numeroPlaca}) não possui código de transponder cadastrado.`,
        localizacao: `Categoria: ${ins.categoriaNome}`,
        corrigivelAutomaticamente: false,
      });
    }
  });

  // Calculate overall integrity score (100% max)
  const totalErrosCriticos = issues.filter(
    (i) => i.severidade === 'CRITICAL'
  ).length;
  const totalAlertas = issues.filter((i) => i.severidade === 'WARNING').length;
  const totalInfos = issues.filter((i) => i.severidade === 'INFO').length;

  let scoreIntegridade = 100 - totalErrosCriticos * 15 - totalAlertas * 5;
  if (scoreIntegridade < 0) scoreIntegridade = 0;

  let statusGeral: 'SAUDAVEL' | 'ATENCAO' | 'CRITICO' = 'SAUDAVEL';
  if (totalErrosCriticos > 0) {
    statusGeral = 'CRITICO';
  } else if (totalAlertas > 0) {
    statusGeral = 'ATENCAO';
  }

  return {
    scoreIntegridade,
    statusGeral,
    totalErrosCriticos,
    totalAlertas,
    totalInfos,
    dataUltimaVerificacao: new Date().toISOString(),
    issues,
  };
}

/**
 * Automatically repairs and heals system integrity & score calculations
 */
export function sanearECorrigirIntegridade(state: BMXSystemState): {
  stateCorrigido: BMXSystemState;
  itensCorrigidos: number;
  relatorioCorrecao: string[];
} {
  const relatorio: string[] = [];
  let totalCorrigidos = 0;

  const { baterias, inscricoes, provas, categorias } = state;

  const provaIds = new Set(provas.map((p) => p.id));
  const categoriaIds = new Set(categorias.map((c) => c.id));

  // 1. Clean orphan registrations
  const inscricoesValidas = inscricoes.filter((ins) => {
    const valida = provaIds.has(ins.provaId) && categoriaIds.has(ins.categoriaId);
    if (!valida) {
      totalCorrigidos++;
      relatorio.push(
        `Removida inscrição órfã #${ins.id} (${ins.atletaNome} - Prova/Cat inexistente)`
      );
    }
    return valida;
  });

  // 2. Remove empty heats & sanitize gates/points in baterias
  const bateriasSaneadas: BateriaMoto[] = [];

  baterias.forEach((bat) => {
    if (bat.pilotos.length === 0) {
      totalCorrigidos++;
      relatorio.push(`Removida bateria vazia #${bat.numeroBateria} (${bat.categoriaNome})`);
      return;
    }

    // Fix duplicate arrival positions in the same heat
    const posicoesUsadas = new Set<number>();
    const pilotosCorrigidos = bat.pilotos.map((p) => {
      let novaPos = p.posicaoChegada;
      if (novaPos && posicoesUsadas.has(novaPos)) {
        totalCorrigidos++;
        relatorio.push(
          `Corrigida posição duplicada (${novaPos}º lugar) para "${p.atletaNome}" na Bateria ${bat.numeroBateria} (${bat.categoriaNome})`
        );
        novaPos = undefined; // Reset duplicate position so judge re-assigns cleanly
      } else if (novaPos) {
        posicoesUsadas.add(novaPos);
      }
      return {
        ...p,
        posicaoChegada: novaPos,
      };
    });

    // Fix duplicate gates in the same heat
    const gatesUsados = new Set<number>();
    pilotosCorrigidos.forEach((p, idx) => {
      if (!p.gate || gatesUsados.has(p.gate)) {
        // Assign first available gate 1-8
        let novoGate = 1;
        while (gatesUsados.has(novoGate) && novoGate <= 8) {
          novoGate++;
        }
        gatesUsados.add(novoGate);
        p.gate = novoGate;
        totalCorrigidos++;
        relatorio.push(
          `Reatribuído Gate ${novoGate} para "${p.atletaNome}" na Bateria ${bat.numeroBateria} (${bat.categoriaNome})`
        );
      } else {
        gatesUsados.add(p.gate);
      }
    });

    // Recalculate UCI points strictly
    const batRevisada = recalcularPontosBateria({
      ...bat,
      pilotos: pilotosCorrigidos,
    });

    bateriasSaneadas.push(batRevisada);
  });

  relatorio.push(
    `Recalculadas pontuações UCI em todas as ${bateriasSaneadas.length} baterias do sistema.`
  );

  const stateCorrigido: BMXSystemState = {
    ...state,
    inscricoes: inscricoesValidas,
    baterias: bateriasSaneadas,
  };

  return {
    stateCorrigido,
    itensCorrigidos: totalCorrigidos,
    relatorioCorrecao: relatorio,
  };
}
