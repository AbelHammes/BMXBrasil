import React, { useState, useRef } from 'react';
import { Atleta, Categoria, ClubeEquipe, Inscricao, ProvaEvento } from '../../types/bmx';
import {
  baixarPlanilhaModeloBMX,
  processarPlanilhaExcelInscritos,
  aplicarImportacaoInscritos,
  ResultadoProcessamentoExcel,
  LinhaImportadaPreview,
} from '../../utils/excelImportExport';
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Users,
  Layers,
  Sparkles,
  Search,
  Filter,
  Check,
  RefreshCw,
  Info,
  Calendar,
  Zap,
} from 'lucide-react';

interface ModalImportarInscritosExcelProps {
  isOpen: boolean;
  onClose: () => void;
  provas: ProvaEvento[];
  categorias: Categoria[];
  clubes: ClubeEquipe[];
  atletas: Atleta[];
  setAtletas: React.Dispatch<React.SetStateAction<Atleta[]>>;
  inscricoes: Inscricao[];
  setInscricoes: React.Dispatch<React.SetStateAction<Inscricao[]>>;
  initialProvaId?: string;
}

export const ModalImportarInscritosExcel: React.FC<ModalImportarInscritosExcelProps> = ({
  isOpen,
  onClose,
  provas,
  categorias,
  clubes,
  atletas,
  setAtletas,
  inscricoes,
  setInscricoes,
  initialProvaId,
}) => {
  const [provaSelecionadaId, setProvaSelecionadaId] = useState<string>(
    initialProvaId || provas[0]?.id || ''
  );
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null);
  const [isProcessando, setIsProcessando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoProcessamentoExcel | null>(null);
  const [erroFatal, setErroFatal] = useState<string | null>(null);
  const [sucessoMensagem, setSucessoMensagem] = useState<string | null>(null);

  // Options
  const [autoDistribuir, setAutoDistribuir] = useState(true);
  const [atualizarBase, setAtualizarBase] = useState(true);
  const [gerarPlacas, setGerarPlacas] = useState(true);

  // Filters for preview table
  const [filtroCategoria, setFiltroCategoria] = useState<string>('');
  const [filtroStatus, setFiltroStatus] = useState<string>('');
  const [buscaTermo, setBuscaTermo] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  if (!isOpen) return null;

  const provaAlvo = provas.find((p) => p.id === provaSelecionadaId) || provas[0];

  const handleDownloadTemplate = () => {
    baixarPlanilhaModeloBMX(categorias, clubes);
  };

  const handleProcessarArquivo = async (file: File) => {
    if (!provaAlvo) {
      setErroFatal('Selecione uma prova válida antes de processar o arquivo.');
      return;
    }

    setArquivoSelecionado(file);
    setIsProcessando(true);
    setErroFatal(null);
    setResultado(null);
    setSucessoMensagem(null);

    try {
      const res = await processarPlanilhaExcelInscritos(
        file,
        provaAlvo,
        categorias,
        clubes,
        atletas,
        inscricoes,
        {
          autoDistribuirSeInvalido: autoDistribuir,
          atualizarAtletaSeExiste: atualizarBase,
          gerarPlacaSeAusente: gerarPlacas,
        }
      );
      setResultado(res);
    } catch (err: any) {
      setErroFatal(err.message || 'Erro ao processar a planilha Excel.');
    } finally {
      setIsProcessando(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleProcessarArquivo(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessarArquivo(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmarImportacao = () => {
    if (!resultado || resultado.linhasValidas.length === 0 || !provaAlvo) return;

    const resImport = aplicarImportacaoInscritos(
      resultado.linhasValidas,
      provaAlvo,
      atletas,
      setAtletas,
      inscricoes,
      setInscricoes,
      {
        ignorarDuplicatas: true,
        atualizarAtletaBase: atualizarBase,
      }
    );

    setSucessoMensagem(
      `🎉 Importação Concluída com Sucesso! Foram processadas ${resImport.inseridosInscricoes} inscrições na prova "${provaAlvo.nome}", criados ${resImport.criadosAtletas} novos atletas e atualizados ${resImport.atualizadosAtletas} perfis existentes.`
    );
    setTimeout(() => {
      onClose();
    }, 2800);
  };

  // Filter preview rows
  const linhasFiltradas = (resultado?.linhasValidas || []).concat(resultado?.linhasComErro || []).filter(
    (l) => {
      const matchCat = filtroCategoria === '' || l.categoriaResolvidaNome === filtroCategoria;
      const matchStatus = filtroStatus === '' || l.statusLinha === filtroStatus;
      const matchBusca =
        buscaTermo === '' ||
        l.nome.toLowerCase().includes(buscaTermo.toLowerCase()) ||
        l.cpf.includes(buscaTermo) ||
        l.clubeNome.toLowerCase().includes(buscaTermo.toLowerCase()) ||
        l.numeroPlaca.includes(buscaTermo);
      return matchCat && matchStatus && matchBusca;
    }
  );

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-5xl w-full p-5 sm:p-7 shadow-2xl text-white my-auto max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 shadow-lg">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                  IMPORTAÇÃO EM LOTE
                </span>
                <span className="text-slate-400 text-xs font-mono">
                  Padrão Excel (.xlsx, .xls, .csv)
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Importar Cadastro de Inscritos via Excel
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black px-3.5 py-2 rounded-xl transition shadow-md flex items-center gap-1.5 shrink-0"
              title="Baixar planilha padrão com colunas oficiais e lista de categorias"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Modelo Excel (.xlsx)</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 text-lg font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content Body - Scrollable */}
        <div className="overflow-y-auto space-y-6 py-4 pr-1 flex-1">
          {sucessoMensagem ? (
            <div className="bg-emerald-950/80 border-2 border-emerald-500 text-emerald-200 p-6 rounded-2xl text-center space-y-3 animate-fade-in">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
              <h3 className="text-xl font-black text-white">Importação Realizada!</h3>
              <p className="text-sm text-emerald-200 max-w-xl mx-auto">{sucessoMensagem}</p>
            </div>
          ) : (
            <>
              {/* Event Target Selector & Setup Options */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Event Selector */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 md:col-span-1">
                  <label className="block text-xs font-bold text-slate-300 uppercase flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    Prova / Evento de Destino *
                  </label>
                  <select
                    value={provaSelecionadaId}
                    onChange={(e) => {
                      setProvaSelecionadaId(e.target.value);
                      if (arquivoSelecionado) {
                        handleProcessarArquivo(arquivoSelecionado);
                      }
                    }}
                    className="w-full bg-slate-900 text-amber-300 font-bold text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-400"
                  >
                    {provas.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome} ({p.cidadeEstado})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400">
                    Os atletas da planilha serão inscritos automaticamente nesta prova.
                  </p>
                </div>

                {/* Auto Distribution & Sync Checkboxes */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 md:col-span-2 flex flex-col justify-center space-y-2.5">
                  <div className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Regras de Distribuição & Banco de Dados
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                      <input
                        type="checkbox"
                        checked={autoDistribuir}
                        onChange={(e) => setAutoDistribuir(e.target.checked)}
                        className="w-4 h-4 text-emerald-500 rounded border-slate-700 focus:ring-0"
                      />
                      <span>Auto-distribuir por Idade UCI & Bike se categoria não informada</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                      <input
                        type="checkbox"
                        checked={atualizarBase}
                        onChange={(e) => setAtualizarBase(e.target.checked)}
                        className="w-4 h-4 text-emerald-500 rounded border-slate-700 focus:ring-0"
                      />
                      <span>Atualizar dados do atleta na base se CPF já cadastrado</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                      <input
                        type="checkbox"
                        checked={gerarPlacas}
                        onChange={(e) => setGerarPlacas(e.target.checked)}
                        className="w-4 h-4 text-emerald-500 rounded border-slate-700 focus:ring-0"
                      />
                      <span>Gerar número de placa sequencial para quem não tiver</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2.5 ${
                  isDragOver
                    ? 'border-emerald-400 bg-emerald-950/40 shadow-xl'
                    : 'border-slate-700 bg-slate-950/50 hover:bg-slate-950 hover:border-slate-600'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-inner">
                  <Upload className="w-6 h-6" />
                </div>

                <div>
                  <h4 className="text-sm font-black text-white">
                    {arquivoSelecionado ? (
                      <span className="text-amber-300 font-mono">
                        Arquivo Carregado: {arquivoSelecionado.name} (
                        {(arquivoSelecionado.size / 1024).toFixed(1)} KB)
                      </span>
                    ) : (
                      'Arraste e solte sua planilha Excel aqui ou clique para selecionar'
                    )}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Compatível com planilhas .xlsx, .xls ou .csv com as colunas oficiais de inscrição.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span>Dica: Não sabe o formato?</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadTemplate();
                    }}
                    className="text-amber-400 hover:underline font-bold"
                  >
                    Clique aqui para baixar a planilha modelo (.xlsx)
                  </button>
                </div>
              </div>

              {/* Error Message if any */}
              {erroFatal && (
                <div className="bg-red-950/60 border border-red-500/50 text-red-200 p-4 rounded-xl text-xs font-bold flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                  <div>
                    <span className="font-extrabold text-white block">Erro ao processar planilha:</span>
                    <span>{erroFatal}</span>
                  </div>
                </div>
              )}

              {/* Live Preview & Summary if parsed */}
              {resultado && (
                <div className="space-y-4 animate-fade-in">
                  {/* Summary Metric Bento Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                      <span className="text-slate-400 font-bold block text-[10px] uppercase">
                        Linhas Lidas
                      </span>
                      <span className="text-2xl font-black text-white font-mono">
                        {resultado.totalLidos}
                      </span>
                    </div>

                    <div className="bg-slate-950 p-3.5 rounded-xl border border-emerald-500/30">
                      <span className="text-emerald-400 font-bold block text-[10px] uppercase">
                        Inscrições Válidas
                      </span>
                      <span className="text-2xl font-black text-emerald-400 font-mono">
                        {resultado.linhasValidas.length}
                      </span>
                    </div>

                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                      <span className="text-amber-400 font-bold block text-[10px] uppercase">
                        Novos Atletas / Base
                      </span>
                      <span className="text-2xl font-black text-amber-300 font-mono">
                        {resultado.totalNovosAtletas}
                      </span>
                    </div>

                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                      <span className="text-blue-400 font-bold block text-[10px] uppercase">
                        Categorias Atendidas
                      </span>
                      <span className="text-2xl font-black text-blue-300 font-mono">
                        {Object.keys(resultado.distribuicaoPorCategoria).length}
                      </span>
                    </div>
                  </div>

                  {/* Distribution By Category Pills */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-300 uppercase flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-emerald-400" />
                        Distribuição dos Atletas por Categoria na Prova:
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {Object.keys(resultado.distribuicaoPorCategoria).length} categorias
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {Object.entries(resultado.distribuicaoPorCategoria).map(([catNome, count]) => (
                        <div
                          key={catNome}
                          className="bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-xl text-xs flex items-center gap-2"
                        >
                          <span className="font-bold text-slate-200">{catNome}</span>
                          <span className="bg-emerald-500 text-slate-950 font-mono font-black text-[11px] px-2 py-0.5 rounded-md">
                            {count} {count === 1 ? 'atleta' : 'atletas'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Filter & Search Bar for Preview */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    {/* Search */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Buscar por nome, placa, CPF..."
                        value={buscaTermo}
                        onChange={(e) => setBuscaTermo(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-white text-xs focus:outline-none focus:border-emerald-400"
                      />
                    </div>

                    {/* Category Filter */}
                    <div>
                      <select
                        value={filtroCategoria}
                        onChange={(e) => setFiltroCategoria(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-emerald-400"
                      >
                        <option value="">Todas as Categorias ({linhasFiltradas.length})</option>
                        {Object.keys(resultado.distribuicaoPorCategoria).map((catNome) => (
                          <option key={catNome} value={catNome}>
                            {catNome} ({resultado.distribuicaoPorCategoria[catNome]})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Status Filter */}
                    <div>
                      <select
                        value={filtroStatus}
                        onChange={(e) => setFiltroStatus(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-emerald-400"
                      >
                        <option value="">Todos os Status de Validação</option>
                        <option value="OK">Apenas 100% Válidos</option>
                        <option value="AVISO">Com Avisos / Auto-distribuídos</option>
                        <option value="ERRO">Com Erros Bloqueantes</option>
                      </select>
                    </div>
                  </div>

                  {/* Preview Table */}
                  <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                    <div className="overflow-x-auto max-h-72">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-slate-900 text-slate-400 uppercase font-bold sticky top-0 border-b border-slate-800">
                          <tr>
                            <th className="py-2.5 px-3">Linha</th>
                            <th className="py-2.5 px-3">Atleta</th>
                            <th className="py-2.5 px-3">CPF</th>
                            <th className="py-2.5 px-3">Categoria Resolvida</th>
                            <th className="py-2.5 px-3">Placa / Chip</th>
                            <th className="py-2.5 px-3">Clube</th>
                            <th className="py-2.5 px-3">Pagamento</th>
                            <th className="py-2.5 px-3">Validação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80 text-slate-300">
                          {linhasFiltradas.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="text-center py-6 text-slate-500 font-semibold">
                                Nenhuma linha corresponde aos filtros aplicados.
                              </td>
                            </tr>
                          ) : (
                            linhasFiltradas.map((linha) => (
                              <tr key={linha.idTemp} className="hover:bg-slate-900/60 transition">
                                <td className="py-2.5 px-3 font-mono text-slate-500">
                                  #{linha.linhaNumero}
                                </td>
                                <td className="py-2.5 px-3 font-bold text-white">
                                  {linha.nome}
                                  <div className="text-[10px] text-slate-400 font-normal font-mono">
                                    Idade UCI: {linha.idadeCalculada} anos ({linha.sexo})
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 font-mono text-slate-300">
                                  {linha.cpf}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-bold inline-block">
                                    {linha.categoriaResolvidaNome}
                                  </span>
                                  {linha.foiAutoDistribuido && (
                                    <span className="block text-[9px] text-amber-300 font-mono mt-0.5 flex items-center gap-0.5">
                                      <Zap className="w-2.5 h-2.5" /> Auto-Distribuído
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 font-mono font-bold text-amber-400">
                                  #{linha.numeroPlaca}
                                  <div className="text-[10px] text-blue-400 font-normal">
                                    {linha.transponderId}
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 text-slate-300 font-medium truncate max-w-[130px]">
                                  {linha.clubeNome}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span
                                    className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                                      linha.statusPagamento === 'Confirmada'
                                        ? 'bg-emerald-500/20 text-emerald-300'
                                        : 'bg-amber-500/20 text-amber-300'
                                    }`}
                                  >
                                    {linha.statusPagamento}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3">
                                  {linha.statusLinha === 'OK' ? (
                                    <span className="text-emerald-400 flex items-center gap-1 font-bold text-[11px]">
                                      <CheckCircle2 className="w-3.5 h-3.5" /> Válido
                                    </span>
                                  ) : linha.statusLinha === 'AVISO' ? (
                                    <span
                                      className="text-amber-400 flex items-center gap-1 font-bold text-[11px]"
                                      title={linha.mensagens.join(' | ')}
                                    >
                                      <AlertTriangle className="w-3.5 h-3.5" /> Ajustado
                                    </span>
                                  ) : (
                                    <span
                                      className="text-red-400 flex items-center gap-1 font-bold text-[11px]"
                                      title={linha.mensagens.join(' | ')}
                                    >
                                      <XCircle className="w-3.5 h-3.5" /> Erro
                                    </span>
                                  )}
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
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!sucessoMensagem && (
          <div className="border-t border-slate-800 pt-4 mt-2 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <Info className="w-4 h-4 text-slate-500" />
              <span>
                As inscrições importadas ficam prontas instantaneamente para o sorteio de baterias (SQORZ).
              </span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={!resultado || resultado.linhasValidas.length === 0 || isProcessando}
                onClick={handleConfirmarImportacao}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 text-xs font-black transition shadow-lg flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>
                  Confirmar e Importar {resultado?.linhasValidas.length || 0} Inscritos
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
