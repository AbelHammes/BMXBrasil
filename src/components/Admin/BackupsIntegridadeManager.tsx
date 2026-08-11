import React, { useState, useEffect } from 'react';
import {
  Atleta,
  BateriaMoto,
  Categoria,
  ClubeEquipe,
  Inscricao,
  ProvaEvento,
  Ranking,
  TransponderValidationLog,
} from '../../types/bmx';
import {
  auditarIntegridadeSistema,
  BackupSnapshot,
  BMXSystemState,
  carregarSnapshotsDoStorage,
  deletarSnapshotDoStorage,
  exportarBackupJSON,
  IntegrityAuditResult,
  salvarSnapshotNoStorage,
  sanearECorrigirIntegridade,
  validarEImportarBackupJSON,
} from '../../utils/backupAndIntegrity';
import {
  ShieldCheck,
  ShieldAlert,
  Database,
  RotateCcw,
  Download,
  Upload,
  RefreshCw,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
  Trash2,
  FileText,
  Clock,
  HardDrive,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';

interface BackupsIntegridadeManagerProps {
  categorias: Categoria[];
  setCategorias: React.Dispatch<React.SetStateAction<Categoria[]>>;
  clubes: ClubeEquipe[];
  setClubes: React.Dispatch<React.SetStateAction<ClubeEquipe[]>>;
  atletas: Atleta[];
  setAtletas: React.Dispatch<React.SetStateAction<Atleta[]>>;
  rankings: Ranking[];
  setRankings: React.Dispatch<React.SetStateAction<Ranking[]>>;
  provas: ProvaEvento[];
  setProvas: React.Dispatch<React.SetStateAction<ProvaEvento[]>>;
  inscricoes: Inscricao[];
  setInscricoes: React.Dispatch<React.SetStateAction<Inscricao[]>>;
  baterias: BateriaMoto[];
  setBaterias: React.Dispatch<React.SetStateAction<BateriaMoto[]>>;
  transponderLogs: TransponderValidationLog[];
  setTransponderLogs: React.Dispatch<React.SetStateAction<TransponderValidationLog[]>>;
}

export const BackupsIntegridadeManager: React.FC<
  BackupsIntegridadeManagerProps
> = ({
  categorias,
  setCategorias,
  clubes,
  setClubes,
  atletas,
  setAtletas,
  rankings,
  setRankings,
  provas,
  setProvas,
  inscricoes,
  setInscricoes,
  baterias,
  setBaterias,
  transponderLogs,
  setTransponderLogs,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'BACKUPS' | 'INTEGRIDADE'
  >('BACKUPS');

  const [snapshots, setSnapshots] = useState<BackupSnapshot[]>([]);
  const [auditResult, setAuditResult] = useState<IntegrityAuditResult | null>(
    null
  );
  const [mensagemStatus, setMensagemStatus] = useState<string | null>(null);
  const [modalNovoSnapshot, setModalNovoSnapshot] = useState<boolean>(false);
  const [nomeNovoSnapshot, setNomeNovoSnapshot] = useState<string>('');
  const [logCorrecao, setLogCorrecao] = useState<string[] | null>(null);

  // Current system state object
  const currentState: BMXSystemState = {
    categorias,
    clubes,
    atletas,
    rankings,
    provas,
    inscricoes,
    baterias,
    transponderLogs,
  };

  // Load snapshots and run initial audit scan
  useEffect(() => {
    carregarListaSnapshots();
    executarAuditoria();
  }, [baterias, inscricoes, provas, categorias, atletas]);

  const carregarListaSnapshots = () => {
    const lista = carregarSnapshotsDoStorage();
    setSnapshots(lista);
  };

  const executarAuditoria = () => {
    const res = auditarIntegridadeSistema(currentState);
    setAuditResult(res);
  };

  // Create manual backup snapshot
  const handleCriarSnapshotManual = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const titulo = nomeNovoSnapshot.trim() || `Ponto Manual - ${new Date().toLocaleTimeString()}`;
    const snap = salvarSnapshotNoStorage(titulo, 'MANUAL', currentState);
    setSnapshots(carregarSnapshotsDoStorage());
    setModalNovoSnapshot(false);
    setNomeNovoSnapshot('');
    setMensagemStatus(`✅ Ponto de restauração "${snap.nome}" criado com sucesso!`);
    setTimeout(() => setMensagemStatus(null), 4000);
  };

  // Restore snapshot with confirmation
  const handleRestaurarSnapshot = (snap: BackupSnapshot) => {
    if (
      !window.confirm(
        `⚠️ Tem certeza que deseja restaurar o ponto de restauração "${snap.nome}"?\n\nIsso substituirá todos os dados atuais do sistema pelos dados deste backup (${new Date(
          snap.timestamp
        ).toLocaleString()}).`
      )
    ) {
      return;
    }

    // First save a pre-restore automatic safety point of the current state
    salvarSnapshotNoStorage(
      `Segurança - Antes de restaurar (${snap.nome})`,
      'PRE_OPERACAO',
      currentState
    );

    // Apply restored state
    setCategorias(snap.data.categorias || []);
    setClubes(snap.data.clubes || []);
    setAtletas(snap.data.atletas || []);
    setRankings(snap.data.rankings || []);
    setProvas(snap.data.provas || []);
    setInscricoes(snap.data.inscricoes || []);
    setBaterias(snap.data.baterias || []);
    setTransponderLogs(snap.data.transponderLogs || []);

    setMensagemStatus(
      `🔄 Sistema restaurado com sucesso para o ponto "${snap.nome}"!`
    );
    setTimeout(() => setMensagemStatus(null), 5000);
    carregarListaSnapshots();
  };

  // Delete snapshot
  const handleDeletarSnapshot = (snapshotId: string) => {
    const atualizados = deletarSnapshotDoStorage(snapshotId);
    setSnapshots(atualizados);
  };

  // Import JSON backup file
  const handleImportarArquivoJSON = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = validarEImportarBackupJSON(content);

      if (!res.valido || !res.state) {
        alert(`❌ Falha na importação: ${res.erro}`);
        return;
      }

      if (
        window.confirm(
          `📦 Backup validado com sucesso!\n\nProvas: ${res.state.provas.length}\nInscrições: ${res.state.inscricoes.length}\nBaterias: ${res.state.baterias.length}\nAtletas: ${res.state.atletas.length}\n\nDeseja restaurar este arquivo agora? Um ponto de segurança do estado atual será criado automaticamente.`
        )
      ) {
        // Create pre-import snapshot
        salvarSnapshotNoStorage(
          `Segurança - Antes da importação de JSON`,
          'PRE_OPERACAO',
          currentState
        );

        // Apply imported state
        setCategorias(res.state.categorias || []);
        setClubes(res.state.clubes || []);
        setAtletas(res.state.atletas || []);
        setRankings(res.state.rankings || []);
        setProvas(res.state.provas || []);
        setInscricoes(res.state.inscricoes || []);
        setBaterias(res.state.baterias || []);
        setTransponderLogs(res.state.transponderLogs || []);

        setMensagemStatus('📥 Arquivo JSON importado e aplicado com sucesso!');
        setTimeout(() => setMensagemStatus(null), 5000);
        carregarListaSnapshots();
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // reset file input
  };

  // One-click Auto Heal / Repair & Recalculate
  const handleSanearIntegridade = () => {
    // Create safety snapshot first
    salvarSnapshotNoStorage(
      'Segurança - Antes do Saneamento de Integridade',
      'PRE_OPERACAO',
      currentState
    );

    const { stateCorrigido, itensCorrigidos, relatorioCorrecao } =
      sanearECorrigirIntegridade(currentState);

    setInscricoes(stateCorrigido.inscricoes);
    setBaterias(stateCorrigido.baterias);
    setLogCorrecao(relatorioCorrecao);

    setMensagemStatus(
      `✨ Saneamento concluído! ${itensCorrigidos} itens corrigidos e todas as pontuações UCI recalculadas.`
    );
    setTimeout(() => setMensagemStatus(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl border border-indigo-500/30 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-amber-400 text-slate-950 text-xs font-black px-2.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
              <Database className="w-3.5 h-3.5" /> SEGURANÇA E AUDITORIA
            </span>
            <span className="bg-indigo-500/20 text-indigo-300 text-xs border border-indigo-500/30 px-2 py-0.5 rounded font-mono">
              Pontos de Restauração & Auditoria UCI
            </span>
          </div>
          <h2 className="text-2xl font-black text-white">
            Backups, Restauração e Integridade da Apuração
          </h2>
          <p className="text-sm text-slate-300 mt-0.5">
            Pontos de restauração automáticos, controle de backups JSON e diagnóstico de integridade de pontuações e classificações.
          </p>
        </div>

        {/* Quick Integrity Score Pill */}
        {auditResult && (
          <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-700/80 flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg shadow-inner ${
                auditResult.statusGeral === 'SAUDAVEL'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : auditResult.statusGeral === 'ATENCAO'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-red-500/20 text-red-400 border border-red-500/40'
              }`}
            >
              {auditResult.scoreIntegridade}%
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase">
                Integridade do Sistema
              </div>
              <div className="text-sm font-black text-white flex items-center gap-1">
                {auditResult.statusGeral === 'SAUDAVEL' ? (
                  <>
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">100% Íntegro</span>
                  </>
                ) : auditResult.statusGeral === 'ATENCAO' ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span className="text-amber-300">
                      {auditResult.totalAlertas} Alertas
                    </span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-4 h-4 text-red-400" />
                    <span className="text-red-400">
                      {auditResult.totalErrosCriticos} Erros Críticos
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {mensagemStatus && (
        <div className="bg-emerald-900/40 border border-emerald-500 text-emerald-200 px-4 py-3 rounded-xl text-sm font-semibold flex items-center justify-between shadow-lg animate-fade-in">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            {mensagemStatus}
          </span>
        </div>
      )}

      {/* Sub Tabs Bar */}
      <div className="bg-slate-900 p-2 rounded-2xl border border-slate-800 shadow-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/80">
          <button
            onClick={() => setActiveSubTab('BACKUPS')}
            className={`px-4 py-2 rounded-lg text-xs font-black transition flex items-center gap-2 ${
              activeSubTab === 'BACKUPS'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            Pontos de Restauração & Backups ({snapshots.length})
          </button>
          <button
            onClick={() => {
              setActiveSubTab('INTEGRIDADE');
              executarAuditoria();
            }}
            className={`px-4 py-2 rounded-lg text-xs font-black transition flex items-center gap-2 ${
              activeSubTab === 'INTEGRIDADE'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" />
            Auditoria & Integridade da Apuração UCI
            {auditResult && auditResult.issues.length > 0 && (
              <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {auditResult.issues.length}
              </span>
            )}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setModalNovoSnapshot(true)}
            className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow transition"
          >
            <PlusCircle className="w-4 h-4" />
            Criar Ponto Manual
          </button>
          <button
            onClick={() => exportarBackupJSON(currentState)}
            className="bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition"
          >
            <Download className="w-4 h-4" />
            Exportar JSON
          </button>
          <label className="bg-slate-800 hover:bg-slate-700 text-blue-300 border border-blue-500/30 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer">
            <Upload className="w-4 h-4" />
            Importar JSON
            <input
              type="file"
              accept=".json"
              onChange={handleImportarArquivoJSON}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Sub Tab CONTENT 1: BACKUPS & RESTORE POINTS */}
      {activeSubTab === 'BACKUPS' && (
        <div className="space-y-6">
          {/* Automatic Backup Information Card */}
          <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 flex items-start gap-3 text-slate-300 text-xs">
            <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white text-sm block mb-0.5">
                Proteção Automática Ativa
              </span>
              O sistema cria snapshots e pontos de restauração de segurança no navegador antes de operações críticas (como geração/sorteio de baterias, eliminação de dados ou restaurações).
            </div>
          </div>

          {/* Snapshots Table */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-white text-base flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                Histórico de Pontos de Restauração Armazenados
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                {snapshots.length} de 20 pontos de restauração disponíveis
              </span>
            </div>

            {snapshots.length === 0 ? (
              <div className="text-center py-10 bg-slate-950/50 rounded-xl border border-slate-800 text-slate-400 space-y-2">
                <Database className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="font-bold text-sm text-slate-300">
                  Nenhum ponto de restauração salvo ainda
                </p>
                <p className="text-xs text-slate-500">
                  Clique no botão "Criar Ponto Manual" acima para gerar seu primeiro backup snapshot.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-2.5 px-3">TIPO</th>
                      <th className="py-2.5 px-3">NOME DO BACKUP</th>
                      <th className="py-2.5 px-3">DATA / HORA</th>
                      <th className="py-2.5 px-3 text-center">CONTEÚDO DO BACKUP</th>
                      <th className="py-2.5 px-3 text-right">AÇÕES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {snapshots.map((snap) => {
                      const dataFmt = new Date(snap.timestamp).toLocaleString('pt-BR');
                      return (
                        <tr key={snap.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-3 px-3">
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded uppercase border ${
                                snap.tipo === 'MANUAL'
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                  : snap.tipo === 'PRE_OPERACAO'
                                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              }`}
                            >
                              {snap.tipo === 'MANUAL'
                                ? 'MANUAL'
                                : snap.tipo === 'PRE_OPERACAO'
                                ? 'SEGURANÇA'
                                : 'AUTO'}
                            </span>
                          </td>

                          <td className="py-3 px-3 font-bold text-white">
                            {snap.nome}
                          </td>

                          <td className="py-3 px-3 text-slate-400 font-mono">
                            {dataFmt}
                          </td>

                          <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-300">
                            <span className="bg-slate-800 px-2 py-1 rounded border border-slate-700">
                              Provas:{snap.estatisticas.totalProvas} | Insc:{snap.estatisticas.totalInscricoes} | Bat:{snap.estatisticas.totalBaterias}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-right space-x-2">
                            <button
                              onClick={() => handleRestaurarSnapshot(snap)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-3 py-1.5 rounded-lg transition shadow flex items-center gap-1 inline-flex"
                              title="Restaurar todo o sistema para este estado"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              Restaurar
                            </button>

                            <button
                              onClick={() => exportarBackupJSON(snap.data, `BACKUP_${snap.nome.replace(/\s+/g, '_')}.json`)}
                              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-2.5 py-1.5 rounded-lg transition border border-slate-700 inline-flex"
                              title="Baixar cópia deste ponto em arquivo JSON"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeletarSnapshot(snap.id)}
                              className="bg-slate-800 hover:bg-red-950 text-red-400 font-bold px-2.5 py-1.5 rounded-lg transition border border-slate-700 hover:border-red-800 inline-flex"
                              title="Excluir este ponto de restauração"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sub Tab CONTENT 2: INTEGRITY & UCI AUDIT */}
      {activeSubTab === 'INTEGRIDADE' && auditResult && (
        <div className="space-y-6">
          {/* Audit Metrics Dashboard */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-md">
              <div className="text-xs font-bold text-slate-400 uppercase mb-1">
                Score de Integridade
              </div>
              <div className="text-3xl font-black text-amber-400 font-mono">
                {auditResult.scoreIntegridade}%
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Acurácia de pontos e integridade de dados
              </p>
            </div>

            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-md">
              <div className="text-xs font-bold text-slate-400 uppercase mb-1">
                Erros Críticos
              </div>
              <div
                className={`text-3xl font-black font-mono ${
                  auditResult.totalErrosCriticos > 0
                    ? 'text-red-400'
                    : 'text-emerald-400'
                }`}
              >
                {auditResult.totalErrosCriticos}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Inconsistências de posições ou gates
              </p>
            </div>

            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-md">
              <div className="text-xs font-bold text-slate-400 uppercase mb-1">
                Alertas de Pontuação
              </div>
              <div
                className={`text-3xl font-black font-mono ${
                  auditResult.totalAlertas > 0
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {auditResult.totalAlertas}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Cálculos UCI que precisam de recálculo
              </p>
            </div>

            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-md">
              <div className="text-xs font-bold text-slate-400 uppercase mb-1">
                Notificações Gerais
              </div>
              <div className="text-3xl font-black text-blue-400 font-mono">
                {auditResult.totalInfos}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Inscrições sem transponders vinculados
              </p>
            </div>
          </div>

          {/* Action Callout */}
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-black text-white text-base flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                Sanear e Recalcular Integridade do Sistema
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Executa o recálculo estrito da tabela de pontos UCI em todas as baterias, desfaz colisões acidentais de posições e reorganiza alinhamentos de gate.
              </p>
            </div>

            <button
              onClick={handleSanearIntegridade}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-5 py-3 rounded-xl shadow-lg transition flex items-center gap-2 shrink-0 border border-emerald-400/30"
            >
              <RefreshCw className="w-4 h-4" />
              Corrigir e Recalcular Tudo
            </button>
          </div>

          {/* Repair Log if executed */}
          {logCorrecao && logCorrecao.length > 0 && (
            <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/40 text-xs font-mono text-emerald-300 space-y-1">
              <div className="font-sans font-bold text-white mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Relatório de Correções Executadas:
              </div>
              {logCorrecao.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-500">•</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}

          {/* Audit Diagnostics List */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-white text-base flex items-center gap-2">
                <Activity className="w-5 h-5 text-amber-400" />
                Relatório da Varredura Diagnóstica
              </h3>
              <button
                onClick={executarAuditoria}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-3 py-1 rounded-lg text-xs transition flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Re-verificar
              </button>
            </div>

            {auditResult.issues.length === 0 ? (
              <div className="text-center py-10 bg-emerald-950/20 rounded-xl border border-emerald-500/30 text-emerald-300 space-y-2">
                <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto" />
                <p className="font-extrabold text-base text-white">
                  Excelente! Nenhum erro de integridade detectado.
                </p>
                <p className="text-xs text-emerald-400">
                  Todas as baterias, posições, pontuações UCI e inscrições estão 100% íntegras.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {auditResult.issues.map((issue) => (
                  <div
                    key={issue.id}
                    className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                      issue.severidade === 'CRITICAL'
                        ? 'bg-red-950/30 border-red-500/50 text-red-200'
                        : issue.severidade === 'WARNING'
                        ? 'bg-amber-950/30 border-amber-500/50 text-amber-200'
                        : 'bg-blue-950/30 border-blue-500/50 text-blue-200'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                            issue.severidade === 'CRITICAL'
                              ? 'bg-red-500 text-slate-950'
                              : issue.severidade === 'WARNING'
                              ? 'bg-amber-400 text-slate-950'
                              : 'bg-blue-500 text-white'
                          }`}
                        >
                          {issue.severidade}
                        </span>
                        <span className="font-bold text-white text-sm">
                          {issue.titulo}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          ({issue.categoria})
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">
                        {issue.descricao}
                      </p>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Local: {issue.localizacao}
                      </div>
                    </div>

                    {issue.corrigivelAutomaticamente && (
                      <button
                        onClick={handleSanearIntegridade}
                        className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-400/30 font-bold px-3 py-1.5 rounded-lg text-xs transition shadow shrink-0"
                      >
                        Corrigir Automaticamente
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Criar Ponto de Restauração */}
      {modalNovoSnapshot && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-white text-lg flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-amber-400" />
                Criar Ponto de Restauração
              </h3>
              <button
                onClick={() => setModalNovoSnapshot(false)}
                className="text-slate-400 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCriarSnapshotManual} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Nome do Ponto de Restauração
                </label>
                <input
                  type="text"
                  placeholder="Ex: Antes da Moto 2 de Indaiatuba"
                  value={nomeNovoSnapshot}
                  onChange={(e) => setNomeNovoSnapshot(e.target.value)}
                  className="w-full bg-slate-800 text-white font-semibold text-sm rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:border-amber-400"
                  autoFocus
                />
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-400 text-xs font-mono space-y-1">
                <div className="text-slate-300 font-bold">Inclusos neste backup:</div>
                <div>• Provas: {provas.length}</div>
                <div>• Inscritos: {inscricoes.length}</div>
                <div>• Baterias: {baterias.length}</div>
                <div>• Atletas: {atletas.length}</div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalNovoSnapshot(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-4 py-2 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-5 py-2 rounded-xl shadow transition"
                >
                  Salvar Ponto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
