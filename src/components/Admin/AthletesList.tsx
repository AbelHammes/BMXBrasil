import React, { useState } from 'react';
import { Atleta, Categoria, Inscricao, ProvaEvento } from '../../types/bmx';
import { UserCheck, Plus, Search, Filter, Trash2, CheckCircle2 } from 'lucide-react';

interface AthletesListProps {
  inscricoes: Inscricao[];
  setInscricoes: React.Dispatch<React.SetStateAction<Inscricao[]>>;
  provas: ProvaEvento[];
  categorias: Categoria[];
}

export const AthletesList: React.FC<AthletesListProps> = ({
  inscricoes,
  setInscricoes,
  provas,
  categorias,
}) => {
  const [provaFiltro, setProvaFiltro] = useState<string>(provas[0]?.id || '');
  const [termoBusca, setTermoBusca] = useState<string>('');

  const inscricoesFiltradas = inscricoes.filter((i) => {
    const batemProva = provaFiltro === '' || i.provaId === provaFiltro;
    const batemBusca =
      i.atletaNome.toLowerCase().includes(termoBusca.toLowerCase()) ||
      i.numeroPlaca.includes(termoBusca) ||
      i.transponderId.toLowerCase().includes(termoBusca.toLowerCase());
    return batemProva && batemBusca;
  });

  const handleExcluirInscricao = (id: string) => {
    if (confirm('Remover esta inscrição da prova?')) {
      setInscricoes((prev) => prev.filter((i) => i.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-500 text-slate-950 text-xs font-black px-2.5 py-0.5 rounded uppercase flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5" /> GESTÃO DE INSCRITOS
            </span>
            <span className="text-slate-400 text-xs font-mono">
              Inscrições Ativas: {inscricoes.length}
            </span>
          </div>
          <h2 className="text-2xl font-black text-white">
            Atletas Inscritos por Prova e Categoria
          </h2>
          <p className="text-sm text-slate-300 mt-0.5">
            Consulte placas numéricas, transponders vinculados, pagamentos e confirmações de presença.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
            Filtrar por Evento / Prova
          </label>
          <select
            value={provaFiltro}
            onChange={(e) => setProvaFiltro(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm font-bold focus:outline-none focus:border-emerald-500"
          >
            <option value="">Todas as Provas</option>
            {provas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
            Buscar Atleta / Placa / Transponder
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Digite para buscar..."
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-4 py-2 text-slate-800 text-sm font-semibold focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
              <th className="py-3 px-4">PLACA</th>
              <th className="py-3 px-4">ATLETA</th>
              <th className="py-3 px-4">CLUBE</th>
              <th className="py-3 px-4">CATEGORIA</th>
              <th className="py-3 px-4">TRANSPONDER</th>
              <th className="py-3 px-4 text-center">PAGAMENTO</th>
              <th className="py-3 px-4 text-center">AÇÃO</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {inscricoesFiltradas.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-slate-500 font-semibold">
                  Nenhuma inscrição localizada.
                </td>
              </tr>
            ) : (
              inscricoesFiltradas.map((ins) => (
                <tr key={ins.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-mono font-black text-amber-600 text-sm">
                    #{ins.numeroPlaca}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900 text-sm">
                    {ins.atletaNome}
                    <div className="text-[10px] text-slate-400 font-mono">
                      CPF: {ins.atletaCpf}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-700">{ins.clubeNome}</td>
                  <td className="py-3 px-4">
                    <span className="bg-emerald-50 text-emerald-800 font-bold px-2.5 py-1 rounded border border-emerald-200">
                      {ins.categoriaNome}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-amber-600">
                    {ins.transponderId}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded text-[10px]">
                      {ins.statusPagamento}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleExcluirInscricao(ins.id)}
                      className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition"
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
  );
};
