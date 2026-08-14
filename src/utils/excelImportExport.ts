import React from 'react';
import * as XLSX from 'xlsx';
import { Atleta, Categoria, ClubeEquipe, Inscricao, ProvaEvento, StatusPagamento } from '../types/bmx';
import { calcularIdadeUCI, encontrarCategoriaCompavel, formatarCPF, validarCPF } from './uciBmEngine';

export interface LinhaImportadaPreview {
  idTemp: string;
  linhaNumero: number;
  nome: string;
  cpf: string;
  cpfValido: boolean;
  dataNascimento: string;
  idadeCalculada: number;
  sexo: 'Masculino' | 'Feminino';
  tipoBike: 'Aro 20"' | 'Cruiser 24"';
  categoriaInformada: string;
  categoriaResolvidaId: string;
  categoriaResolvidaNome: string;
  foiAutoDistribuido: boolean;
  clubeNome: string;
  clubeId: string;
  numeroPlaca: string;
  transponderId: string;
  tipoSanguineo: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  alergias: string;
  filiacao: string;
  matriculaCBC: string;
  matriculaUCI: string;
  endereco: string;
  estado: string;
  statusPagamento: StatusPagamento;
  senhaAtleta: string;
  atletaJaExisteNaBase: boolean;
  jaInscritoNestaProva: boolean;
  statusLinha: 'OK' | 'AVISO' | 'ERRO';
  mensagens: string[];
}

export interface ResultadoProcessamentoExcel {
  sucesso: boolean;
  totalLidos: number;
  linhasValidas: LinhaImportadaPreview[];
  linhasComErro: LinhaImportadaPreview[];
  distribuicaoPorCategoria: { [categoriaNome: string]: number };
  distribuicaoPorClube: { [clubeNome: string]: number };
  totalNovosAtletas: number;
  totalAtletasExistentes: number;
  totalNovasInscricoesValidas: number;
  avisosGerais: string[];
}

/**
 * Generates and downloads the official formatted BMX Excel Template (.xlsx)
 */
export function baixarPlanilhaModeloBMX(categorias: Categoria[], clubes: ClubeEquipe[]): void {
  const wb = XLSX.utils.book_new();

  // 1. DATA SHEET: "Inscricao_Atletas" with real sample rows
  const dadosExemplo = [
    {
      'Nome Completo': 'Bernardo Silva Albuquerque',
      'CPF': '123.456.789-00',
      'Data de Nascimento': '2014-06-15',
      'Sexo (Masculino/Feminino)': 'Masculino',
      'Tipo Bike (Aro 20" / Cruiser 24")': 'Aro 20"',
      'Categoria na Prova': 'Boys 11/12 anos',
      'Numero da Placa': '42',
      'Transponder ID': 'TX-9021',
      'Clube / Equipe': clubes[0]?.nomeEquipe || 'Paulínia Racing BMX',
      'Tipo Sanguineo': 'O+',
      'Alergias': 'Nenhuma',
      'Filiacao (Nome dos Pais)': 'Carlos Silva e Mariana Albuquerque',
      'Matricula CBC': 'CBC-2026-9041',
      'Matricula UCI': '100 892 345 11',
      'Cidade/Estado': 'Paulínia - SP',
      'Status Pagamento': 'Confirmada',
      'Senha Acesso Atleta': '1234',
    },
    {
      'Nome Completo': 'Isabella Santos Costa',
      'CPF': '234.567.890-11',
      'Data de Nascimento': '2012-08-22',
      'Sexo (Masculino/Feminino)': 'Feminino',
      'Tipo Bike (Aro 20" / Cruiser 24")': 'Aro 20"',
      'Categoria na Prova': 'Girls 13/14 anos',
      'Numero da Placa': '18',
      'Transponder ID': 'TX-9022',
      'Clube / Equipe': clubes[1]?.nomeEquipe || 'Americana Bicicross Clube',
      'Tipo Sanguineo': 'A+',
      'Alergias': 'Dipirona',
      'Filiacao (Nome dos Pais)': 'Renato Costa e Silvia Santos',
      'Matricula CBC': 'CBC-2026-9042',
      'Matricula UCI': '100 892 345 12',
      'Cidade/Estado': 'Americana - SP',
      'Status Pagamento': 'Confirmada',
      'Senha Acesso Atleta': '1234',
    },
    {
      'Nome Completo': 'Lucas Gabriel de Oliveira',
      'CPF': '345.678.901-22',
      'Data de Nascimento': '2001-03-10',
      'Sexo (Masculino/Feminino)': 'Masculino',
      'Tipo Bike (Aro 20" / Cruiser 24")': 'Aro 20"',
      'Categoria na Prova': 'Elite Men',
      'Numero da Placa': '77',
      'Transponder ID': 'TX-9023',
      'Clube / Equipe': clubes[0]?.nomeEquipe || 'Paulínia Racing BMX',
      'Tipo Sanguineo': 'B+',
      'Alergias': 'Nenhuma',
      'Filiacao (Nome dos Pais)': 'Marcos Oliveira e Sandra Gabriel',
      'Matricula CBC': 'CBC-2026-9043',
      'Matricula UCI': '100 892 345 13',
      'Cidade/Estado': 'Cosmópolis - SP',
      'Status Pagamento': 'Pendente',
      'Senha Acesso Atleta': '1234',
    },
    {
      'Nome Completo': 'Ricardo Mendonca (Auto-Distribuição)',
      'CPF': '456.789.012-33',
      'Data de Nascimento': '1988-11-04',
      'Sexo (Masculino/Feminino)': 'Masculino',
      'Tipo Bike (Aro 20" / Cruiser 24")': 'Cruiser 24"',
      'Categoria na Prova': '', // Demonstrates auto-category distribution by age/bike
      'Numero da Placa': '55',
      'Transponder ID': 'TX-9024',
      'Clube / Equipe': clubes[2]?.nomeEquipe || 'Jaraguá BMX Team',
      'Tipo Sanguineo': 'O-',
      'Alergias': 'Nenhuma',
      'Filiacao (Nome dos Pais)': 'Antonio Mendonca e Tereza Mendonca',
      'Matricula CBC': 'CBC-2026-9044',
      'Matricula UCI': '100 892 345 14',
      'Cidade/Estado': 'Jaraguá do Sul - SC',
      'Status Pagamento': 'Confirmada',
      'Senha Acesso Atleta': '1234',
    },
  ];

  const wsInscricao = XLSX.utils.json_to_sheet(dadosExemplo);
  // Column Widths
  wsInscricao['!cols'] = [
    { wch: 32 }, // Nome Completo
    { wch: 18 }, // CPF
    { wch: 20 }, // Data Nasc
    { wch: 16 }, // Sexo
    { wch: 18 }, // Tipo Bike
    { wch: 26 }, // Categoria
    { wch: 16 }, // Numero Placa
    { wch: 18 }, // Transponder
    { wch: 28 }, // Clube
    { wch: 14 }, // Sangue
    { wch: 18 }, // Alergias
    { wch: 32 }, // Filiacao
    { wch: 18 }, // CBC
    { wch: 18 }, // UCI
    { wch: 22 }, // Cidade/Estado
    { wch: 18 }, // Pagamento
    { wch: 18 }, // Senha
  ];
  XLSX.utils.book_append_sheet(wb, wsInscricao, 'Inscricao_Atletas');

  // 2. REFERENCE SHEET: "Categorias_Disponiveis"
  const dadosCategorias = categorias.map((c) => ({
    'ID': c.id,
    'Nome da Categoria': c.nome,
    'Tipo de Bike': c.tipoBike,
    'Idade Mínima': c.idadeMin,
    'Idade Máxima': c.idadeMax,
    'Gênero': c.sexo,
    'Descrição / Faixa Etária': c.descricao || `${c.idadeMin} a ${c.idadeMax} anos (${c.tipoBike})`,
  }));

  const wsCategorias = XLSX.utils.json_to_sheet(dadosCategorias);
  wsCategorias['!cols'] = [
    { wch: 20 },
    { wch: 30 },
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 40 },
  ];
  XLSX.utils.book_append_sheet(wb, wsCategorias, 'Categorias_Oficiais');

  // 3. REFERENCE SHEET: "Clubes_Cadastrados"
  const dadosClubes = clubes.map((cl) => ({
    'Nome do Clube / Equipe': cl.nomeEquipe,
    'CNPJ': cl.cnpj,
    'Estado': cl.estado,
    'Federação Afiliada': cl.federacaoAfiliada,
    'Dirigente Responsável': cl.dirigenteNome,
  }));
  const wsClubes = XLSX.utils.json_to_sheet(dadosClubes);
  wsClubes['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 10 }, { wch: 22 }, { wch: 26 }];
  XLSX.utils.book_append_sheet(wb, wsClubes, 'Clubes_Cadastrados');

  // 4. INSTRUCTIONS SHEET: "Instrucoes"
  const instrucoes = [
    {
      'INSTRUÇÃO': '1. PREENCHIMENTO OBRIGATÓRIO',
      'DETALHES': 'Os campos "Nome Completo", "CPF" e "Data de Nascimento" são fundamentais para validação.',
    },
    {
      'INSTRUÇÃO': '2. DISTRIBUIÇÃO AUTOMÁTICA DE CATEGORIAS',
      'DETALHES': 'Se a coluna "Categoria na Prova" for deixada em branco, o sistema distribuirá o atleta automaticamente de acordo com sua Idade UCI (Ano da Prova - Ano Nascimento), Sexo e Tipo de Bike (Aro 20" ou Cruiser 24").',
    },
    {
      'INSTRUÇÃO': '3. FORMATO DE DATAS',
      'DETALHES': 'Utilize o formato AAAA-MM-DD (ex: 2014-06-15) ou DD/MM/AAAA (ex: 15/06/2014).',
    },
    {
      'INSTRUÇÃO': '4. GESTÃO DE ATLETAS',
      'DETALHES': 'Atletas com CPFs já cadastrados no banco serão vinculados e atualizados; novos atletas serão criados na base permanentemente.',
    },
    {
      'INSTRUÇÃO': '5. NÚMERO DE PLACA E TRANSPONDER',
      'DETALHES': 'Caso não informados, o sistema gerará numeração padrão e chips temporários de validação para a prova.',
    },
  ];
  const wsInstrucoes = XLSX.utils.json_to_sheet(instrucoes);
  wsInstrucoes['!cols'] = [{ wch: 35 }, { wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsInstrucoes, 'Instrucoes_Preenchimento');

  // Trigger browser download
  XLSX.writeFile(wb, 'Modelo_Inscricao_BMX_Oficial.xlsx');
}

/**
 * Normalizes string keys for flexible column header matching
 */
function normalizarChave(k: string): string {
  return k
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Parses and validates raw Excel/CSV file content
 */
export async function processarPlanilhaExcelInscritos(
  file: File,
  provaAlvo: ProvaEvento,
  todasCategorias: Categoria[],
  todosClubes: ClubeEquipe[],
  atletasExistentes: Atleta[],
  inscricoesExistentes: Inscricao[],
  options: {
    autoDistribuirSeInvalido?: boolean;
    atualizarAtletaSeExiste?: boolean;
    gerarPlacaSeAusente?: boolean;
  } = {
    autoDistribuirSeInvalido: true,
    atualizarAtletaSeExiste: true,
    gerarPlacaSeAusente: true,
  }
): Promise<ResultadoProcessamentoExcel> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array', cellDates: true });

  // Choose the first sheet or one containing "inscricao" or "atleta"
  const sheetName =
    workbook.SheetNames.find((s) =>
      s.toLowerCase().includes('inscricao') || s.toLowerCase().includes('atleta')
    ) || workbook.SheetNames[0];

  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    throw new Error('A planilha selecionada não possui abas de dados válidas.');
  }

  const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
  if (rawRows.length === 0) {
    throw new Error('A planilha está vazia ou não contém linhas de dados.');
  }

  const linhasValidas: LinhaImportadaPreview[] = [];
  const linhasComErro: LinhaImportadaPreview[] = [];
  const distribuicaoPorCategoria: { [cat: string]: number } = {};
  const distribuicaoPorClube: { [clube: string]: number } = {};
  const avisosGerais: string[] = [];

  let totalNovosAtletas = 0;
  let totalAtletasExistentes = 0;
  let totalNovasInscricoesValidas = 0;

  // Counter for random/auto plates
  let autoPlacaCounter = 100;

  rawRows.forEach((row, index) => {
    const linhaNumero = index + 2; // Excel row numbering (header = row 1)

    // Build normalized map of row properties
    const map = new Map<string, any>();
    Object.keys(row).forEach((key) => {
      map.set(normalizarChave(key), row[key]);
    });

    const getVal = (possibleKeys: string[]): any => {
      for (const k of possibleKeys) {
        const norm = normalizarChave(k);
        if (map.has(norm) && map.get(norm) !== '') {
          return map.get(norm);
        }
      }
      return '';
    };

    // Extract fields
    const nomeRaw = String(getVal(['Nome Completo', 'Nome', 'Atleta', 'Nome do Atleta'])).trim();
    const cpfRaw = String(getVal(['CPF', 'Documento', 'Cpf'])).trim();
    const dataNascRaw = getVal(['Data de Nascimento', 'Data Nascimento', 'Nascimento', 'Data']);
    const sexoRaw = String(getVal(['Sexo', 'Gênero', 'Genero'])).trim();
    const tipoBikeRaw = String(getVal(['Tipo Bike', 'Tipo de Bike', 'Bike', 'Aro'])).trim();
    const categoriaRaw = String(getVal(['Categoria na Prova', 'Categoria', 'Cat'])).trim();
    const placaRaw = String(getVal(['Numero da Placa', 'Numero Placa', 'Placa', 'Numero'])).trim();
    const transponderRaw = String(getVal(['Transponder ID', 'Transponder', 'Chip'])).trim();
    const clubeRaw = String(getVal(['Clube / Equipe', 'Clube', 'Equipe', 'Time'])).trim();
    const tipoSanguineoRaw = String(getVal(['Tipo Sanguineo', 'Sangue', 'Tipo'])).trim();
    const alergiasRaw = String(getVal(['Alergias', 'Alergia', 'Restricoes'])).trim();
    const filiacaoRaw = String(getVal(['Filiacao', 'Pais', 'Nome dos Pais'])).trim();
    const cbcRaw = String(getVal(['Matricula CBC', 'CBC', 'Licenca CBC'])).trim();
    const uciRaw = String(getVal(['Matricula UCI', 'UCI', 'UCI ID'])).trim();
    const enderecoRaw = String(getVal(['Cidade/Estado', 'Cidade', 'Endereco'])).trim();
    const pagamentoRaw = String(getVal(['Status Pagamento', 'Pagamento', 'Status'])).trim();
    const senhaRaw = String(getVal(['Senha Acesso Atleta', 'Senha', 'PIN'])).trim();

    const mensagens: string[] = [];
    let statusLinha: 'OK' | 'AVISO' | 'ERRO' = 'OK';

    // 1. Validations: Nome
    if (!nomeRaw) {
      statusLinha = 'ERRO';
      mensagens.push('Nome do atleta não informado');
    }

    // 2. Validations: CPF
    const cpfFormatado = formatarCPF(cpfRaw);
    const cpfValido = validarCPF(cpfFormatado);
    if (!cpfValido) {
      if (!cpfRaw) {
        statusLinha = 'ERRO';
        mensagens.push('CPF obrigatório ausente');
      } else {
        statusLinha = 'AVISO';
        mensagens.push(`CPF "${cpfRaw}" com formato irregular`);
      }
    }

    // 3. Validations: Data Nascimento & UCI Age
    let dataNascimentoISO = '2005-01-01';
    if (dataNascRaw instanceof Date) {
      dataNascimentoISO = dataNascRaw.toISOString().split('T')[0];
    } else if (typeof dataNascRaw === 'string' && dataNascRaw.trim() !== '') {
      const s = dataNascRaw.trim();
      if (s.includes('/')) {
        const parts = s.split('/');
        if (parts.length === 3) {
          const d = parts[0].padStart(2, '0');
          const m = parts[1].padStart(2, '0');
          const y = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
          dataNascimentoISO = `${y}-${m}-${d}`;
        }
      } else if (s.includes('-')) {
        dataNascimentoISO = s;
      }
    } else if (typeof dataNascRaw === 'number') {
      // Excel serial date format
      const parsedDate = new Date(Math.round((dataNascRaw - 25569) * 86400 * 1000));
      if (!isNaN(parsedDate.getTime())) {
        dataNascimentoISO = parsedDate.toISOString().split('T')[0];
      }
    }

    const idadeCalculada = calcularIdadeUCI(dataNascimentoISO);

    // 4. Sexo & Bike Type Normalization
    const sexo: 'Masculino' | 'Feminino' =
      sexoRaw.toLowerCase().startsWith('f') ||
      sexoRaw.toLowerCase().includes('mulher') ||
      sexoRaw.toLowerCase().includes('girl') ||
      sexoRaw.toLowerCase().includes('fem')
        ? 'Feminino'
        : 'Masculino';

    const tipoBike: 'Aro 20"' | 'Cruiser 24"' =
      tipoBikeRaw.toLowerCase().includes('cruiser') || tipoBikeRaw.includes('24')
        ? 'Cruiser 24"'
        : 'Aro 20"';

    // 5. Category Resolution & Auto-Distribution
    let categoriaResolvidaId = '';
    let categoriaResolvidaNome = '';
    let foiAutoDistribuido = false;

    // Check if directly matches a category name
    const matchDireto = todasCategorias.find(
      (c) =>
        c.nome.toLowerCase().trim() === categoriaRaw.toLowerCase().trim() ||
        c.id.toLowerCase() === categoriaRaw.toLowerCase().trim()
    );

    if (matchDireto) {
      categoriaResolvidaId = matchDireto.id;
      categoriaResolvidaNome = matchDireto.nome;
    } else {
      // Auto-Distribute using UCI BMX Algorithm
      const autoMatch = encontrarCategoriaCompavel(
        dataNascimentoISO,
        sexo,
        tipoBike,
        todasCategorias
      );

      if (autoMatch) {
        categoriaResolvidaId = autoMatch.id;
        categoriaResolvidaNome = autoMatch.nome;
        foiAutoDistribuido = true;
        if (categoriaRaw) {
          mensagens.push(
            `Categoria informada "${categoriaRaw}" não encontrada. Auto-distribuído para: ${autoMatch.nome} (Idade UCI: ${idadeCalculada} anos)`
          );
        } else {
          mensagens.push(
            `Auto-distribuído para a categoria: ${autoMatch.nome} (Idade UCI: ${idadeCalculada} anos)`
          );
        }
        if (statusLinha !== 'ERRO') statusLinha = 'AVISO';
      } else {
        // Fallback to first category available
        categoriaResolvidaId = todasCategorias[0]?.id || 'cat-open';
        categoriaResolvidaNome = todasCategorias[0]?.nome || 'Categoria Geral';
        mensagens.push(`Nenhuma categoria compatível exata. Alocado em: ${categoriaResolvidaNome}`);
        if (statusLinha !== 'ERRO') statusLinha = 'AVISO';
      }
    }

    // 6. Club / Team Resolution
    const clubeResolvidoNome = clubeRaw || todosClubes[0]?.nomeEquipe || 'Paulínia Racing BMX';
    const clubeMatch = todosClubes.find(
      (cl) => cl.nomeEquipe.toLowerCase().trim() === clubeResolvidoNome.toLowerCase().trim()
    );
    const clubeId = clubeMatch?.id || todosClubes[0]?.id || 'clube-1';

    // 7. Plate & Transponder
    let numeroPlaca = placaRaw;
    if (!numeroPlaca && options.gerarPlacaSeAusente) {
      numeroPlaca = String(autoPlacaCounter++);
      mensagens.push(`Placa #${numeroPlaca} gerada automaticamente`);
    }

    const transponderId =
      transponderRaw || `TX-${Math.floor(1000 + Math.random() * 9000)}`;

    // 8. Blood type normalization
    const tipoSanguineo: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' = [
      'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-',
    ].includes(tipoSanguineoRaw.toUpperCase())
      ? (tipoSanguineoRaw.toUpperCase() as any)
      : 'O+';

    // 9. Payment status normalization
    let statusPagamento: StatusPagamento = 'Confirmada';
    if (pagamentoRaw.toLowerCase().includes('pend')) statusPagamento = 'Pendente';
    else if (pagamentoRaw.toLowerCase().includes('isent')) statusPagamento = 'Isento';

    // 10. Check if Athlete exists in permanent base
    const atletaExistente = atletasExistentes.find(
      (a) => a.cpf.replace(/\D/g, '') === cpfFormatado.replace(/\D/g, '')
    );
    const atletaJaExisteNaBase = !!atletaExistente;
    if (atletaJaExisteNaBase) {
      totalAtletasExistentes++;
      mensagens.push(`Atleta já cadastrado na base (${atletaExistente.nome})`);
    } else {
      totalNovosAtletas++;
    }

    // 11. Check if already enrolled in this exact race
    const jaInscritoNestaProva = inscricoesExistentes.some(
      (ins) =>
        ins.provaId === provaAlvo.id &&
        (ins.atletaCpf.replace(/\D/g, '') === cpfFormatado.replace(/\D/g, '') ||
          (atletaExistente && ins.atletaId === atletaExistente.id))
    );

    if (jaInscritoNestaProva) {
      mensagens.push(`Atenção: Já consta uma inscrição deste atleta nesta prova (${provaAlvo.nome})`);
      if (statusLinha !== 'ERRO') statusLinha = 'AVISO';
    }

    const itemPreview: LinhaImportadaPreview = {
      idTemp: `import-${index}-${Date.now()}`,
      linhaNumero,
      nome: nomeRaw,
      cpf: cpfFormatado || cpfRaw,
      cpfValido,
      dataNascimento: dataNascimentoISO,
      idadeCalculada,
      sexo,
      tipoBike,
      categoriaInformada: categoriaRaw,
      categoriaResolvidaId,
      categoriaResolvidaNome,
      foiAutoDistribuido,
      clubeNome: clubeResolvidoNome,
      clubeId,
      numeroPlaca: numeroPlaca || '1',
      transponderId,
      tipoSanguineo,
      alergias: alergiasRaw || 'Nenhuma',
      filiacao: filiacaoRaw || 'Mãe/Pai',
      matriculaCBC: cbcRaw,
      matriculaUCI: uciRaw,
      endereco: enderecoRaw || 'Brasil',
      estado: enderecoRaw.includes('-') ? enderecoRaw.split('-')[1].trim() : 'SP',
      statusPagamento,
      senhaAtleta: senhaRaw || '1234',
      atletaJaExisteNaBase,
      jaInscritoNestaProva,
      statusLinha,
      mensagens,
    };

    if (statusLinha === 'ERRO') {
      linhasComErro.push(itemPreview);
    } else {
      linhasValidas.push(itemPreview);
      totalNovasInscricoesValidas++;

      // Count distribution
      distribuicaoPorCategoria[categoriaResolvidaNome] =
        (distribuicaoPorCategoria[categoriaResolvidaNome] || 0) + 1;
      distribuicaoPorClube[clubeResolvidoNome] =
        (distribuicaoPorClube[clubeResolvidoNome] || 0) + 1;
    }
  });

  return {
    sucesso: linhasValidas.length > 0,
    totalLidos: rawRows.length,
    linhasValidas,
    linhasComErro,
    distribuicaoPorCategoria,
    distribuicaoPorClube,
    totalNovosAtletas,
    totalAtletasExistentes,
    totalNovasInscricoesValidas,
    avisosGerais,
  };
}

/**
 * Commits the validated imported items into the React state and persistence
 */
export function aplicarImportacaoInscritos(
  linhasParaImportar: LinhaImportadaPreview[],
  provaAlvo: ProvaEvento,
  atletas: Atleta[],
  setAtletas: React.Dispatch<React.SetStateAction<Atleta[]>>,
  inscricoes: Inscricao[],
  setInscricoes: React.Dispatch<React.SetStateAction<Inscricao[]>>,
  options: {
    ignorarDuplicatas?: boolean;
    atualizarAtletaBase?: boolean;
  } = { ignorarDuplicatas: true, atualizarAtletaBase: true }
): { inseridosInscricoes: number; criadosAtletas: number; atualizadosAtletas: number } {
  let criadosAtletas = 0;
  let atualizadosAtletas = 0;
  let inseridosInscricoes = 0;

  const novosAtletasList = [...atletas];
  const novasInscricoesList = [...inscricoes];

  linhasParaImportar.forEach((linha) => {
    // Check if athlete already exists by CPF
    const indexExistente = novosAtletasList.findIndex(
      (a) => a.cpf.replace(/\D/g, '') === linha.cpf.replace(/\D/g, '')
    );

    let atletaId = '';

    if (indexExistente >= 0) {
      atletaId = novosAtletasList[indexExistente].id;
      if (options.atualizarAtletaBase) {
        novosAtletasList[indexExistente] = {
          ...novosAtletasList[indexExistente],
          nome: linha.nome,
          dataNascimento: linha.dataNascimento,
          filiacao: linha.filiacao || novosAtletasList[indexExistente].filiacao,
          tipoSanguineo: linha.tipoSanguineo,
          alergias: linha.alergias,
          matriculaCBC: linha.matriculaCBC || novosAtletasList[indexExistente].matriculaCBC,
          matriculaUCI: linha.matriculaUCI || novosAtletasList[indexExistente].matriculaUCI,
          clubeNome: linha.clubeNome,
          clubeId: linha.clubeId,
          transponderId: linha.transponderId || novosAtletasList[indexExistente].transponderId,
          senha: linha.senhaAtleta || novosAtletasList[indexExistente].senha || '1234',
        };
        atualizadosAtletas++;
      }
    } else {
      atletaId = `atl-imp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const novoAtleta: Atleta = {
        id: atletaId,
        nome: linha.nome,
        cpf: linha.cpf,
        dataNascimento: linha.dataNascimento,
        filiacao: linha.filiacao,
        tipoSanguineo: linha.tipoSanguineo,
        alergias: linha.alergias,
        matriculaCBC: linha.matriculaCBC,
        matriculaUCI: linha.matriculaUCI,
        clubeId: linha.clubeId,
        clubeNome: linha.clubeNome,
        endereco: linha.endereco,
        estado: linha.estado,
        categoriaId: linha.categoriaResolvidaId,
        categoriaNome: linha.categoriaResolvidaNome,
        transponderId: linha.transponderId,
        senha: linha.senhaAtleta || '1234',
      };
      novosAtletasList.push(novoAtleta);
      criadosAtletas++;
    }

    // Check if already registered in this race
    const jaInscrito = novasInscricoesList.some(
      (i) => i.provaId === provaAlvo.id && i.atletaId === atletaId
    );

    if (jaInscrito && options.ignorarDuplicatas) {
      // Skip duplicating registration
      return;
    }

    const novaInscricao: Inscricao = {
      id: `ins-imp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      provaId: provaAlvo.id,
      atletaId,
      atletaNome: linha.nome,
      atletaCpf: linha.cpf,
      clubeNome: linha.clubeNome,
      categoriaId: linha.categoriaResolvidaId,
      categoriaNome: linha.categoriaResolvidaNome,
      categoriaOriginalId: linha.categoriaResolvidaId,
      categoriaOriginalNome: linha.categoriaResolvidaNome,
      numeroPlaca: linha.numeroPlaca,
      transponderId: linha.transponderId,
      statusPagamento: linha.statusPagamento,
      validadoTransponder: false,
      chipDevolvido: false,
      dataInscricao: new Date().toISOString().split('T')[0],
    };

    novasInscricoesList.unshift(novaInscricao);
    inseridosInscricoes++;
  });

  setAtletas(novosAtletasList);
  setInscricoes(novasInscricoesList);

  return {
    inseridosInscricoes,
    criadosAtletas,
    atualizadosAtletas,
  };
}
