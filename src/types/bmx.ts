export type UserRole = 'ADMIN' | 'DIRIGENTE' | 'ATLETA';

export type BikeType = 'Aro 20"' | 'Cruiser 24"';

export interface Categoria {
  id: string;
  nome: string;
  tipoBike: BikeType;
  idadeMin: number;
  idadeMax: number;
  sexo: 'Masculino' | 'Feminino' | 'Misto';
  descricao?: string;
}

export interface ClubeEquipe {
  id: string;
  logoUrl?: string;
  nomeEquipe: string;
  cnpj: string;
  endereco: string;
  estado: string;
  pais: string;
  federacaoAfiliada: string;
  dirigenteNome: string;
  dirigenteEmail: string;
  dirigenteCpf: string;
}

export interface Atleta {
  id: string;
  nome: string;
  cpf: string;
  dataNascimento: string; // YYYY-MM-DD
  filiacao: string; // Nome dos pais
  tipoSanguineo: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  alergias: string;
  matriculaCBC?: string;
  matriculaUCI?: string;
  clubeId: string;
  clubeNome: string;
  endereco: string;
  estado: string;
  categoriaId: string;
  categoriaNome: string;
  transponderId: string;
  fotoUrl?: string;
  senha?: string; // Senha/PIN de acesso do atleta ao painel individual
}

export interface CriterioPontuacao {
  posicao: number;
  pontos: number;
}

export interface Ranking {
  id: string;
  nomeRanking: string;
  etapasCount: number;
  categoriasIds: string[];
  pontuacaoRegra: CriterioPontuacao[];
  descricao?: string;
}

export type StatusProva = 'Inscrições Abertas' | 'Em Andamento' | 'Concluída' | 'Agendada';

export interface CategoriaCombinada {
  id: string;
  provaId: string;
  nomeCombinada: string;
  categoriasOrigemIds: string[];
  categoriasOrigemNomes: string[];
}

export interface ProvaEvento {
  id: string;
  nome: string;
  local: string;
  cidadeEstado: string;
  data: string; // YYYY-MM-DD
  bannerUrl?: string;
  rankingId?: string;
  rankingNome?: string;
  valorInscricao: number;
  categoriasIds: string[];
  status: StatusProva;
  inscritosCount?: number;
  organizador?: string;
  minAtletasCategoria?: number; // Default e.g. 4
  categoriasCombinadas?: CategoriaCombinada[];
}

export type StatusPagamento = 'Confirmada' | 'Pendente' | 'Isento';

export interface Inscricao {
  id: string;
  provaId: string;
  atletaId: string;
  atletaNome: string;
  atletaCpf: string;
  clubeNome: string;
  categoriaId: string;
  categoriaNome: string;
  categoriaOriginalId?: string;
  categoriaOriginalNome?: string;
  numeroPlaca: string;
  transponderId: string;
  statusPagamento: StatusPagamento;
  validadoTransponder: boolean;
  chipDevolvido: boolean;
  dataInscricao: string;
}

export type FaseMoto = 'Moto 1' | 'Moto 2' | 'Moto 3' | 'Quartas de Final' | 'Semifinal' | 'Final';

export interface PilotoMotoState {
  atletaId: string;
  atletaNome: string;
  numeroPlaca: string;
  clubeNome: string;
  transponderId: string;
  categoriaOriginalId?: string;
  categoriaOriginalNome?: string;
  gate: number; // 1 a 8
  posicaoChegada?: number; // 1 a 8
  statusResult?: 'OK' | 'DNF' | 'DNS' | 'REL';
  tempoSegundos?: number; // e.g. 33.452
  pontosMoto?: number; // 1 pt for 1st, 2 pt for 2nd... DNF, DNS, REL recalculated
}

export interface BateriaMoto {
  id: string;
  provaId: string;
  categoriaId: string;
  categoriaNome: string;
  fase: FaseMoto;
  numeroBateria: number; // e.g. Bateria 1, Bateria 2
  pilotos: PilotoMotoState[];
  status: 'Aguardando' | 'Alinhado' | 'Em Curso' | 'Finalizado';
}

export interface ResultadoCategoriaFinal {
  atletaId: string;
  atletaNome: string;
  numeroPlaca: string;
  clubeNome: string;
  categoriaNome: string;
  posicaoFinal: number;
  pontosGanhosRanking: number;
  pontosMotoTotal: number;
  tempoFinal?: number;
}

export interface TransponderValidationLog {
  id: string;
  transponderId: string;
  atletaNome: string;
  atletaCpf: string;
  placa: string;
  categoriaNome: string;
  dataHora: string;
  bateriaPct: number;
  status: 'OK' | 'Sinal Fraco' | 'Não Registrado';
}
