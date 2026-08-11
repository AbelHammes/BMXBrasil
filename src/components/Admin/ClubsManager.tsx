import React, { useState } from 'react';
import { ClubeEquipe } from '../../types/bmx';
import { Users, Plus, Building, MapPin, Trash2, Mail } from 'lucide-react';

interface ClubsManagerProps {
  clubes: ClubeEquipe[];
  setClubes: React.Dispatch<React.SetStateAction<ClubeEquipe[]>>;
}

export const ClubsManager: React.FC<ClubsManagerProps> = ({ clubes, setClubes }) => {
  const [modalAberta, setModalAberta] = useState(false);
  const [nomeEquipe, setNomeEquipe] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [endereco, setEndereco] = useState('');
  const [estado, setEstado] = useState('SP');
  const [pais, setPais] = useState('Brasil');
  const [federacao, setFederacao] = useState('');
  const [dirigenteNome, setDirigenteNome] = useState('');
  const [dirigenteEmail, setDirigenteEmail] = useState('');
  const [dirigenteCpf, setDirigenteCpf] = useState('');

  const handleSalvarClube = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeEquipe || !cnpj) return;

    const novoClube: ClubeEquipe = {
      id: `clube-${Date.now()}`,
      nomeEquipe,
      logoUrl:
        'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=150&q=80',
      cnpj,
      endereco: endereco || 'Sede do Clube',
      estado,
      pais,
      federacaoAfiliada: federacao || 'Federação Estadual',
      dirigenteNome: dirigenteNome || 'Dirigente Responsável',
      dirigenteEmail: dirigenteEmail || 'contato@clube.com.br',
      dirigenteCpf: dirigenteCpf || '000.000.000-00',
    };

    setClubes((prev) => [novoClube, ...prev]);
    setModalAberta(false);
    // Reset form
    setNomeEquipe('');
    setCnpj('');
  };

  const handleExcluirClube = (id: string) => {
    if (confirm('Deseja remover este clube da plataforma?')) {
      setClubes((prev) => prev.filter((c) => c.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-500 text-slate-950 text-xs font-black px-2.5 py-0.5 rounded uppercase flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> EQUIPES & CLUBES
            </span>
            <span className="text-slate-400 text-xs font-mono">
              Clubes Filiados CBC: {clubes.length}
            </span>
          </div>
          <h2 className="text-2xl font-black text-white">
            Cadastro Nacional de Clubes e Equipes de BMX
          </h2>
          <p className="text-sm text-slate-300 mt-0.5">
            Gerencie os dados institucionais das equipes, CNPJs, dirigenes e federações estaduais afiliadas.
          </p>
        </div>

        <button
          onClick={() => setModalAberta(true)}
          className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-5 py-3 rounded-xl shadow-lg transition flex items-center gap-2 text-sm shrink-0"
        >
          <Plus className="w-5 h-5" />
          Cadastrar Clube / Equipe
        </button>
      </div>

      {/* Grid of Clubs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clubes.map((clube) => (
          <div
            key={clube.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition p-5 space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <img
                  src={
                    clube.logoUrl ||
                    'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=150&q=80'
                  }
                  alt={clube.nomeEquipe}
                  className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shrink-0"
                />
                <div>
                  <h3 className="font-black text-slate-900 text-base leading-snug">
                    {clube.nomeEquipe}
                  </h3>
                  <span className="text-xs font-mono font-bold text-slate-500">
                    CNPJ: {clube.cnpj}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 border-t pt-3">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>
                    {clube.endereco} —{' '}
                    <strong className="text-slate-900">{clube.estado}, {clube.pais}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-semibold text-emerald-800">
                  <Building className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{clube.federacaoAfiliada}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    Dirigente: <strong>{clube.dirigenteNome}</strong> ({clube.dirigenteEmail})
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-mono text-slate-400 font-bold">ID: {clube.id}</span>
              <button
                onClick={() => handleExcluirClube(clube.id)}
                className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition"
                title="Excluir Clube"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal New Club */}
      {modalAberta && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-scale-up space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Building className="w-5 h-5 text-emerald-600" />
                Cadastrar Novo Clube / Equipe
              </h3>
              <button
                onClick={() => setModalAberta(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvarClube} className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-slate-700 mb-1">Nome da Equipe / Clube *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Paulínia Racing BMX"
                  value={nomeEquipe}
                  onChange={(e) => setNomeEquipe(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">CNPJ *</label>
                  <input
                    type="text"
                    required
                    placeholder="00.000.000/0001-00"
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">Federação Afiliada *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Federação Paulista de Ciclismo (FPC)"
                    value={federacao}
                    onChange={(e) => setFederacao(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Endereço da Sede *</label>
                <input
                  type="text"
                  required
                  placeholder="Rua, Número, Bairro - Cidade"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">Estado (UF) *</label>
                  <input
                    type="text"
                    required
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">País *</label>
                  <input
                    type="text"
                    required
                    value={pais}
                    onChange={(e) => setPais(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="border-t pt-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">Nome do Dirigente Responsável *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carlos Eduardo"
                    value={dirigenteNome}
                    onChange={(e) => setDirigenteNome(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">E-mail do Dirigente *</label>
                  <input
                    type="email"
                    required
                    placeholder="contato@equipe.com.br"
                    value={dirigenteEmail}
                    onChange={(e) => setDirigenteEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t">
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
                  Salvar Clube
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
