import React, { useState, useEffect } from 'react';
import { Atleta, Categoria, Inscricao, ProvaEvento, StatusPagamento } from '../../types/bmx';
import { calcularIdadeUCI, encontrarCategoriaCompavel, validarInscricaoAtletaRegraAro } from '../../utils/uciBmEngine';
import {
  Flag,
  Calendar,
  MapPin,
  Trophy,
  CheckCircle2,
  AlertCircle,
  X,
  CreditCard,
  QrCode,
  Copy,
  Check,
  ShieldCheck,
  Zap,
  Radio,
  Hash,
  Bike,
} from 'lucide-react';

interface ModalInscreverProvaAtletaProps {
  isOpen: boolean;
  onClose: () => void;
  atleta: Atleta;
  provas: ProvaEvento[];
  selectedProvaId?: string;
  categorias: Categoria[];
  inscricoes: Inscricao[];
  setInscricoes: React.Dispatch<React.SetStateAction<Inscricao[]>>;
  setProvas?: React.Dispatch<React.SetStateAction<ProvaEvento[]>>;
}

export const ModalInscreverProvaAtleta: React.FC<ModalInscreverProvaAtletaProps> = ({
  isOpen,
  onClose,
  atleta,
  provas,
  selectedProvaId,
  categorias,
  inscricoes,
  setInscricoes,
  setProvas,
}) => {
  const [provaId, setProvaId] = useState<string>(selectedProvaId || provas[0]?.id || '');
  const [tipoBike, setTipoBike] = useState<'Aro 20"' | 'Cruiser 24"'>('Aro 20"');
  const [categoriaId, setCategoriaId] = useState<string>('');
  const [numeroPlaca, setNumeroPlaca] = useState<string>('');
  const [transponderId, setTransponderId] = useState<string>('');
  const [metodoPagamento, setMetodoPagamento] = useState<'PIX' | 'CARTAO' | 'ISENTO'>('PIX');
  const [sucesso, setSucesso] = useState<boolean>(false);
  const [copiadoPix, setCopiadoPix] = useState<boolean>(false);
  const [erro, setErro] = useState<string | null>(null);

  const provaSelecionada = provas.find((p) => p.id === provaId) || provas[0];

  const idadeUCI = atleta ? calcularIdadeUCI(atleta.dataNascimento) : 18;

  // Auto-resolve category when bike or race changes
  useEffect(() => {
    if (!atleta || !isOpen) return;

    // Set initial plate and transponder
    if (!numeroPlaca) {
      setNumeroPlaca(Math.floor(10 + Math.random() * 980).toString());
    }
    if (!transponderId) {
      setTransponderId(atleta.transponderId || `TX-${Math.floor(1000 + Math.random() * 9000)}`);
    }

    // Determine compatible category
    const autoCat = encontrarCategoriaCompavel(
      atleta.dataNascimento,
      atleta.categoriaNome.toLowerCase().includes('girl') ||
      atleta.categoriaNome.toLowerCase().includes('women') ||
      atleta.categoriaNome.toLowerCase().includes('fem')
        ? 'Feminino'
        : 'Masculino',
      tipoBike,
      categorias
    );

    if (autoCat) {
      setCategoriaId(autoCat.id);
    } else if (atleta.categoriaId) {
      setCategoriaId(atleta.categoriaId);
    } else {
      setCategoriaId(categorias[0]?.id || '');
    }
  }, [atleta, tipoBike, isOpen, categorias]);

  // Update selected race if passed via prop
  useEffect(() => {
    if (selectedProvaId) {
      setProvaId(selectedProvaId);
    }
  }, [selectedProvaId]);

  if (!isOpen || !atleta) return null;

  // Check all inscriptions of this athlete in this specific race
  const inscricoesAtletaNestaProva = inscricoes.filter(
    (i) => i.provaId === provaId && (i.atletaId === atleta.id || (atleta.cpf && i.atletaCpf === atleta.cpf))
  );

  const jaPossuiDuasInscricoes = inscricoesAtletaNestaProva.length >= 2;
  const inscricaoExistenteUnica = inscricoesAtletaNestaProva.length === 1 ? inscricoesAtletaNestaProva[0] : null;

  const categoriaObj = categorias.find((c) => c.id === categoriaId) || categorias[0];

  const handleCopyPix = () => {
    const pixCode = `00020126580014br.gov.bcb.pix0136pix-bmx-${provaSelecionada?.id || '2026'}520400005303986540${(
      provaSelecionada?.valorInscricao || 120
    ).toFixed(2)}5802BR5920BMX BRASIL OFICIAL6009SAO PAULO62070503***6304`;
    navigator.clipboard.writeText(pixCode);
    setCopiadoPix(true);
    setTimeout(() => setCopiadoPix(false), 3000);
  };

  const handleConfirmarInscricao = (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!provaSelecionada) {
      setErro('Por favor, selecione uma prova válida.');
      return;
    }

    // Validar regras oficiais de inscrição BMX (Aro 20 vs Cruiser 24 e duplicidade na mesma categoria)
    const validacaoRegra = validarInscricaoAtletaRegraAro(
      atleta.id,
      atleta.cpf,
      provaSelecionada.id,
      categoriaObj.id,
      categorias,
      inscricoes
    );

    if (!validacaoRegra.valido) {
      setErro(validacaoRegra.erro || 'Inscrição não permitida pelo regulamento oficial de BMX.');
      return;
    }

    if (!numeroPlaca.trim()) {
      setErro('Informe o número da placa para a corrida.');
      return;
    }

    const statusPagamento: StatusPagamento =
      metodoPagamento === 'ISENTO' ? 'Isento' : 'Confirmada';

    const novaInscricao: Inscricao = {
      id: `ins-atl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      provaId: provaSelecionada.id,
      atletaId: atleta.id,
      atletaNome: atleta.nome,
      atletaCpf: atleta.cpf,
      clubeNome: atleta.clubeNome,
      categoriaId: categoriaObj?.id || atleta.categoriaId,
      categoriaNome: categoriaObj?.nome || atleta.categoriaNome,
      categoriaOriginalId: categoriaObj?.id || atleta.categoriaId,
      categoriaOriginalNome: categoriaObj?.nome || atleta.categoriaNome,
      numeroPlaca: numeroPlaca.trim(),
      transponderId: transponderId.trim() || `TX-${Math.floor(1000 + Math.random() * 9000)}`,
      statusPagamento,
      validadoTransponder: false,
      chipDevolvido: false,
      dataInscricao: new Date().toISOString().split('T')[0],
    };

    // Insert into inscricoes
    setInscricoes((prev) => [novaInscricao, ...prev]);

    // Increment count in prova
    if (setProvas) {
      setProvas((prev) =>
        prev.map((p) =>
          p.id === provaSelecionada.id
            ? { ...p, inscritosCount: (p.inscritosCount || 0) + 1 }
            : p
        )
      );
    }

    setSucesso(true);
  };

  const handleFecharModal = () => {
    setSucesso(false);
    setErro(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl text-white my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center shrink-0 shadow-lg">
              <Flag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-blue-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                  AUTO-INSCRIÇÃO DO ATLETA
                </span>
                <span className="text-slate-400 text-xs font-mono">
                  Temporada 2026
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Inscrever-se em Nova Prova
              </h2>
            </div>
          </div>

          <button
            onClick={handleFecharModal}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition text-lg font-bold"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto space-y-5 py-4 pr-1 flex-1">
          {sucesso ? (
            <div className="bg-emerald-950/80 border-2 border-emerald-500 text-emerald-200 p-6 rounded-2xl text-center space-y-4 animate-fade-in">
              <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto animate-bounce" />
              <div>
                <h3 className="text-2xl font-black text-white">Inscrição Confirmada!</h3>
                <p className="text-sm text-emerald-300 mt-1">
                  Parabéns, <strong>{atleta.nome}</strong>! Você está oficialmente inscrito na etapa:
                </p>
                <div className="bg-slate-900/90 border border-emerald-500/40 p-4 rounded-xl mt-3 text-left space-y-2 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Prova / Etapa:</span>
                    <span className="font-bold text-white">{provaSelecionada?.nome}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Categoria Oficial:</span>
                    <span className="font-bold text-emerald-300">{categoriaObj?.nome}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Número da Placa:</span>
                    <span className="font-bold text-amber-400">#{numeroPlaca}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Transponder ID:</span>
                    <span className="font-bold text-blue-400">{transponderId}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-800 pt-2">
                    <span className="text-slate-400">Status do Pagamento:</span>
                    <span className="font-bold text-emerald-400">Confirmado</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleFecharModal}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm px-6 py-3 rounded-xl transition shadow-lg w-full sm:w-auto"
                >
                  Fechar e Ver no Meu Painel
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleConfirmarInscricao} className="space-y-4">
              {/* Athlete Identity Recap Banner */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-300 flex items-center justify-center font-black text-sm shrink-0">
                    {atleta.nome.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-black text-white text-sm">{atleta.nome}</h4>
                    <p className="text-[11px] text-slate-400 font-mono">
                      CPF: {atleta.cpf} | Clube: {atleta.clubeNome}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-bold px-2 py-0.5 rounded font-mono">
                    Idade UCI: {idadeUCI} anos
                  </span>
                </div>
              </div>

              {/* Race Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  Selecione a Prova / Etapa *
                </label>
                <select
                  value={provaId}
                  onChange={(e) => {
                    setProvaId(e.target.value);
                    setErro(null);
                  }}
                  className="w-full bg-slate-950 text-amber-300 font-bold text-xs sm:text-sm px-3.5 py-3 rounded-xl border border-slate-700 focus:outline-none focus:border-blue-400"
                >
                  {provas.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome} — {new Date(p.data).toLocaleDateString('pt-BR')} ({p.cidadeEstado})
                    </option>
                  ))}
                </select>
              </div>

              {/* Race Details Card */}
              {provaSelecionada && (
                <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" />
                      {provaSelecionada.local} ({provaSelecionada.cidadeEstado})
                    </span>
                    <span className="font-bold font-mono text-emerald-400">
                      R$ {provaSelecionada.valorInscricao.toFixed(2)}
                    </span>
                  </div>
                  {provaSelecionada.rankingNome && (
                    <div className="flex items-center gap-1 text-blue-400 font-medium">
                      <Trophy className="w-3.5 h-3.5 text-blue-400" />
                      Válido para: {provaSelecionada.rankingNome}
                    </div>
                  )}
                </div>
              )}

              {/* Regras e Status de Inscrição */}
              {jaPossuiDuasInscricoes ? (
                <div className="bg-red-500/20 border border-red-500/40 text-red-200 p-3.5 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                  <div>
                    <span className="font-black block">Limite Máximo de Inscrições Atingido</span>
                    <span>
                      Você já possui as 2 inscrições permitidas pelo regulamento oficial (Aro 20" e Cruiser 24") nesta mesma prova.
                    </span>
                  </div>
                </div>
              ) : inscricaoExistenteUnica ? (
                <div className="bg-blue-500/20 border border-blue-500/40 text-blue-200 p-3.5 rounded-xl text-xs flex items-center gap-2">
                  <Bike className="w-5 h-5 text-blue-400 shrink-0" />
                  <div>
                    <span className="font-black block">1ª Inscrição Ativa: {inscricaoExistenteUnica.categoriaNome}</span>
                    <span>
                      Regulamento BMX: Você pode realizar uma 2ª inscrição nesta prova exclusivamente em uma categoria de tamanho de aro oposto (Aro 20" ⇄ Cruiser 24").
                    </span>
                  </div>
                </div>
              ) : null}

              {/* Bike & Category Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Bike Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1 flex items-center gap-1">
                    <Bike className="w-3.5 h-3.5 text-blue-400" /> Tipo de Bike / Aro *
                  </label>
                  <select
                    value={tipoBike}
                    onChange={(e) => setTipoBike(e.target.value as any)}
                    className="w-full bg-slate-950 text-white font-bold text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-blue-400"
                  >
                    <option value='Aro 20"'>Aro 20" (Standard / Oficial)</option>
                    <option value='Cruiser 24"'>Cruiser 24" (Roda Larga)</option>
                  </select>
                </div>

                {/* Category in Race */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-400" /> Categoria na Prova *
                  </label>
                  <select
                    value={categoriaId}
                    onChange={(e) => setCategoriaId(e.target.value)}
                    className="w-full bg-slate-950 text-emerald-300 font-bold text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-400"
                  >
                    {categorias.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome} ({c.tipoBike})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Plate & Transponder */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1 flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5 text-amber-400" /> Número da Placa na Bike *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 42"
                    value={numeroPlaca}
                    onChange={(e) => setNumeroPlaca(e.target.value)}
                    className="w-full bg-slate-950 text-amber-300 font-mono font-bold text-sm px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1 flex items-center gap-1">
                    <Radio className="w-3.5 h-3.5 text-blue-400" /> Transponder Chip ID *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: TX-9021"
                    value={transponderId}
                    onChange={(e) => setTransponderId(e.target.value)}
                    className="w-full bg-slate-950 text-blue-300 font-mono font-bold text-sm px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <label className="block text-xs font-bold text-slate-300 uppercase flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                  Forma de Pagamento da Inscrição
                </label>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setMetodoPagamento('PIX')}
                    className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition ${
                      metodoPagamento === 'PIX'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                    <span>PIX Instantâneo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMetodoPagamento('CARTAO')}
                    className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition ${
                      metodoPagamento === 'CARTAO'
                        ? 'bg-blue-500/20 border-blue-500 text-blue-300 ring-1 ring-blue-500'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Cartão de Crédito</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMetodoPagamento('ISENTO')}
                    className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition ${
                      metodoPagamento === 'ISENTO'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-500'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Isenção / Clube</span>
                  </button>
                </div>

                {metodoPagamento === 'PIX' && (
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                    <div className="text-slate-300">
                      <span className="font-bold text-white block">Chave PIX Oficial da Federação:</span>
                      <span className="font-mono text-[11px] text-emerald-400">
                        financeiro@bmxbrasil.org.br
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyPix}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1 font-bold"
                    >
                      {copiadoPix ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" /> Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-amber-400" /> Copiar PIX
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {erro && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{erro}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="border-t border-slate-800 pt-4 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleFecharModal}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={jaPossuiDuasInscricoes}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black transition shadow-lg flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirmar Minha Inscrição na Prova</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
