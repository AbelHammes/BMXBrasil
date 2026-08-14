import React, { useState } from 'react';
import { Atleta, Categoria, ClubeEquipe, Inscricao, ProvaEvento } from '../../types/bmx';
import {
  encontrarCategoriaCompavel,
  formatarCPF,
  validarCPF,
  validarInscricaoAtletaRegraAro,
} from '../../utils/uciBmEngine';
import {
  ShieldAlert,
  Users,
  Plus,
  Building,
  MapPin,
  FileText,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Bike,
  Zap,
} from 'lucide-react';

interface DirigentePortalProps {
  clubes: ClubeEquipe[];
  setClubes: React.Dispatch<React.SetStateAction<ClubeEquipe[]>>;
  atletas: Atleta[];
  setAtletas: React.Dispatch<React.SetStateAction<Atleta[]>>;
  provas: ProvaEvento[];
  categorias: Categoria[];
  inscricoes: Inscricao[];
  setInscricoes: React.Dispatch<React.SetStateAction<Inscricao[]>>;
}

export const DirigentePortal: React.FC<DirigentePortalProps> = ({
  clubes,
  setClubes,
  atletas,
  setAtletas,
  provas,
  categorias,
  inscricoes,
  setInscricoes,
}) => {
  // Default to first club (or allow switching)
  const [clubeAtivoId, setClubeAtivoId] = useState<string>(clubes[0]?.id || '');
  const [modalNovoAtleta, setModalNovoAtleta] = useState(false);
  const [modalInscricaoAtleta, setModalInscricaoAtleta] = useState<Atleta | null>(null);
  const [provaInscricaoId, setProvaInscricaoId] = useState<string>(provas[0]?.id || '');
  const [categoriaInscricaoId, setCategoriaInscricaoId] = useState<string>(categorias[0]?.id || '');
  const [numeroPlacaCustom, setNumeroPlacaCustom] = useState<string>('');
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erroInscricao, setErroInscricao] = useState<string | null>(null);

  // Form states for new athlete
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [dataNasc, setDataNasc] = useState('2003-05-10');
  const [filiacao, setFiliacao] = useState('');
  const [tipoSanguineo, setTipoSanguineo] = useState<'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'>('O+');
  const [alergias, setAlergias] = useState('Nenhuma');
  const [cbc, setCbc] = useState('');
  const [uci, setUci] = useState('');
  const [endereco, setEndereco] = useState('');
  const [estado, setEstado] = useState('SP');
  const [transponder, setTransponder] = useState('');

  const clubeAtivo = clubes.find((c) => c.id === clubeAtivoId) || clubes[0];

  // Athletes belonging to active club
  const atletasDoClube = atletas.filter((a) => a.clubeId === clubeAtivo?.id);

  // Handle saving new Athlete under Team
  const handleCadastrarAtletaEquipe = (e: React.FormEvent) => {
    e.preventDefault();

    const cpfFormatado = formatarCPF(cpf);
    if (!validarCPF(cpfFormatado)) {
      alert('CPF inválido!');
      return;
    }

    // Check unique CPF
    const jaExiste = atletas.some((a) => a.cpf === cpfFormatado);
    if (jaExiste) {
      alert('Já existe um atleta cadastrado com este CPF no sistema!');
      return;
    }

    // Auto-match category based on age
    const catComp = encontrarCategoriaCompavel(dataNasc, 'Masculino', 'Aro 20"', categorias);

    const novoAtleta: Atleta = {
      id: `atl-${Date.now()}`,
      nome,
      cpf: cpfFormatado,
      dataNascimento: dataNasc,
      filiacao: filiacao || 'Mãe/Pai',
      tipoSanguineo,
      alergias: alergias || 'Nenhuma',
      matriculaCBC: cbc || undefined,
      matriculaUCI: uci || undefined,
      clubeId: clubeAtivo.id,
      clubeNome: clubeAtivo.nomeEquipe,
      endereco: endereco || 'Brasil',
      estado: estado || 'SP',
      categoriaId: catComp?.id || categorias[0]?.id || '',
      categoriaNome: catComp?.nome || categorias[0]?.nome || 'Categoria',
      transponderId: transponder || `TX-${Math.floor(1000 + Math.random() * 9000)}`,
    };

    setAtletas((prev) => [novoAtleta, ...prev]);
    setModalNovoAtleta(false);
    setMensagem('✅ Atleta cadastrado na equipe com sucesso!');
    setTimeout(() => setMensagem(null), 3000);

    // Reset form
    setNome('');
    setCpf('');
  };

  // Open Inscription Modal for selected Athlete
  const handleAbrirModalInscricao = (atleta: Atleta) => {
    setModalInscricaoAtleta(atleta);
    setErroInscricao(null);
    setNumeroPlacaCustom(Math.floor(10 + Math.random() * 89).toString());

    // Check if athlete already has an inscription in this event
    const inscricoesAtleta = inscricoes.filter(
      (i) => i.provaId === provaInscricaoId && (i.atletaId === atleta.id || i.atletaCpf === atleta.cpf)
    );

    if (inscricoesAtleta.length > 0) {
      // Find category of opposite wheel type
      const primeiraInscricao = inscricoesAtleta[0];
      const primeiraCat = categorias.find((c) => c.id === primeiraInscricao.categoriaId);
      const isAro20 = primeiraCat?.tipoBike === 'Aro 20"' || (!primeiraCat?.tipoBike?.includes('24') && !primeiraCat?.nome?.toLowerCase().includes('cruiser'));
      const catOposta = categorias.find((c) => isAro20 ? (c.tipoBike?.includes('24') || c.nome.toLowerCase().includes('cruiser')) : (c.tipoBike === 'Aro 20"' || !c.nome.toLowerCase().includes('cruiser')));
      if (catOposta) {
        setCategoriaInscricaoId(catOposta.id);
        return;
      }
    }

    setCategoriaInscricaoId(atleta.categoriaId || categorias[0]?.id || '');
  };

  const handleConfirmarInscricaoAtleta = (e: React.FormEvent) => {
    e.preventDefault();
    setErroInscricao(null);

    if (!modalInscricaoAtleta) return;

    const catSelecionada = categorias.find((c) => c.id === categoriaInscricaoId);
    if (!catSelecionada) {
      setErroInscricao('Selecione uma categoria válida.');
      return;
    }

    // Validar regras de inscrição BMX (Aro 20 vs Cruiser 24 e duplicidade de categoria)
    const validacaoRegra = validarInscricaoAtletaRegraAro(
      modalInscricaoAtleta.id,
      modalInscricaoAtleta.cpf,
      provaInscricaoId,
      catSelecionada.id,
      categorias,
      inscricoes
    );

    if (!validacaoRegra.valido) {
      setErroInscricao(validacaoRegra.erro || 'Inscrição não permitida pelo regulamento de BMX.');
      return;
    }

    const novaInscricao: Inscricao = {
      id: `ins-${Date.now()}`,
      provaId: provaInscricaoId,
      atletaId: modalInscricaoAtleta.id,
      atletaNome: modalInscricaoAtleta.nome,
      atletaCpf: modalInscricaoAtleta.cpf,
      clubeNome: modalInscricaoAtleta.clubeNome,
      categoriaId: catSelecionada.id,
      categoriaNome: catSelecionada.nome,
      numeroPlaca: numeroPlacaCustom.trim() || `${Math.floor(10 + Math.random() * 89)}`,
      transponderId: modalInscricaoAtleta.transponderId,
      statusPagamento: 'Confirmada',
      validadoTransponder: false,
      chipDevolvido: false,
      dataInscricao: new Date().toISOString().split('T')[0],
    };

    setInscricoes((prev) => [novaInscricao, ...prev]);
    setMensagem(`✅ ${modalInscricaoAtleta.nome} inscrito na categoria ${catSelecionada.nome} com sucesso!`);
    setModalInscricaoAtleta(null);
    setTimeout(() => setMensagem(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 p-6 rounded-2xl border border-emerald-500/30 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-500 text-slate-950 text-xs font-black px-2.5 py-0.5 rounded uppercase flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" /> PAINEL DO DIRIGENTE
            </span>
            <span className="text-emerald-300 text-xs font-mono">
              Gestão de Equipe & Inscrições
            </span>
          </div>
          <h2 className="text-2xl font-black text-white">
            {clubeAtivo?.nomeEquipe || 'Gerenciamento de Equipe'}
          </h2>
          <p className="text-sm text-slate-300 mt-0.5">
            Cadastre os atletas do seu clube, valide dados e faça inscrições unificadas nas provas nacionais.
          </p>
        </div>

        {/* Club Switcher & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={clubeAtivoId}
            onChange={(e) => setClubeAtivoId(e.target.value)}
            className="bg-slate-800 text-amber-300 font-bold text-xs rounded-xl px-3 py-2.5 border border-slate-700 focus:outline-none focus:border-emerald-400"
          >
            {clubes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nomeEquipe} ({c.estado})
              </option>
            ))}
          </select>

          <button
            onClick={() => setModalNovoAtleta(true)}
            className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-3.5 py-2.5 rounded-xl shadow transition flex items-center gap-1.5 text-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Atleta</span>
          </button>
        </div>
      </div>

      {mensagem && (
        <div className="bg-emerald-900/40 border border-emerald-500 text-emerald-200 px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          {mensagem}
        </div>
      )}

      {/* Club Details Summary Card */}
      {clubeAtivo && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="flex items-center gap-3 border-r border-slate-100 pr-4">
            <img
              src={
                clubeAtivo.logoUrl ||
                'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=150&q=80'
              }
              alt="Logo"
              className="w-12 h-12 rounded-xl object-cover border border-slate-200"
            />
            <div>
              <div className="font-extrabold text-slate-900 text-sm">
                {clubeAtivo.nomeEquipe}
              </div>
              <div className="text-slate-500 font-mono">{clubeAtivo.cnpj}</div>
            </div>
          </div>

          <div>
            <div className="text-slate-400 font-bold uppercase">Federação Afiliada</div>
            <div className="font-bold text-slate-800 mt-0.5">
              {clubeAtivo.federacaoAfiliada}
            </div>
          </div>

          <div>
            <div className="text-slate-400 font-bold uppercase">Dirigente Responsável</div>
            <div className="font-bold text-slate-800 mt-0.5">
              {clubeAtivo.dirigenteNome}
            </div>
            <div className="text-slate-500">{clubeAtivo.dirigenteEmail}</div>
          </div>

          <div className="text-right">
            <div className="text-slate-400 font-bold uppercase">Atletas Cadastrados</div>
            <div className="text-2xl font-black text-emerald-600">
              {atletasDoClube.length}
            </div>
          </div>
        </div>
      )}

      {/* Team Athletes Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            Atletas Filiados ao Clube
          </h3>
          <span className="text-xs bg-slate-100 text-slate-700 font-bold px-2.5 py-1 rounded-full">
            Total: {atletasDoClube.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                <th className="py-2.5 px-3">ATLETA</th>
                <th className="py-2.5 px-3">CPF / NASCIMENTO</th>
                <th className="py-2.5 px-3">CATEGORIA</th>
                <th className="py-2.5 px-3">TRANSPONDER</th>
                <th className="py-2.5 px-3">FILIAÇÕES (CBC/UCI)</th>
                <th className="py-2.5 px-3 text-center">INSCREVER EM PROVA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {atletasDoClube.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-3 font-bold text-slate-900">
                    {a.nome}
                    <div className="text-[10px] text-slate-400 font-normal">
                      Mãe/Pai: {a.filiacao} | Sangue: {a.tipoSanguineo}
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono">
                    <div className="font-bold text-slate-800">{a.cpf}</div>
                    <div className="text-[10px] text-slate-400">
                      Nasc: {new Date(a.dataNascimento).toLocaleDateString('pt-BR')}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200">
                      {a.categoriaNome}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-amber-600">
                    {a.transponderId}
                  </td>
                  <td className="py-3 px-3 text-[11px]">
                    <div>CBC: {a.matriculaCBC || 'Não informado'}</div>
                    <div className="text-slate-400">UCI: {a.matriculaUCI || 'Não informado'}</div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => handleAbrirModalInscricao(a)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-3 py-1.5 rounded-lg text-xs transition shadow flex items-center gap-1 mx-auto"
                    >
                      <Plus className="w-3.5 h-3.5" /> Inscrever na Prova
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Inscrever Atleta na Prova */}
      {modalInscricaoAtleta && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-scale-up space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-[10px] font-mono text-emerald-600 uppercase font-black tracking-wider block">
                  INSCRIÇÃO OFICIAL BMX
                </span>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-emerald-600" />
                  {modalInscricaoAtleta.nome}
                </h3>
              </div>
              <button
                onClick={() => setModalInscricaoAtleta(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg p-1"
              >
                ✕
              </button>
            </div>

            {/* Inscrições ativas do atleta nesta prova */}
            {(() => {
              const inscricoesAtuais = inscricoes.filter(
                (i) => i.provaId === provaInscricaoId && (i.atletaId === modalInscricaoAtleta.id || i.atletaCpf === modalInscricaoAtleta.cpf)
              );
              if (inscricoesAtuais.length === 1) {
                return (
                  <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-xl text-xs space-y-1">
                    <div className="font-bold flex items-center gap-1 text-blue-900">
                      <Bike className="w-4 h-4 text-blue-600" /> 1ª Inscrição Ativa: {inscricoesAtuais[0].categoriaNome}
                    </div>
                    <p className="text-[11px] text-blue-700">
                      Regra Oficial BMX: Uma 2ª inscrição é permitida se for em modalidade de aro oposto (Aro 20" ⇄ Cruiser 24").
                    </p>
                  </div>
                );
              }
              if (inscricoesAtuais.length >= 2) {
                return (
                  <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>Este atleta já possui o limite máximo de 2 inscrições nesta mesma prova.</span>
                  </div>
                );
              }
              return null;
            })()}

            <form onSubmit={handleConfirmarInscricaoAtleta} className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-slate-700 mb-1">Selecione a Prova / Etapa *</label>
                <select
                  value={provaInscricaoId}
                  onChange={(e) => {
                    setProvaInscricaoId(e.target.value);
                    setErroInscricao(null);
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 text-xs font-bold focus:outline-none focus:border-emerald-500"
                >
                  {provas.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome} ({p.cidadeEstado})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 flex items-center justify-between">
                  <span>Categoria de Competição *</span>
                  <span className="text-[10px] text-slate-400 font-normal">Aro 20" ou Cruiser 24"</span>
                </label>
                <select
                  value={categoriaInscricaoId}
                  onChange={(e) => {
                    setCategoriaInscricaoId(e.target.value);
                    setErroInscricao(null);
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-emerald-800 text-xs font-bold focus:outline-none focus:border-emerald-500"
                >
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} ({c.tipoBike})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">Número da Placa *</label>
                  <input
                    type="text"
                    required
                    value={numeroPlacaCustom}
                    onChange={(e) => setNumeroPlacaCustom(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">Transponder ID</label>
                  <input
                    type="text"
                    disabled
                    value={modalInscricaoAtleta.transponderId}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-500 font-mono text-xs cursor-not-allowed"
                  />
                </div>
              </div>

              {erroInscricao && (
                <div className="bg-red-50 border border-red-300 text-red-700 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  {erroInscricao}
                </div>
              )}

              <div className="pt-3 flex justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setModalInscricaoAtleta(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-md flex items-center gap-1.5"
                >
                  <UserCheck className="w-4 h-4" /> Confirmar Inscrição
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Athlete */}
      {modalNovoAtleta && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-scale-up space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                Cadastrar Atleta no Clube
              </h3>
              <button
                onClick={() => setModalNovoAtleta(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCadastrarAtletaEquipe} className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-slate-700 mb-1">Nome Completo do Atleta *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Matheus Gabriel Silva"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">CPF (Único por Atleta) *</label>
                  <input
                    type="text"
                    required
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono text-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">Data de Nascimento *</label>
                  <input
                    type="date"
                    required
                    value={dataNasc}
                    onChange={(e) => setDataNasc(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">Tipo Sanguíneo *</label>
                  <select
                    value={tipoSanguineo}
                    onChange={(e) => setTipoSanguineo(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">Código Transponder Mylaps</label>
                  <input
                    type="text"
                    placeholder="Ex: TX-9025"
                    value={transponder}
                    onChange={(e) => setTransponder(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono text-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">Matrícula CBC</label>
                  <input
                    type="text"
                    placeholder="CBC-2026-XXXX"
                    value={cbc}
                    onChange={(e) => setCbc(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">Matrícula UCI</label>
                  <input
                    type="text"
                    placeholder="100 XXX XXX XX"
                    value={uci}
                    onChange={(e) => setUci(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setModalNovoAtleta(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-md"
                >
                  Confirmar Cadastro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
