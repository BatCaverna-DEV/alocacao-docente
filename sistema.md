# Sistema de Alocação Docente — IFMA Campus Coelho Neto

## 1. Visão geral

Plataforma web para planejar a **divisão das disciplinas de TI entre os professores** a cada semestre letivo. O coordenador monta a oferta do semestre a partir de um catálogo de disciplinas (extraído dos PPCs dos cursos), atribui cada disciplina a um professor em uma planilha interativa e acompanha a carga semanal de aulas de cada docente em relação a uma faixa mínima/máxima.

Principais funcionalidades:

- Catálogo de disciplinas por curso/PPC, com cálculo automático de aulas semanais.
- Cadastro de semestres (formato `AAAA.S`), com cópia opcional das ofertas de outro semestre.
- Oferta do semestre: inclusão de disciplinas agrupadas por turma e atribuição de professor.
- Controle de carga docente (aulas/semana) com alerta de faixa (abaixo do mínimo, dentro da faixa, acima do limite).
- Cadastro de professores com faixa individual de aulas.
- Exportação da oferta em CSV e backup completo dos dados em JSON.

## 2. Arquitetura

```
alocacao-docente/
├── backend/    API REST em Node.js + Express, persistência em arquivo JSON
└── frontend/   SPA em Vue 3 + Vite + Bootstrap-Vue-Next
```

| Camada     | Tecnologias                                                        |
|------------|--------------------------------------------------------------------|
| Back-end   | Node.js (ES Modules), Express 4                                     |
| Persistência | Arquivo JSON (`backend/data/db.json`), mantido em memória        |
| Front-end  | Vue 3 (Composition API, `<script setup>`), Vue Router 4 (hash history), Bootstrap 5 + bootstrap-vue-next, Vite 6 |

Fluxo em produção: o front-end é compilado (`frontend/dist`) e servido pelo próprio Express na porta 3000, junto com a API em `/api`. Em desenvolvimento, o Vite roda na porta 5173 e faz proxy de `/api` para `http://localhost:3000`.

Não há autenticação: o sistema é pensado para uso local/interno pela coordenação.

## 3. Back-end

### 3.1 Estrutura

```
backend/
├── index.js              Inicialização do Express, rotas, estáticos e tratamento de erros
├── config/
│   ├── config.js         Porta, caminho do arquivo de dados e do front compilado
│   ├── database.js       Carga/gravação do JSON, geração de IDs sequenciais
│   └── httpError.js      Erro com status HTTP lançado pelos models
├── models/               Regras de negócio (Curso, Disciplina, Professor, Semestre, Oferta, seedData)
├── controller/           Adaptadores HTTP finos que chamam os models
├── routes/               Definição das rotas Express
└── data/db.json          Base de dados
```

Padrão em camadas **routes → controller → model → database**. Os models validam os dados e lançam `HttpError(status, mensagem)`; o middleware de erros em `index.js` converte isso em `{ "erro": "mensagem" }` com o status adequado (erros 500 são registrados no console e retornam mensagem genérica).

### 3.2 Persistência

- Os dados ficam inteiramente em memória e são gravados no arquivo a cada alteração (`save()`), com escrita atômica (grava em `.tmp` e renomeia).
- Na primeira execução, se o arquivo não existir, o banco é criado a partir de `seedData.js` (cursos, disciplinas dos PPCs, 6 professores e o semestre `2027.1`).
- Migração automática: se existir `data/db.json` na raiz do projeto (versão anterior) e não existir o arquivo novo, ele é copiado.
- IDs sequenciais por contador em `seq` (`prof`, `disc`, `oferta`).

Variáveis de ambiente:

| Variável  | Padrão                    | Descrição               |
|-----------|---------------------------|-------------------------|
| `PORT`    | `3000`                    | Porta HTTP              |
| `DB_FILE` | `backend/data/db.json`    | Caminho do arquivo de dados |

### 3.3 Modelo de dados

Estrutura raiz do `db.json`:

```json
{ "versao": 1, "cursos": [], "disciplinas": [], "professores": [], "semestres": [], "ofertas": [], "seq": {} }
```

**Curso** (fixo, vem do seed)

| Campo   | Descrição |
|---------|-----------|
| `id`    | `ads2025`, `ads2023`, `adm`, `tds`, `aut` |
| `nome`, `ppc` | Nome do curso e PPC/resolução |
| `nivel` | `superior` ou `tecnico` |
| `regime`| `semestral` ou `anual` |
| `unidade` | `h` (superior) ou `h/a` (técnico) |
| `divisor` | 15 (superior) ou 40 (técnico) — usado no cálculo de aulas semanais |

Cursos cadastrados: ADS (PPC 2025), ADS (PPC 2023), Bacharelado em Administração, Técnico em Desenvolvimento de Sistemas e Técnico em Automação Industrial.

**Disciplina**

| Campo | Descrição |
|-------|-----------|
| `id` | `<curso>-NN` (catálogo) ou `<curso>-xN` (personalizada) |
| `cursoId`, `nome`, `ch` | Curso, nome e carga horária |
| `periodo` | Período/ano; `null` = optativa sem período fixo |
| `tipo` | `obrigatoria`, `optativa` ou `orientacao` (TCC/Extensão) |
| `aulasSemanais` | `ch ÷ divisor`, arredondado a 1 casa decimal |
| `personalizada` | `true` se criada pelo usuário (só estas podem ser excluídas) |

**Professor**: `id` (`pN`), `nome`, `minAulas` (padrão 10), `maxAulas` (padrão 20).

**Semestre**: `id` (`AAAA.1` ou `AAAA.2`), `criadoEm`.

**Oferta** (disciplina oferecida em um semestre)

| Campo | Descrição |
|-------|-----------|
| `id` | `oN` |
| `semestreId`, `disciplinaId` | Referências |
| `turma` | Texto livre usado para agrupar (ex.: "ADS 2026.1", "TDS 2º ano") |
| `professorId` | Professor atribuído ou `null` |
| `aulasSemanais` | Herdado da disciplina, editável (permite dividir uma disciplina entre professores) |
| `observacao` | Texto livre |

### 3.4 Regras de negócio

- **Aulas semanais**: superior = CH (h) ÷ 15; técnico anual = CH anual (h/a) ÷ 40 semanas.
- **Uma disciplina ofertada tem um único professor**. Para dividir, oferta-se a disciplina duas vezes e repartem-se as aulas.
- **Semestre**: formato obrigatório `AAAA.[12]`, sem duplicidade. A sugestão do próximo semestre é o seguinte ao último cadastrado (ou `2027.1` se não houver nenhum).
- **Cópia de ofertas ao criar semestre** (`modoCopia`):
  - `anuais` (padrão): copia apenas ofertas de cursos de regime anual (técnicos), para que continuem contando na carga do 2º semestre;
  - `todas`: copia todas as ofertas, com turma e professor;
  - `nenhuma`: não copia.
- **Exclusões**:
  - Semestre: remove também todas as suas ofertas.
  - Professor: as ofertas atribuídas a ele ficam sem professor.
  - Disciplina: apenas personalizadas e somente se não estiver ofertada em nenhum semestre (409 caso contrário).
- **Situação da carga** (calculada no front-end): acima de `maxAulas` → "Acima do limite"; abaixo de `minAulas` → "Abaixo do mínimo"; caso contrário → "Dentro da faixa".

### 3.5 API REST (prefixo `/api`)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/estado` | Retorna cursos, disciplinas, professores, semestres e ofertas em uma única resposta |
| GET | `/backup` | Download do arquivo de dados completo (`alocacao-docente-backup.json`) |
| GET | `/professores` | Lista professores |
| POST | `/professores` | Cria professor `{ nome, minAulas, maxAulas }` |
| PUT | `/professores/:id` | Atualiza campos informados |
| DELETE | `/professores/:id` | Exclui professor (desatribui ofertas) |
| GET | `/disciplinas` | Lista o catálogo |
| POST | `/disciplinas` | Cria disciplina personalizada `{ cursoId, nome, ch, periodo, tipo }` |
| DELETE | `/disciplinas/:id` | Exclui disciplina personalizada não ofertada |
| GET | `/semestres` | Lista semestres ordenados |
| GET | `/semestres/sugestao` | `{ id }` do próximo semestre sugerido |
| POST | `/semestres` | Cria semestre `{ id, copiarDe, modoCopia }` |
| DELETE | `/semestres/:id` | Exclui semestre e suas ofertas |
| GET | `/ofertas?semestre=AAAA.S` | Lista ofertas (filtro opcional) |
| POST | `/ofertas` | Cria várias ofertas `{ semestreId, disciplinaIds[], turma }` |
| PUT | `/ofertas/:id` | Atualiza `professorId`, `turma`, `aulasSemanais`, `observacao` |
| DELETE | `/ofertas/:id` | Remove oferta |

Respostas: `201` na criação, `204` na exclusão, erros como `{ "erro": "..." }` com 400/404/409/500. Rotas `/api` inexistentes retornam 404.

## 4. Front-end

### 4.1 Estrutura

```
frontend/src/
├── main.js                     Cria o app Vue, router e importa CSS (Bootstrap)
├── App.vue                     <BApp> + AppLayout
├── router/index.js             Rotas/abas da aplicação
├── services/api.js             Wrapper de fetch (GET/POST/PUT/DELETE) que lança erro com a mensagem do servidor
├── stores/alocacao.js          Estado global reativo (sem Pinia), consultas e ações
├── composables/useNotify.js    Toasts de sucesso/erro para ações assíncronas
├── components/
│   ├── AppLayout.vue           Barra superior (seletor/criar/excluir semestre) e abas
│   ├── NovoSemestreModal.vue   Criação de semestre com opção de cópia
│   └── AdicionarDisciplinasModal.vue  Seleção de disciplinas do catálogo para o semestre
└── views/
    ├── OfertaView.vue          Planilha de oferta do semestre
    ├── CargaDocenteView.vue    Carga por professor
    ├── ProfessoresView.vue     Cadastro de professores
    └── CatalogoView.vue        Catálogo de disciplinas
```

### 4.2 Gerenciamento de estado

`stores/alocacao.js` mantém um objeto `reactive` com todos os dados, carregados de uma vez via `GET /api/estado`. Toda ação (`acoes.*`) chama a API e, em seguida, recarrega o estado completo — simples e consistente, adequado ao volume pequeno de dados. O semestre selecionado é lembrado no `localStorage` (`semestreAtual`).

Funções auxiliares: `cargaPorProfessor(semestreId)`, `situacao(aulas, prof)`, `rotuloCurso`, `rotuloPeriodo`, `nomeCurto` (ex.: "Bruno Vicente Alves de Lima" → "Bruno Vicente") e `fmt` (número formatado em pt-BR).

### 4.3 Telas

**Barra superior** — seletor do semestre atual, botão "+ Novo semestre" (sugere o próximo semestre e, se for `AAAA.2`, propõe copiar as disciplinas anuais do `AAAA.1`) e "Excluir semestre" (com confirmação).

**Oferta do semestre** (`/oferta`, tela inicial)
- Indicadores: nº de disciplinas, turmas, aulas/semana, aulas sem professor e docentes alocados.
- Planilha com disciplinas nas linhas (agrupadas por turma) e professores nas colunas; marcar a caixa atribui a disciplina ao professor (marcar outro transfere; desmarcar deixa sem professor). A atualização é otimista na tela.
- Turma e aulas semanais editáveis em linha; remoção da oferta.
- Cabeçalho de cada professor mostra `carga/máximo` com cor da situação; rodapé com totais.
- Botão "+ Adicionar disciplinas": modal com filtros por curso, período e busca (sem acento), seleção múltipla, aviso de "já ofertada" e campo de turma com sugestões das turmas existentes.
- Exportação CSV (separador `;`, BOM UTF-8): semestre, turma, curso, período, disciplina, aulas/semana e professor.

**Carga docente** (`/carga`)
- Cartão por professor com total de aulas, faixa, selo de situação, barra de progresso e lista das disciplinas atribuídas.
- Alerta de aulas sem professor.
- Tabela "Visão geral por semestre": carga de cada professor em todos os semestres cadastrados.

**Professores** (`/professores`)
- Tabela editável (nome, mínimo, máximo — salvos ao sair do campo) com a carga no semestre atual.
- Formulário de inclusão e exclusão com confirmação.

**Catálogo de disciplinas** (`/catalogo`)
- Disciplinas de cada curso por período, com CH, aulas semanais e selos "TCC/Extensão" e "personalizada".
- Formulário para incluir disciplina personalizada com prévia do cálculo de aulas; exclusão apenas das personalizadas.

## 5. Execução

Back-end (API + front compilado, se existir):

```bash
cd backend
npm install
npm start          # ou: npm run dev (reinicia ao alterar arquivos)
```

Front-end em desenvolvimento:

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173 (proxy /api → :3000)
```

Build para produção (servido pelo Express em `http://localhost:3000`):

```bash
cd frontend
npm run build
```

## 6. Observações

- O `frontend/index.html` orienta o usuário a usar `iniciar.bat` ou `npm start` na raiz do projeto, mas esses arquivos ainda não existem na raiz do repositório atual.
- Não há testes automatizados, autenticação nem controle de concorrência: o sistema assume um único usuário/instância gravando no arquivo JSON.
- Cursos não podem ser cadastrados pela interface; são definidos em `backend/models/seedData.js`.
