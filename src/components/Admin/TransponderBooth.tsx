import React, { useState } from 'react';
import { Inscricao, TransponderValidationLog } from '../../types/bmx';
import {
  RadioTower,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Search,
  Zap,
  BatteryCharging,
  ShieldCheck,
  UserCheck,
  Filter,
} from 'lucide-react';

interface TransponderBoothProps {
  inscricoes: Inscricao[];
  setInscricoes: React.Dispatch<React.SetStateAction<Inscricao[]>>;
  transponderLogs: TransponderValidationLog[];
  setTransponderLogs: React.Dispatch<
    React.SetStateAction<TransponderValidationLog[]>
  >;
}

export const TransponderBooth: React.FC<TransponderBoothProps> = ({
  inscricoes,
  setInscricoes,
  transponderLogs,
  setTransponderLogs,
}) => {
  const [transponderInput, setTransponderInput] = useState<string>('');
  const [ultimoResultado, setUltimoResultado] = useState<{
    sucesso: boolean;
    mensagem: string;
    inscricao?: Inscricao;
  } | null>(null);
  const [filtroDevolucao, setFiltroDevolucao] = useState<'TODOS' | 'PENDENTES' | 'DEVOLVIDOS'>('TODOS');
  const [termoBusca, setTermoBusca] = useState<string>('');

  // Handle Scanning / Simulating Transponder Check
  const handleValidarTransponder = (transponderIdManual?: string) => {
    const idParaValidar = (transponderIdManual || transponderInput).trim().toUpperCase();
    if (!idParaValidar) return;

    const inscricaoEncontrada = inscricoes.find(
      (ins) => ins.transponderId.toUpperCase() === idParaValidar
    );

    if (inscricaoEncontrada) {
      // Update validation status
      setInscricoes((prev) =>
        prev.map((ins) =>
          ins.id === inscricaoEncontrada.id
            ? { ...ins, validadoTransponder: true }
            : ins
        )
      );

      // Add log entry
      const novoLog: TransponderValidationLog = {
        id: `log-${Date.now()}`,
        transponderId: idParaValidar,
        atletaNome: inscricaoEncontrada.atletaNome,
        atletaCpf: inscricaoEncontrada.atletaCpf,
        placa: inscricaoEncontrada.numeroPlaca,
        categoriaNome: inscricaoEncontrada.categoriaNome,
        dataHora: new Date().toLocaleString('pt-BR'),
        bateriaPct: Math.floor(Math.random() * 15) + 85, // 85% to 100%
        status: 'OK',
      };

      setTransponderLogs((prev) => [novoLog, ...prev]);
      setUltimoResultado({
        sucesso: true,
        mensagem: `Transponder ${idParaValidar} VALIDADO COM SUCESSO! Bateria OK.`,
        inscricao: inscricaoEncontrada,
      });
    } else {
      setUltimoResultado({
        sucesso: false,
        mensagem: `Transponder ${idParaValidar} NÃO ENCONTRADO nas inscrições deste evento!`,
      });
    }

    setTransponderInput('');
  };

  // Toggle Chip Devolucao status
  const handleToggleDevolucao = (inscricaoId: string) => {
    setInscricoes((prev) =>
      prev.map((ins) =>
        ins.id === inscricaoId
          ? { ...ins, chipDevolvido: !ins.chipDevolvido }
          : ins
      )
    );
  };

  // Filtered List for Chip Return Checklist
  const inscricoesFiltradas = inscricoes.filter((ins) => {
    const batemBusca =
      ins.atletaNome.toLowerCase().includes(termoBusca.toLowerCase()) ||
      ins.transponderId.toLowerCase().includes(termoBusca.toLowerCase()) ||
      ins.numeroPlaca.includes(termoBusca);

    if (filtroDevolucao === 'PENDENTES') return batemBusca && !ins.chipDevolvido;
    if (filtroDevolucao === 'DEVOLVIDOS') return batemBusca && ins.chipDevolvido;
    return batemBusca;
  });

  const totalChips = inscricoes.length;
  const devolvidosCount = inscricoes.filter((i) => i.chipDevolvido).length;
  const pendentesCount = totalChips - devolvidosCount;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-emerald-950 p-6 rounded-2xl border border-blue-500/30 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-blue-500 text-white text-xs font-black px-2.5 py-0.5 rounded uppercase flex items-center gap-1">
              <RadioTower className="w-3.5 h-3.5 animate-pulse" /> TRANSPONDER TIMING HUB
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 text-xs border border-emerald-500/30 px-2 py-0.5 rounded font-mono">
              Frequência 3.1 GHz OK
            </span>
          </div>
          <h2 className="text-2xl font-black text-white">
            Validação Pré-Prova e Devolução de Transponders
          </h2>
          <p className="text-sm text-slate-300 mt-0.5">
            Módulo de verificação de sinal/bateria de chips e controle de devolução ao final da competição.
          </p>
        </div>

        {/* Quick Stats Pill */}
        <div className="flex items-center gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-700">
          <div className="text-center px-2 border-r border-slate-700">
            <div className="text-xs text-slate-400 font-semibold">Total Chips</div>
            <div className="text-lg font-black text-white">{totalChips}</div>
          </div>
          <div className="text-center px-2 border-r border-slate-700">
            <div className="text-xs text-emerald-400 font-semibold">Devolvidos</div>
            <div className="text-lg font-black text-emerald-400">{devolvidosCount}</div>
          </div>
          <div className="text-center px-2">
            <div className="text-xs text-amber-400 font-semibold">Pendentes</div>
            <div className="text-lg font-black text-amber-400">{pendentesCount}</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Scanner Station & Chip Return Manager */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Card: Transponder Scanner Simulator */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <h3 className="font-black text-lg text-white">
                Bancada de Validação / Leitor de Chips
              </h3>
            </div>
            <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full font-mono">
              Loop Sensor On-line
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Aproxime o transponder do leitor de bancada ou digite o código do chip (ex: TX-9021) para checar o funcionamento do atleta antes de subir na rampa de largada.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleValidarTransponder();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              placeholder="Digite ou Escaneie o Transponder ID (ex: TX-9021)"
              value={transponderInput}
              onChange={(e) => setTransponderInput(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-amber-400 placeholder-slate-500"
            />
            <button
              type="submit"
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-5 py-3 rounded-xl shadow transition flex items-center gap-2 text-sm"
            >
              <RadioTower className="w-4 h-4" /> Validar
            </button>
          </form>

          {/* Quick Demo Scan Buttons */}
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase mb-2">
              Teste Rápido com Atletas da Prova:
            </div>
            <div className="flex flex-wrap gap-2">
              {inscricoes.slice(0, 4).map((ins) => (
                <button
                  key={ins.id}
                  onClick={() => handleValidarTransponder(ins.transponderId)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5"
                >
                  <Zap className="w-3 h-3 text-amber-400" />
                  {ins.transponderId} ({ins.atletaNome.split(' ')[0]})
                </button>
              ))}
            </div>
          </div>

          {/* Validation Banner Result */}
          {ultimoResultado && (
            <div
              className={`p-4 rounded-xl border animate-fade-in ${
                ultimoResultado.sucesso
                  ? 'bg-emerald-950/60 border-emerald-500 text-emerald-100'
                  : 'bg-red-950/60 border-red-500 text-red-100'
              }`}
            >
              <div className="flex items-start gap-3">
                {ultimoResultado.sucesso ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="font-black text-sm">
                    {ultimoResultado.sucesso
                      ? 'CHIP VALIDADO COM SUCESSO'
                      : 'FALHA NA VALIDAÇÃO'}
                  </h4>
                  <p className="text-xs mt-1 opacity-90">{ultimoResultado.mensagem}</p>

                  {ultimoResultado.inscricao && (
                    <div className="mt-3 pt-2 border-t border-emerald-500/30 grid grid-cols-2 gap-2 text-xs font-mono">
                      <div>
                        <span className="text-emerald-400 font-semibold">Atleta:</span>{' '}
                        {ultimoResultado.inscricao.atletaNome}
                      </div>
                      <div>
                        <span className="text-emerald-400 font-semibold">Placa:</span> #
                        {ultimoResultado.inscricao.numeroPlaca}
                      </div>
                      <div>
                        <span className="text-emerald-400 font-semibold">Categoria:</span>{' '}
                        {ultimoResultado.inscricao.categoriaNome}
                      </div>
                      <div>
                        <span className="text-emerald-400 font-semibold">Status:</span> SINAL
                        FORTISSIMO (100%)
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Scan History Log */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">
              Histórico Recente de Leituras de Bancada
            </h4>
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {transponderLogs.length === 0 ? (
                <p className="text-xs text-slate-500 italic">Nenhum log registrado.</p>
              ) : (
                transponderLogs.map((log) => (
                  <div
                    key={log.id}
                    className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs flex items-center justify-between"
                  >
                    <div>
                      <span className="font-mono font-bold text-amber-400">
                        {log.transponderId}
                      </span>{' '}
                      — <span className="font-bold text-white">{log.atletaNome}</span> (#{log.placa})
                      <div className="text-[10px] text-slate-400">{log.dataHora}</div>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <BatteryCharging className="w-3 h-3" /> {log.bateriaPct}%
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Card: Chip Return Checklist */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-emerald-400" />
              <h3 className="font-black text-lg text-white">
                Checklist de Devolução de Transponders
              </h3>
            </div>

            {/* Filter Pills */}
            <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-bold">
              <button
                onClick={() => setFiltroDevolucao('TODOS')}
                className={`px-2.5 py-1 rounded ${
                  filtroDevolucao === 'TODOS'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFiltroDevolucao('PENDENTES')}
                className={`px-2.5 py-1 rounded ${
                  filtroDevolucao === 'PENDENTES'
                    ? 'bg-amber-400 text-slate-950'
                    : 'text-slate-400'
                }`}
              >
                Pendentes
              </button>
              <button
                onClick={() => setFiltroDevolucao('DEVOLVIDOS')}
                className={`px-2.5 py-1 rounded ${
                  filtroDevolucao === 'DEVOLVIDOS'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'text-slate-400'
                }`}
              >
                Devolvidos
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar por nome, placa ou transponder..."
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-white text-xs focus:outline-none focus:border-emerald-400"
            />
          </div>

          {/* Checklist Table */}
          <div className="overflow-y-auto max-h-[400px] border border-slate-800 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-950 sticky top-0 text-slate-400 font-bold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">TRANSPONDER</th>
                  <th className="py-2.5 px-3">ATLETA</th>
                  <th className="py-2.5 px-3">CATEGORIA</th>
                  <th className="py-2.5 px-3 text-center">STATUS DEVOLUÇÃO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {inscricoesFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-6 text-slate-500">
                      Nenhum registro localizado.
                    </td>
                  </tr>
                ) : (
                  inscricoesFiltradas.map((ins) => (
                    <tr key={ins.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-400">
                        {ins.transponderId}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-white">
                        {ins.atletaNome}{' '}
                        <span className="text-[10px] text-amber-400">
                          (#{ins.numeroPlaca})
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">{ins.categoriaNome}</td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => handleToggleDevolucao(ins.id)}
                          className={`px-3 py-1 rounded-lg font-extrabold text-[11px] transition flex items-center gap-1 mx-auto ${
                            ins.chipDevolvido
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                          }`}
                        >
                          {ins.chipDevolvido ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />{' '}
                              Chip Devolvido
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />{' '}
                              Pendente
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
