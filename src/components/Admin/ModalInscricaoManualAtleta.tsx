import React, { useState } from 'react';
import { Atleta, Categoria, ClubeEquipe, Inscricao, ProvaEvento, StatusPagamento } from '../../types/bmx';
import { validarInscricaoAtletaRegraAro } from '../../utils/uciBmEngine';
import {
  UserPlus,
  UserCheck,
  X,
  Search,
  CheckCircle,
  AlertCircle,
  Zap,
  Calendar,
  Shield,
  CreditCard,
  Radio,
  Hash,
  Lock,
} from 'lucide-react';

interface ModalInscricaoManualAtletaProps {
  isOpen: boolean;
  onClose: () => void;
  provas: ProvaEvento[];
  categorias: Categoria[];
  atletas: Atleta[];
  setAtletas: React.Dispatch<React.SetStateAction<Atleta[]>>;
  clubes: ClubeEquipe[];
  inscricoes: Inscricao[];
  setInscricoes: React.Dispatch<React.SetStateAction<Inscricao[]>>;
  initialProvaId?: string;
}

export const ModalInscricaoManualAtleta: React.FC<ModalInscricaoManualAtletaProps> = ({
  isOpen,
  onClose,
  provas,
  categorias,
  atletas,
  setAtletas,
  clubes,
  inscricoes,
  setInscricoes,
  initialProvaId,
}) => {
  const [modo, setModo] = useState<'EXISTENTE' | 'NOVO'>('EXISTENTE');
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);

  // FORM 1: Atleta Existente
  const [selectedAtletaId, setSelectedAtletaId] = useState<string>(atletas[0]?.id || '');
  const [buscaAtleta, setBuscaAtleta] = useState<string>('');
  const [selectedProvaId, setSelectedProvaId] = useState<string>(
    initialProvaId || provas[0]?.id || ''
  );
  const [selectedCategoriaId, setSelectedCategoriaId] = useState<string>(
    atletas[0]?.categoriaId || categorias[0]?.id || ''
  );
  const [numeroPlaca, setNumeroPlaca] = useState<string>(
    Math.floor(100 + Math.random() * 899).toString()
  );
  const [transponderId, setTransponderId] = useState<string>(
    atletas[0]?.transponderId || `TX-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [statusPagamento, setStatusPagamento] = useState<StatusPagamento>('Confirmada');

  // FORM 2: Atleta Novo do Zero
  const [novoNome, setNovoNome] = useState('');
  const [novoCpf, setNovoCpf] = useState('');
  const [novaDataNasc, setNovaDataNasc] = useState('2005-01-01');
  const [novoSexo, setNovoSexo] = useState<'Masculino' | 'Feminino'>('Masculino');
  const [novoTipoSanguineo, setNovoTipoSanguineo] = useState<Atleta['tipoSanguineo']>('O+');
  const [novasAlergias, setNovasAlergias] = useState('Nenhuma');
  const [novaFiliacao, setNovaFiliacao] = useState('');
  const [novoClubeId, setNovoClubeId] = useState(clubes[0]?.id || '');
  const [novoClubeNomePersonalizado, setNovoClubeNomePersonalizado] = useState('');
  const [novaMatriculaCBC, setNovaMatriculaCBC] = useState('');
  const [novaMatriculaUCI, setNovaMatriculaUCI] = useState('');
  const [novoEndereco, setNovoEndereco] = useState('');
  const [novoEstado, setNovoEstado] = useState('SP');
  const [novaFotoUrl, setNovaFotoUrl] = useState('');
  const [novaSenha, setNovaSenha] = useState('1234');
  const [novaPlaca, setNovaPlaca] = useState(Math.floor(100 + Math.random() * 899).toString());
  const [novoTransponder, setNovoTransponder] = useState(
    `TX-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [novoStatusPagamento, setNovoStatusPagamento] = useState<StatusPagamento>('Confirmada');

  if (!isOpen) return null;

  // Sync selected athlete info in Existing Form
  const atletaSelecionado = atletas.find((a) => a.id === selectedAtletaId);

  const handleSelectAtleta = (id: string) => {
    setSelectedAtletaId(id);
    const atl = atletas.find((a) => a.id === id);
    if (atl) {
      setSelectedCategoriaId(atl.categoriaId);
      if (atl.transponderId) setTransponderId(atl.transponderId);
    }
  };

  // Filter athletes in picker
  const atletasFiltrados = atletas.filter(
    (a) =>
      a.nome.toLowerCase().includes(buscaAtleta.toLowerCase()) ||
      a.cpf.includes(buscaAtleta) ||
      a.clubeNome.toLowerCase().includes(buscaAtleta.toLowerCase())
  );

  // Submit Existing Athlete Enrollment
  const handleInscreverAtletaExistente = (e: React.FormEvent) => {
    e.preventDefault();
    setMensagemErro(null);

    if (!selectedAtletaId || !selectedProvaId || !selectedCategoriaId) {
      setMensagemErro('Por favor, selecione o atleta, a prova e a categoria de competição.');
      return;
    }

    const atleta = atletas.find((a) => a.id === selectedAtletaId);
    const prova = provas.find((p) => p.id === selectedProvaId);
    const categoria = categorias.find((c) => c.id === selectedCategoriaId);

    if (!atleta || !prova || !categoria) {
      setMensagemErro('Dados do atleta, prova ou categoria inválidos.');
      return;
    }

    // Validar regras oficiais de inscrição BMX (Aro 20 vs Cruiser 24 e duplicidade de categoria)
    const validacaoRegra = validarInscricaoAtletaRegraAro(
      atleta.id,
      atleta.cpf,
      selectedProvaId,
      categoria.id,
      categorias,
      inscricoes
    );

    if (!validacaoRegra.valido) {
      setMensagemErro(validacaoRegra.erro || 'Inscrição bloqueada pelas regras oficiais de BMX.');
      return;
    }

    const novaInscricao: Inscricao = {
      id: `ins-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      provaId: selectedProvaId,
      atletaId: atleta.id,
      atletaNome: atleta.nome,
      atletaCpf: atleta.cpf,
      clubeNome: atleta.clubeNome,
      categoriaId: categoria.id,
      categoriaNome: categoria.nome,
      categoriaOriginalId: atleta.categoriaId,
      categoriaOriginalNome: atleta.categoriaNome,
      numeroPlaca: numeroPlaca || Math.floor(100 + Math.random() * 899).toString(),
      transponderId: transponderId || atleta.transponderId || `TX-${Math.floor(1000 + Math.random() * 9000)}`,
      statusPagamento: statusPagamento,
      validadoTransponder: true,
      chipDevolvido: false,
      dataInscricao: new Date().toISOString().split('T')[0],
    };

    setInscricoes((prev) => [novaInscricao, ...prev]);
    setMensagemSucesso(`Inscrição de ${atleta.nome} na categoria ${categoria.nome} realizada com sucesso!`);

    setTimeout(() => {
      setMensagemSucesso(null);
      onClose();
    }, 1500);
  };

  // Submit Brand New Athlete Creation + Enrollment
  const handleCadastrarNovoAtleta = (e: React.FormEvent) => {
    e.preventDefault();
    setMensagemErro(null);

    if (!novoNome.trim()) {
      setMensagemErro('Informe o nome completo do atleta.');
      return;
    }
    if (!novoCpf.trim()) {
      setMensagemErro('Informe o CPF do atleta.');
      return;
    }

    const prova = provas.find((p) => p.id === selectedProvaId);
    const categoria = categorias.find((c) => c.id === selectedCategoriaId);
    const clubeObj = clubes.find((cl) => cl.id === novoClubeId);
    const clubeNomeFinal = novoClubeNomePersonalizado.trim() || clubeObj?.nomeEquipe || 'Atleta Avulso';

    if (!categoria) {
      setMensagemErro('Selecione a categoria de competição.');
      return;
    }

    // Validar regras de inscrição BMX
    const validacaoRegra = validarInscricaoAtletaRegraAro(
      '',
      novoCpf.trim(),
      selectedProvaId,
      categoria.id,
      categorias,
      inscricoes
    );

    if (!validacaoRegra.valido) {
      setMensagemErro(validacaoRegra.erro || 'Inscrição bloqueada pelas regras oficiais de BMX.');
      return;
    }

    const novoId = `atl-manual-${Date.now()}`;
    const novoAtleta: Atleta = {
      id: novoId,
      nome: novoNome.trim(),
      cpf: novoCpf.trim(),
      dataNascimento: novaDataNasc,
      filiacao: novaFiliacao.trim() || 'Não informada',
      tipoSanguineo: novoTipoSanguineo,
      alergias: novasAlergias.trim() || 'Nenhuma',
      matriculaCBC: novaMatriculaCBC.trim() || undefined,
      matriculaUCI: novaMatriculaUCI.trim() || undefined,
      clubeId: novoClubeId || 'clube-avulso',
      clubeNome: clubeNomeFinal,
      endereco: novoEndereco.trim() || 'Não informado',
      estado: novoEstado,
      categoriaId: categoria.id,
      categoriaNome: categoria.nome,
      transponderId: novoTransponder || `TX-${Math.floor(1000 + Math.random() * 9000)}`,
      fotoUrl:
        novaFotoUrl.trim() ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      senha: novaSenha || '1234',
    };

    // Add to athletes list
    setAtletas((prev) => [novoAtleta, ...prev]);

    // Create Inscription
    const novaInscricao: Inscricao = {
      id: `ins-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      provaId: selectedProvaId,
      atletaId: novoId,
      atletaNome: novoAtleta.nome,
      atletaCpf: novoAtleta.cpf,
      clubeNome: novoAtleta.clubeNome,
      categoriaId: categoria.id,
      categoriaNome: categoria.nome,
      categoriaOriginalId: categoria.id,
      categoriaOriginalNome: categoria.nome,
      numeroPlaca: novaPlaca || Math.floor(100 + Math.random() * 899).toString(),
      transponderId: novoAtleta.transponderId,
      statusPagamento: novoStatusPagamento,
      validadoTransponder: true,
      chipDevolvido: false,
      dataInscricao: new Date().toISOString().split('T')[0],
    };

    setInscricoes((prev) => [novaInscricao, ...prev]);
    setMensagemSucesso(`Atleta ${novoAtleta.nome} cadastrado na base e inscrito na categoria ${categoria.nome}!`);

    setTimeout(() => {
      setMensagemSucesso(null);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl relative text-white overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-amber-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">Inscrição Manual de Atleta</h3>
              <p className="text-xs text-slate-400">
                Adicione atletas cadastrados ou registre um competidor novo do zero
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950 p-2 gap-2">
          <button
            type="button"
            onClick={() => { setModo('EXISTENTE'); setMensagemErro(null); }}
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition ${
              modo === 'EXISTENTE'
                ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            1. Atleta da Base de Dados
          </button>

          <button
            type="button"
            onClick={() => { setModo('NOVO'); setMensagemErro(null); }}
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition ${
              modo === 'NOVO'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            2. Cadastrar Atleta do Zero
          </button>
        </div>

        {/* Modal Body with Scroll */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {mensagemSucesso && (
            <div className="bg-emerald-500/20 border border-emerald-500 text-emerald-300 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold animate-fadeIn">
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{mensagemSucesso}</span>
            </div>
          )}

          {mensagemErro && (
            <div className="bg-red-500/20 border border-red-500 text-red-300 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold animate-fadeIn">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <span>{mensagemErro}</span>
            </div>
          )}

          {/* MODE 1: ATLETA JÁ CADASTRADO */}
          {modo === 'EXISTENTE' && (
            <form onSubmit={handleInscreverAtletaExistente} className="space-y-4">
              {/* Event / Prova */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" /> Selecione o Evento / Prova
                </label>
                <select
                  value={selectedProvaId}
                  onChange={(e) => setSelectedProvaId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-bold text-sm focus:outline-none focus:border-amber-400"
                >
                  {provas.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome} ({p.local} - {p.data})
                    </option>
                  ))}
                </select>
              </div>

              {/* Athlete Search & Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1 flex items-center gap-1">
                  <Search className="w-3.5 h-3.5 text-amber-400" /> Selecionar Atleta da Base de Dados
                </label>
                <div className="relative mb-2">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Filtrar por nome, CPF ou clube..."
                    value={buscaAtleta}
                    onChange={(e) => setBuscaAtleta(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <select
                  value={selectedAtletaId}
                  onChange={(e) => handleSelectAtleta(e.target.value)}
                  size={Math.min(5, Math.max(3, atletasFiltrados.length))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium text-xs focus:outline-none focus:border-amber-400 scrollbar-thin"
                >
                  {atletasFiltrados.map((a) => (
                    <option key={a.id} value={a.id} className="p-1.5 hover:bg-slate-800 rounded">
                      {a.nome} | Cat. Base: {a.categoriaNome} | {a.clubeNome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Athlete Badge */}
              {atletaSelecionado && (
                <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="font-bold text-amber-400 block">{atletaSelecionado.nome}</span>
                    <span className="text-slate-400 text-[11px] block">
                      CPF: {atletaSelecionado.cpf} | Clube: {atletaSelecionado.clubeNome}
                    </span>
                  </div>
                  <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-1 rounded text-[10px] font-mono">
                    Base: {atletaSelecionado.categoriaNome}
                  </span>
                </div>
              )}

              {/* Competition Category for this race */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> Categoria de Competição nesta Prova
                </label>
                <select
                  value={selectedCategoriaId}
                  onChange={(e) => setSelectedCategoriaId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-emerald-400 font-bold text-sm focus:outline-none focus:border-emerald-400"
                >
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} ({c.tipoBike} - {c.sexo})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  O admin pode inscrever o atleta na sua categoria padrão ou em uma categoria superior/unificada.
                </p>
              </div>

              {/* Plate, Transponder & Payment Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1 flex items-center gap-1">
                    <Hash className="w-3 h-3 text-amber-400" /> Placa Numérica
                  </label>
                  <input
                    type="text"
                    value={numeroPlaca}
                    onChange={(e) => setNumeroPlaca(e.target.value)}
                    placeholder="Ex: 88"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-amber-300 font-mono font-black text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1 flex items-center gap-1">
                    <Radio className="w-3 h-3 text-blue-400" /> Transponder ID
                  </label>
                  <input
                    type="text"
                    value={transponderId}
                    onChange={(e) => setTransponderId(e.target.value)}
                    placeholder="Ex: TX-9021"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-blue-300 font-mono font-bold text-sm focus:outline-none focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1 flex items-center gap-1">
                    <CreditCard className="w-3 h-3 text-emerald-400" /> Pagamento
                  </label>
                  <select
                    value={statusPagamento}
                    onChange={(e) => setStatusPagamento(e.target.value as StatusPagamento)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-emerald-300 font-bold text-xs focus:outline-none focus:border-emerald-400"
                  >
                    <option value="Confirmada">Confirmada (Pago)</option>
                    <option value="Pendente">Pendente</option>
                    <option value="Isento">Isento</option>
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm py-3 px-6 rounded-xl transition shadow-lg flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Efetivar Inscrição do Atleta
                </button>
              </div>
            </form>
          )}

          {/* MODE 2: CADASTRAR ATLETA NOVO DO ZERO */}
          {modo === 'NOVO' && (
            <form onSubmit={handleCadastrarNovoAtleta} className="space-y-4">
              <div className="bg-emerald-950/40 p-3 rounded-2xl border border-emerald-500/30 text-xs text-emerald-200">
                Preencha os dados do competidor. Ele será salvo na base de dados permanente e inscrito na prova selecionada.
              </div>

              {/* Section 1: Dados Pessoais */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Nome Completo do Atleta *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: João Victor Silva"
                    value={novoNome}
                    onChange={(e) => setNovoNome(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-400 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    CPF *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="000.000.000-00"
                    value={novoCpf}
                    onChange={(e) => setNovoCpf(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Data de Nascimento
                  </label>
                  <input
                    type="date"
                    value={novaDataNasc}
                    onChange={(e) => setNovaDataNasc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Sexo
                  </label>
                  <select
                    value={novoSexo}
                    onChange={(e) => setNovoSexo(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-400"
                  >
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Tipo Sanguíneo
                  </label>
                  <select
                    value={novoTipoSanguineo}
                    onChange={(e) => setNovoTipoSanguineo(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-red-300 font-bold text-xs focus:outline-none focus:border-emerald-400"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              {/* Club & State */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Equipe / Clube
                  </label>
                  <select
                    value={novoClubeId}
                    onChange={(e) => setNovoClubeId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-400 mb-1"
                  >
                    {clubes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nomeEquipe} ({c.estado})
                      </option>
                    ))}
                    <option value="outro">Outro / Digitar Equipe</option>
                  </select>
                  {novoClubeId === 'outro' && (
                    <input
                      type="text"
                      placeholder="Nome da Equipe Personalizada"
                      value={novoClubeNomePersonalizado}
                      onChange={(e) => setNovoClubeNomePersonalizado(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Filiação (Pais / Responsáveis)
                  </label>
                  <input
                    type="text"
                    placeholder="Nome dos Pais"
                    value={novaFiliacao}
                    onChange={(e) => setNovaFiliacao(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              {/* Event & Category for Enrollment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <label className="block text-xs font-bold text-amber-400 uppercase mb-1">
                    Evento / Prova a Inscrever
                  </label>
                  <select
                    value={selectedProvaId}
                    onChange={(e) => setSelectedProvaId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-xs focus:outline-none focus:border-amber-400"
                  >
                    {provas.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-400 uppercase mb-1">
                    Categoria de Competição
                  </label>
                  <select
                    value={selectedCategoriaId}
                    onChange={(e) => setSelectedCategoriaId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-emerald-300 font-bold text-xs focus:outline-none focus:border-emerald-400"
                  >
                    {categorias.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome} ({c.tipoBike})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Hardware & Access */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Placa Bike
                  </label>
                  <input
                    type="text"
                    value={novaPlaca}
                    onChange={(e) => setNovaPlaca(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-amber-300 font-mono font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Transponder ID
                  </label>
                  <input
                    type="text"
                    value={novoTransponder}
                    onChange={(e) => setNovoTransponder(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-blue-300 font-mono font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Pagamento
                  </label>
                  <select
                    value={novoStatusPagamento}
                    onChange={(e) => setNovoStatusPagamento(e.target.value as StatusPagamento)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-emerald-300 font-bold text-xs"
                  >
                    <option value="Confirmada">Confirmada</option>
                    <option value="Pendente">Pendente</option>
                    <option value="Isento">Isento</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-400" /> Senha Painel
                  </label>
                  <input
                    type="text"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    placeholder="Padrão: 1234"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs"
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm py-3 px-6 rounded-xl transition shadow-lg flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Salvar Cadastro e Efetivar Inscrição
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
