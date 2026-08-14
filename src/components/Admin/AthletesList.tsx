import React, { useState } from 'react';
import { Atleta, Categoria, ClubeEquipe, Inscricao, ProvaEvento, StatusPagamento } from '../../types/bmx';
import {
  UserCheck,
  UserPlus,
  Search,
  Filter,
  Trash2,
  CheckCircle2,
  Clock,
  ShieldAlert,
  CreditCard,
  Radio,
  Sparkles,
  FileSpreadsheet,
  Download,
  Upload,
} from 'lucide-react';
import { ModalInscricaoManualAtleta } from './ModalInscricaoManualAtleta';
import { ModalImportarInscritosExcel } from './ModalImportarInscritosExcel';
import { baixarPlanilhaModeloBMX } from '../../utils/excelImportExport';

interface AthletesListProps {
  inscricoes: Inscricao[];
  setInscricoes: React.Dispatch<React.SetStateAction<Inscricao[]>>;
  provas: ProvaEvento[];
  categorias: Categoria[];
  atletas?: Atleta[];
  setAtletas?: React.Dispatch<React.SetStateAction<Atleta[]>>;
  clubes?: ClubeEquipe[];
}

export const AthletesList: React.FC<AthletesListProps> = ({
  inscricoes,
  setInscricoes,
  provas,
  categorias,
  atletas = [],
  setAtletas = () => {},
  clubes = [],
}) => {
  const [provaFiltro, setProvaFiltro] = useState<string>(provas[0]?.id || '');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('');
  const [pagamentoFiltro, setPagamentoFiltro] = useState<string>('');
  const [termoBusca, setTermoBusca] = useState<string>('');
  const [isModalInscricaoOpen, setIsModalInscricaoOpen] = useState(false);
  const [isModalExcelOpen, setIsModalExcelOpen] = useState(false);

  const inscricoesFiltradas = inscricoes.filter((i) => {
    const batemProva = provaFiltro === '' || i.provaId === provaFiltro;
    const batemCategoria = categoriaFiltro === '' || i.categoriaId === categoriaFiltro;
    const batemPagamento = pagamentoFiltro === '' || i.statusPagamento === pagamentoFiltro;
    const batemBusca =
      i.atletaNome.toLowerCase().includes(termoBusca.toLowerCase()) ||
      i.numeroPlaca.includes(termoBusca) ||
      i.transponderId.toLowerCase().includes(termoBusca.toLowerCase()) ||
      i.clubeNome.toLowerCase().includes(termoBusca.toLowerCase());
    return batemProva && batemCategoria && batemPagamento && batemBusca;
  });

  const handleExcluirInscricao = (id: string) => {
    if (confirm('Remover esta inscrição da prova?')) {
      setInscricoes((prev) => prev.filter((i) => i.id !== id));
    }
  };

  const handleTogglePagamento = (id: string, current: StatusPagamento) => {
    const nextStatus: StatusPagamento =
      current === 'Confirmada' ? 'Pendente' : current === 'Pendente' ? 'Isento' : 'Confirmada';
    setInscricoes((prev) =>
      prev.map((i) => (i.id === id ? { ...i, statusPagamento: nextStatus } : i))
    );
  };

  const handleBaixarModelo = () => {
    baixarPlanilhaModeloBMX(categorias, clubes);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-800 text-white shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-500 text-slate-950 text-xs font-black px-2.5 py-0.5 rounded uppercase flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5" /> GESTÃO DE INSCRITOS
            </span>
            <span className="text-slate-400 text-xs font-mono">
              Total Cadastrado: {inscricoes.length} | Filtrados: {inscricoesFiltradas.length}
            </span>
          </div>
          <h2 className="text-2xl font-black text-white">
            Atletas Inscritos por Prova e Categoria
          </h2>
          <p className="text-sm text-slate-300 mt-0.5">
            Importe planilhas Excel em lote com auto-distribuição de categorias, gerencie placas e controle pagamentos.
          </p>
        </div>

        {/* Action Buttons: Excel Template, Excel Import, and Manual Inscription */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full lg:w-auto">
          {/* Download Template */}
          <button
            onClick={handleBaixarModelo}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 transition flex items-center gap-1.5 shadow"
            title="Baixar planilha padrão oficial (.xlsx) com instruções e lista de categorias"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Baixar Modelo Excel</span>
          </button>

          {/* Import Excel */}
          <button
            onClick={() => setIsModalExcelOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm px-4 py-2.5 rounded-xl transition shadow-lg flex items-center gap-2"
            title="Importar lista de atletas inscritos via arquivo Excel (.xlsx, .xls, .csv)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span>Importar do Excel</span>
          </button>

          {/* Action Button: Manual Inscription */}
          <button
            onClick={() => setIsModalInscricaoOpen(true)}
            className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm px-4 py-2.5 rounded-xl transition shadow-lg flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Nova Inscrição Manual</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Prova Filter */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
            Evento / Prova
          </label>
          <select
            value={provaFiltro}
            onChange={(e) => setProvaFiltro(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-xs font-bold focus:outline-none focus:border-emerald-500"
          >
            <option value="">Todas as Provas</option>
            {provas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
            Categoria
          </label>
          <select
            value={categoriaFiltro}
            onChange={(e) => setCategoriaFiltro(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-xs font-bold focus:outline-none focus:border-emerald-500"
          >
            <option value="">Todas as Categorias</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Payment Filter */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
            Status Pagamento
          </label>
          <select
            value={pagamentoFiltro}
            onChange={(e) => setPagamentoFiltro(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-xs font-bold focus:outline-none focus:border-emerald-500"
          >
            <option value="">Todos os Status</option>
            <option value="Confirmada">Confirmada (Pago)</option>
            <option value="Pendente">Pendente</option>
            <option value="Isento">Isento</option>
          </select>
        </div>

        {/* Search */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
            Buscar Atleta / Placa / Chip
          </label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Nome, placa, chip..."
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-2 text-slate-800 text-xs font-semibold focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Table Container - Fully Responsive */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                <th className="py-3 px-4">PLACA</th>
                <th className="py-3 px-4">ATLETA</th>
                <th className="py-3 px-4">CLUBE</th>
                <th className="py-3 px-4">CATEGORIA NA PROVA</th>
                <th className="py-3 px-4">TRANSPONDER</th>
                <th className="py-3 px-4 text-center">PAGAMENTO</th>
                <th className="py-3 px-4 text-center">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {inscricoesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500 font-semibold">
                    <div className="max-w-sm mx-auto text-center space-y-2">
                      <p>Nenhuma inscrição localizada com os filtros selecionados.</p>
                      <button
                        onClick={() => setIsModalInscricaoOpen(true)}
                        className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black px-4 py-2 rounded-xl text-xs inline-flex items-center gap-1.5 shadow"
                      >
                        <UserPlus className="w-3.5 h-3.5" /> Adicionar Primeira Inscrição
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                inscricoesFiltradas.map((ins) => (
                  <tr key={ins.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-black text-amber-600 text-sm">
                      #{ins.numeroPlaca}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-sm">{ins.atletaNome}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        CPF: {ins.atletaCpf || 'Não informado'}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">{ins.clubeNome}</td>
                    <td className="py-3 px-4">
                      <span className="bg-emerald-50 text-emerald-800 font-bold px-2.5 py-1 rounded-md border border-emerald-200 inline-block">
                        {ins.categoriaNome}
                      </span>
                      {ins.categoriaOriginalNome &&
                        ins.categoriaOriginalNome !== ins.categoriaNome && (
                          <span className="block text-[10px] text-slate-400 mt-0.5 font-mono">
                            Origem: {ins.categoriaOriginalNome}
                          </span>
                        )}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">
                      {ins.transponderId || '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleTogglePagamento(ins.id, ins.statusPagamento)}
                        title="Clique para alternar o status de pagamento"
                        className={`font-extrabold px-2.5 py-1 rounded-lg text-[10px] border transition cursor-pointer ${
                          ins.statusPagamento === 'Confirmada'
                            ? 'bg-emerald-100 border-emerald-300 text-emerald-800 hover:bg-emerald-200'
                            : ins.statusPagamento === 'Pendente'
                            ? 'bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200'
                            : 'bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200'
                        }`}
                      >
                        {ins.statusPagamento}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleExcluirInscricao(ins.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition"
                        title="Excluir Inscrição"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Enrollment Modal */}
      <ModalInscricaoManualAtleta
        isOpen={isModalInscricaoOpen}
        onClose={() => setIsModalInscricaoOpen(false)}
        provas={provas}
        categorias={categorias}
        atletas={atletas}
        setAtletas={setAtletas}
        clubes={clubes}
        inscricoes={inscricoes}
        setInscricoes={setInscricoes}
        initialProvaId={provaFiltro || undefined}
      />

      {/* Bulk Excel Import Modal */}
      <ModalImportarInscritosExcel
        isOpen={isModalExcelOpen}
        onClose={() => setIsModalExcelOpen(false)}
        provas={provas}
        categorias={categorias}
        clubes={clubes}
        atletas={atletas}
        setAtletas={setAtletas}
        inscricoes={inscricoes}
        setInscricoes={setInscricoes}
        initialProvaId={provaFiltro || undefined}
      />
    </div>
  );
};
