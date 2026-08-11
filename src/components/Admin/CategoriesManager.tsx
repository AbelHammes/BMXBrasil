import React, { useState } from 'react';
import { BikeType, Categoria } from '../../types/bmx';
import { Layers, Plus, Trash2, CheckCircle2 } from 'lucide-react';

interface CategoriesManagerProps {
  categorias: Categoria[];
  setCategorias: React.Dispatch<React.SetStateAction<Categoria[]>>;
}

export const CategoriesManager: React.FC<CategoriesManagerProps> = ({
  categorias,
  setCategorias,
}) => {
  const [modalAberta, setModalAberta] = useState(false);
  const [nome, setNome] = useState('');
  const [tipoBike, setTipoBike] = useState<BikeType>('Aro 20"');
  const [idadeMin, setIdadeMin] = useState('13');
  const [idadeMax, setIdadeMax] = useState('14');
  const [sexo, setSexo] = useState<'Masculino' | 'Feminino' | 'Misto'>('Masculino');
  const [descricao, setDescricao] = useState('');

  const handleSalvarCategoria = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome) return;

    const novaCat: Categoria = {
      id: `cat-${Date.now()}`,
      nome,
      tipoBike,
      idadeMin: parseInt(idadeMin) || 5,
      idadeMax: parseInt(idadeMax) || 99,
      sexo,
      descricao: descricao || 'Categoria oficial',
    };

    setCategorias((prev) => [...prev, novaCat]);
    setModalAberta(false);
    setNome('');
  };

  const handleExcluirCategoria = (id: string) => {
    if (confirm('Excluir esta categoria?')) {
      setCategorias((prev) => prev.filter((c) => c.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-500 text-slate-950 text-xs font-black px-2.5 py-0.5 rounded uppercase flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" /> CATEGORIAS UCI
            </span>
            <span className="text-slate-400 text-xs font-mono">Regulamento 2026</span>
          </div>
          <h2 className="text-2xl font-black text-white">
            Cadastro de Categorias por Idade e Tipo de Bike
          </h2>
          <p className="text-sm text-slate-300 mt-0.5">
            Validação automática da idade do atleta no momento da inscrição (Ano Vigente - Ano de Nascimento).
          </p>
        </div>

        <button
          onClick={() => setModalAberta(true)}
          className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-5 py-3 rounded-xl shadow-lg transition flex items-center gap-2 text-sm shrink-0"
        >
          <Plus className="w-5 h-5" />
          Nova Categoria
        </button>
      </div>

      {/* Grid of Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categorias.map((cat) => (
          <div
            key={cat.id}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="bg-slate-100 text-slate-800 font-bold text-xs px-2.5 py-0.5 rounded-md border border-slate-200">
                  {cat.tipoBike}
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  {cat.sexo}
                </span>
              </div>

              <h3 className="font-black text-slate-900 text-lg leading-tight">
                {cat.nome}
              </h3>

              <div className="text-xs text-slate-600 font-medium">
                Faixa Etária UCI:{' '}
                <strong className="text-slate-900">
                  {cat.idadeMin} a {cat.idadeMax} anos
                </strong>
              </div>

              {cat.descricao && (
                <p className="text-xs text-slate-500 italic">{cat.descricao}</p>
              )}
            </div>

            <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">
                ID: {cat.id}
              </span>
              <button
                onClick={() => handleExcluirCategoria(cat.id)}
                className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition"
                title="Excluir Categoria"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add Category */}
      {modalAberta && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-scale-up space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600" />
                Nova Categoria de BMX
              </h3>
              <button
                onClick={() => setModalAberta(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvarCategoria} className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-slate-700 mb-1">Nome da Categoria *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Boys 15-16 anos, Cruiser 40+"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">Tipo de Bike *</label>
                  <select
                    value={tipoBike}
                    onChange={(e) => setTipoBike(e.target.value as BikeType)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value='Aro 20"'>Aro 20" (Standard)</option>
                    <option value='Cruiser 24"'>Cruiser 24" (Grandes)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">Gênero / Sexo *</label>
                  <select
                    value={sexo}
                    onChange={(e) =>
                      setSexo(e.target.value as 'Masculino' | 'Feminino' | 'Misto')
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Misto">Misto</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">Idade Mínima *</label>
                  <input
                    type="number"
                    required
                    value={idadeMin}
                    onChange={(e) => setIdadeMin(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">Idade Máxima *</label>
                  <input
                    type="number"
                    required
                    value={idadeMax}
                    onChange={(e) => setIdadeMax(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalAberta(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-md"
                >
                  Salvar Categoria
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
