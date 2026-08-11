import { Atleta, BateriaMoto, Categoria, FaseMoto, PilotoMotoState, ResultadoCategoriaFinal } from '../types/bmx';

/**
 * Calculates UCI Competition Age: Current Year minus Birth Year
 */
export function calcularIdadeUCI(dataNascimento: string): number {
  if (!dataNascimento) return 0;
  const anoNasc = new Date(dataNascimento).getFullYear();
  const anoAtual = 2026; // Ref year for current season
  return anoAtual - anoNasc;
}

/**
 * Finds matching category based on age, sex, bike type
 */
export function encontrarCategoriaCompavel(
  dataNascimento: string,
  sexo: 'Masculino' | 'Feminino',
  tipoBike: 'Aro 20"' | 'Cruiser 24"',
  categorias: Categoria[]
): Categoria | undefined {
  const idadeUCI = calcularIdadeUCI(dataNascimento);
  
  return categorias.find(cat => {
    const batemBike = cat.tipoBike === tipoBike;
    const batemSexo = cat.sexo === 'Misto' || cat.sexo === sexo;
    const batemIdade = idadeUCI >= cat.idadeMin && idadeUCI <= cat.idadeMax;
    return batemBike && batemSexo && batemIdade;
  });
}

/**
 * Format CPF: 000.000.000-00
 */
export function formatarCPF(cpf: string): string {
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11) return cpf;
  return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Basic CPF format validator
 */
export function validarCPF(cpf: string): boolean {
  const clean = cpf.replace(/\D/g, '');
  return clean.length === 11;
}

export type MetodoSorteio = 'UCI_RANKING' | 'UCI_RANDOM' | 'SCRAMBLED';

export interface RiderInscritoInput {
  atletaId: string;
  atletaNome: string;
  numeroPlaca: string;
  clubeNome: string;
  transponderId: string;
  posicaoRanking?: number;
}

/**
 * Generates UCI style Qualifying Motos (Motos 1, 2 e 3) according to draw method:
 * - UCI_RANKING: UCI Annex 2 ranking serpentine draw (groups fixed across Motos 1-3)
 * - UCI_RANDOM: UCI Annex 2 random draw (groups fixed across Motos 1-3)
 * - SCRAMBLED: Scrambled format (riders re-shuffled into new groups in every Moto phase)
 */
export function gerarBateriasQualificatorias(
  provaId: string,
  categoriaId: string,
  categoriaNome: string,
  inscritos: RiderInscritoInput[],
  metodo: MetodoSorteio = 'UCI_RANDOM'
): BateriaMoto[] {
  if (inscritos.length === 0) return [];

  const MAX_PER_MOTO = 8;
  const totalInscritos = inscritos.length;
  const totalBaterias = Math.ceil(totalInscritos / MAX_PER_MOTO);

  const fases: FaseMoto[] = ['Classificatória 1', 'Classificatória 2', 'Classificatória 3'];
  const bateriasGeradas: BateriaMoto[] = [];

  if (metodo === 'UCI_RANKING') {
    // Sort riders by ranking position (or plate number / index fallback)
    const sortedRiders = [...inscritos].sort((a, b) => {
      const posA = a.posicaoRanking !== undefined ? a.posicaoRanking : parseInt(a.numeroPlaca) || 999;
      const posB = b.posicaoRanking !== undefined ? b.posicaoRanking : parseInt(b.numeroPlaca) || 999;
      return posA - posB;
    });

    // Serpentine / Snake distribution across heats according to UCI Annex 2
    const heatsRiders: RiderInscritoInput[][] = Array.from({ length: totalBaterias }, () => []);
    let currentHeat = 0;
    let direction = 1;

    sortedRiders.forEach((rider) => {
      heatsRiders[currentHeat].push(rider);
      if (totalBaterias > 1) {
        if (direction === 1) {
          if (currentHeat === totalBaterias - 1) {
            direction = -1;
          } else {
            currentHeat++;
          }
        } else {
          if (currentHeat === 0) {
            direction = 1;
          } else {
            currentHeat--;
          }
        }
      }
    });

    // Generate Motos 1, 2, 3 with fixed groups but re-allocated gates
    fases.forEach((fase) => {
      heatsRiders.forEach((ridersInHeat, heatIndex) => {
        const gates = Array.from({ length: 8 }, (_, i) => i + 1).sort(() => Math.random() - 0.5);

        const pilotos: PilotoMotoState[] = ridersInHeat.map((r, rIdx) => ({
          atletaId: r.atletaId,
          atletaNome: r.atletaNome,
          numeroPlaca: r.numeroPlaca,
          clubeNome: r.clubeNome,
          transponderId: r.transponderId,
          gate: gates[rIdx] || (rIdx + 1),
        }));

        bateriasGeradas.push({
          id: `moto-${categoriaId}-${fase}-${heatIndex + 1}-${Math.random().toString(36).substring(2, 7)}`,
          provaId,
          categoriaId,
          categoriaNome,
          fase,
          numeroBateria: heatIndex + 1,
          pilotos,
          status: 'Aguardando',
        });
      });
    });

  } else if (metodo === 'SCRAMBLED') {
    // Scrambled mode: Re-shuffle riders into brand new groups for EACH phase (Moto 1, Moto 2, Moto 3)
    fases.forEach((fase) => {
      const heatsRiders: RiderInscritoInput[][] = Array.from({ length: totalBaterias }, () => []);
      const shuffledPhase = [...inscritos].sort(() => Math.random() - 0.5);

      shuffledPhase.forEach((rider, idx) => {
        heatsRiders[idx % totalBaterias].push(rider);
      });

      heatsRiders.forEach((ridersInHeat, heatIndex) => {
        const gates = Array.from({ length: 8 }, (_, i) => i + 1).sort(() => Math.random() - 0.5);

        const pilotos: PilotoMotoState[] = ridersInHeat.map((r, rIdx) => ({
          atletaId: r.atletaId,
          atletaNome: r.atletaNome,
          numeroPlaca: r.numeroPlaca,
          clubeNome: r.clubeNome,
          transponderId: r.transponderId,
          gate: gates[rIdx] || (rIdx + 1),
        }));

        bateriasGeradas.push({
          id: `moto-${categoriaId}-${fase}-${heatIndex + 1}-${Math.random().toString(36).substring(2, 7)}`,
          provaId,
          categoriaId,
          categoriaNome,
          fase,
          numeroBateria: heatIndex + 1,
          pilotos,
          status: 'Aguardando',
        });
      });
    });

  } else {
    // Default UCI_RANDOM: Random distribution into groups for Moto 1, fixed groups across Motos 1-3
    const heatsRiders: RiderInscritoInput[][] = Array.from({ length: totalBaterias }, () => []);
    const shuffled = [...inscritos].sort(() => Math.random() - 0.5);

    shuffled.forEach((rider, idx) => {
      heatsRiders[idx % totalBaterias].push(rider);
    });

    fases.forEach((fase) => {
      heatsRiders.forEach((ridersInHeat, heatIndex) => {
        const gates = Array.from({ length: 8 }, (_, i) => i + 1).sort(() => Math.random() - 0.5);

        const pilotos: PilotoMotoState[] = ridersInHeat.map((r, rIdx) => ({
          atletaId: r.atletaId,
          atletaNome: r.atletaNome,
          numeroPlaca: r.numeroPlaca,
          clubeNome: r.clubeNome,
          transponderId: r.transponderId,
          gate: gates[rIdx] || (rIdx + 1),
        }));

        bateriasGeradas.push({
          id: `moto-${categoriaId}-${fase}-${heatIndex + 1}-${Math.random().toString(36).substring(2, 7)}`,
          provaId,
          categoriaId,
          categoriaNome,
          fase,
          numeroBateria: heatIndex + 1,
          pilotos,
          status: 'Aguardando',
        });
      });
    });
  }

  return bateriasGeradas;
}

/**
 * Calculates UCI points for a pilot in a heat considering position and status (DNF, DNS, REL).
 * - DNF = number of riders who started in that heat
 * - DNS = total registered riders in that heat + 2
 * - REL = number of riders who started in that heat + 2
 */
export function calcularPontosPilotoMoto(
  piloto: PilotoMotoState,
  bateria: BateriaMoto
): number {
  const totalInscritos = bateria.pilotos.length;
  // Riders who started = riders in heat whose status is NOT DNS
  const pilotosQueLargaram = bateria.pilotos.filter(
    (p) => p.statusResult !== 'DNS'
  ).length;

  if (piloto.statusResult === 'DNS') {
    return totalInscritos + 2;
  }
  if (piloto.statusResult === 'DNF') {
    return pilotosQueLargaram;
  }
  if (piloto.statusResult === 'REL') {
    return pilotosQueLargaram + 2;
  }
  if (piloto.posicaoChegada && piloto.posicaoChegada > 0) {
    return piloto.posicaoChegada;
  }
  return totalInscritos;
}

/**
 * Recalculates points for all pilots in a heat
 */
export function recalcularPontosBateria(bateria: BateriaMoto): BateriaMoto {
  const novosPilotos = bateria.pilotos.map((p) => ({
    ...p,
    pontosMoto: calcularPontosPilotoMoto(p, bateria),
  }));

  return {
    ...bateria,
    pilotos: novosPilotos,
  };
}

/**
 * Calculates standings from qualifying motos (Motos 1, 2, 3) using UCI points sum (1pt for 1st, 2pt for 2nd...)
 */
export function calcularResultadoAcumuladoQualificatorias(
  baterias: BateriaMoto[]
): {
  atletaId: string;
  atletaNome: string;
  numeroPlaca: string;
  clubeNome: string;
  transponderId: string;
  pontosMoto1: number;
  pontosMoto2: number;
  pontosMoto3: number;
  totalPontos: number;
  melhorTempo?: number;
  classificadoProximaFase: boolean;
}[] {
  const mapaAtletas = new Map<
    string,
    {
      atletaId: string;
      atletaNome: string;
      numeroPlaca: string;
      clubeNome: string;
      transponderId: string;
      p1: number;
      p2: number;
      p3: number;
      tempos: number[];
    }
  >();

  baterias.forEach((bateria) => {
    const bateriaAtualizada = recalcularPontosBateria(bateria);

    bateriaAtualizada.pilotos.forEach((p) => {
      if (!mapaAtletas.has(p.atletaId)) {
        mapaAtletas.set(p.atletaId, {
          atletaId: p.atletaId,
          atletaNome: p.atletaNome,
          numeroPlaca: p.numeroPlaca,
          clubeNome: p.clubeNome,
          transponderId: p.transponderId,
          p1: 0,
          p2: 0,
          p3: 0,
          tempos: [],
        });
      }

      const record = mapaAtletas.get(p.atletaId)!;
      const pontosPos = p.pontosMoto !== undefined ? p.pontosMoto : 8;

      if (bateria.fase === 'Classificatória 1') record.p1 = pontosPos;
      if (bateria.fase === 'Classificatória 2') record.p2 = pontosPos;
      if (bateria.fase === 'Classificatória 3') record.p3 = pontosPos;

      if (p.tempoSegundos && p.tempoSegundos > 0) {
        record.tempos.push(p.tempoSegundos);
      }
    });
  });

  const resultados = Array.from(mapaAtletas.values()).map((rec) => {
    const totalPontos = rec.p1 + rec.p2 + rec.p3;
    const minTempo = rec.tempos.length > 0 ? Math.min(...rec.tempos) : undefined;
    return {
      atletaId: rec.atletaId,
      atletaNome: rec.atletaNome,
      numeroPlaca: rec.numeroPlaca,
      clubeNome: rec.clubeNome,
      transponderId: rec.transponderId,
      pontosMoto1: rec.p1,
      pontosMoto2: rec.p2,
      pontosMoto3: rec.p3,
      totalPontos,
      melhorTempo: minTempo,
      classificadoProximaFase: false,
    };
  });

  // Sort by lowest points (UCI rule) then best time
  resultados.sort((a, b) => {
    if (a.totalPontos !== b.totalPontos) {
      return a.totalPontos - b.totalPontos;
    }
    if (a.melhorTempo && b.melhorTempo) {
      return a.melhorTempo - b.melhorTempo;
    }
    return 0;
  });

  // Mark top 8 (or top 4 per heat) as qualified for Final/Semi
  resultados.forEach((res, idx) => {
    if (idx < 8) {
      res.classificadoProximaFase = true;
    }
  });

  return resultados;
}

/**
 * Standard UCI BMX Points Scale for Rankings
 */
export const TABELA_PONTOS_UCI = [
  { posicao: 1, pontos: 100 },
  { posicao: 2, pontos: 80 },
  { posicao: 3, pontos: 65 },
  { posicao: 4, pontos: 55 },
  { posicao: 5, pontos: 45 },
  { posicao: 6, pontos: 35 },
  { posicao: 7, pontos: 30 },
  { posicao: 8, pontos: 25 },
  { posicao: 9, pontos: 20 },
  { posicao: 10, pontos: 18 },
  { posicao: 11, pontos: 16 },
  { posicao: 12, pontos: 14 },
  { posicao: 13, pontos: 12 },
  { posicao: 14, pontos: 10 },
  { posicao: 15, pontos: 8 },
  { posicao: 16, pontos: 6 },
];

export function obterPontosPosicao(posicao: number): number {
  const item = TABELA_PONTOS_UCI.find((t) => t.posicao === posicao);
  if (item) return item.pontos;
  return Math.max(1, 20 - posicao);
}
