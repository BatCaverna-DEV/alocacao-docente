// Catálogo inicial usado para criar o banco (data/db.json) na primeira execução.
// Catálogo inicial extraído dos PPCs (ver claude/disciplinas-ti-por-curso.md no projeto Coordenação).
// Cursos superiores: 1 aula semanal a cada 15 h de carga horária.
// Cursos técnicos anuais: aulas semanais = CH anual (h/a) ÷ 40 semanas.

export const cursos = [
  { id: 'ads2025', nome: 'ADS', ppc: 'PPC 2025', nivel: 'superior', regime: 'semestral', unidade: 'h', divisor: 15 },
  { id: 'ads2023', nome: 'ADS', ppc: 'PPC 2023', nivel: 'superior', regime: 'semestral', unidade: 'h', divisor: 15 },
  { id: 'adm', nome: 'Bacharelado em Administração', ppc: 'PPC vigente', nivel: 'superior', regime: 'semestral', unidade: 'h', divisor: 15 },
  { id: 'tds', nome: 'Técnico em Desenvolvimento de Sistemas', ppc: 'Res. 123/2024', nivel: 'tecnico', regime: 'anual', unidade: 'h/a', divisor: 40 },
  { id: 'aut', nome: 'Técnico em Automação Industrial', ppc: 'Res. 121/2024', nivel: 'tecnico', regime: 'anual', unidade: 'h/a', divisor: 40 }
]

// [periodo, nome, ch, tipo]  — periodo null = optativa sem período fixo
const raw = {
  ads2025: [
    [1, 'Programação Estruturada', 75], [1, 'Arquitetura de Computadores', 45],
    [2, 'Estruturas de Dados', 60], [2, 'Programação Web I', 60], [2, 'Sistemas Operacionais', 60], [2, 'Banco de Dados', 60],
    [3, 'Programação Orientada a Objetos', 60], [3, 'Programação Web II', 60], [3, 'Redes de Computadores', 60], [3, 'Interação Humano-Computador', 30],
    [3, 'Atividades Curriculares de Extensão I', 90, 'orientacao'],
    [4, 'Programação para Dispositivos Móveis', 60], [4, 'Engenharia de Software', 60], [4, 'Análise de Dados', 30], [4, 'Sistemas de Informação', 30],
    [4, 'Atividades Curriculares de Extensão II', 120, 'orientacao'],
    [5, 'Projeto e Desenvolvimento de Sistemas', 60], [5, 'Gerência de Projetos de Software', 60], [5, 'Aprendizagem de Máquina', 60],
    [5, 'Trabalho de Conclusão de Curso I', 60, 'orientacao'],
    [6, 'Padrões de Projetos e Testes de Software', 60], [6, 'Auditoria e Segurança da Informação', 60], [6, 'Governança de Tecnologia da Informação', 30],
    [6, 'Trabalho de Conclusão de Curso II', 60, 'orientacao'],
    [null, 'Introdução à Robótica', 30, 'optativa'], [null, 'Redes Neurais Artificiais', 30, 'optativa'], [null, 'Sistemas Distribuídos', 30, 'optativa'],
    [null, 'Tópicos Avançados em Engenharia de Software', 30, 'optativa'], [null, 'Tópicos Especiais em Computação', 30, 'optativa']
  ],
  ads2023: [
    [1, 'Programação I', 60], [1, 'Arquitetura de Computadores', 60],
    [2, 'Programação II', 60], [2, 'Programação Web I', 60], [2, 'Sistemas Operacionais', 60], [2, 'Interação Humano-Computador', 30],
    [2, 'Atividade Curricular de Extensão I', 60, 'orientacao'],
    [3, 'Estrutura de Dados', 60], [3, 'Programação Web II', 60], [3, 'Banco de Dados', 60], [3, 'Redes de Computadores', 60],
    [3, 'Atividade Curricular de Extensão II', 60, 'orientacao'],
    [4, 'Aprendizado de Máquina', 60], [4, 'Programação Orientada a Objetos', 60], [4, 'Engenharia de Software I', 60], [4, 'Sistemas de Informação', 30],
    [4, 'Atividade Curricular de Extensão III', 60, 'orientacao'],
    [5, 'Programação para Dispositivos Móveis', 60], [5, 'Projeto e Desenvolvimento de Sistemas', 60], [5, 'Gerência de Projetos de Software', 60], [5, 'Engenharia de Software II', 30],
    [5, 'Atividade Curricular de Extensão IV', 60, 'orientacao'], [5, 'Trabalho de Conclusão de Curso I', 60, 'orientacao'],
    [6, 'Padrões de Projetos e Testes de Software', 60], [6, 'Governança de Tecnologia da Informação', 30], [6, 'Auditoria e Segurança da Informação', 60],
    [6, 'Trabalho de Conclusão de Curso II', 60, 'orientacao']
  ],
  adm: [
    [1, 'Tecnologia da Informação e Comunicação', 60], [6, 'Sistemas de Informações Gerenciais', 60],
    [null, 'Business Intelligence', 30, 'optativa']
  ],
  tds: [
    [1, 'Fundamentos de Sistema de Computação', 80], [1, 'Fundamentos de Programação', 160], [1, 'Introdução a Desenvolvimento de Sistemas', 80],
    [2, 'Redes de Computadores', 80], [2, 'Banco de Dados', 80], [2, 'Desenvolvimento de Sistemas Web I', 80], [2, 'Modelagem e Programação Orientada a Objetos', 160],
    [3, 'Desenvolvimento de Sistemas Web II', 120], [3, 'Programação para Dispositivos Móveis', 80], [3, 'Boas Práticas no Desenvolvimento de Softwares', 80],
    [3, 'Programação de Aplicações para Ambiente Desktop', 80]
  ],
  aut: [
    [1, 'Informática Básica', 40], [1, 'Lógica de Programação Aplicada', 80]
  ]
}

export function aulasSemanais (ch, divisor) {
  return Math.round((ch / divisor) * 10) / 10
}

export function buildSeed () {
  const disciplinas = []
  for (const curso of cursos) {
    raw[curso.id].forEach(([periodo, nome, ch, tipo = 'obrigatoria'], i) => {
      disciplinas.push({
        id: `${curso.id}-${String(i + 1).padStart(2, '0')}`,
        cursoId: curso.id,
        periodo,
        nome,
        ch,
        tipo,
        aulasSemanais: aulasSemanais(ch, curso.divisor),
        personalizada: false
      })
    })
  }

  const nomes = [
    'Bruno Vicente Alves de Lima',
    'Diogo Vinicius de Sousa Silva',
    'Francisco Alan de Oliveira Santos',
    'João Paulo Marques Silva',
    'José Jeovane Reges Cordeiro',
    'Robert Silva Lima'
  ]
  const professores = nomes.map((nome, i) => ({ id: `p${i + 1}`, nome, minAulas: 10, maxAulas: 20 }))

  return {
    versao: 1,
    cursos,
    disciplinas,
    professores,
    semestres: [{ id: '2027.1', criadoEm: new Date().toISOString() }],
    ofertas: [],
    seq: { prof: nomes.length, disc: 0, oferta: 0 }
  }
}
