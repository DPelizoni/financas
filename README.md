# Sistema de Finanças Pessoais

Aplicação web completa e moderna para gerenciamento financeiro pessoal e controle de investimentos, com dashboards analíticos, gestão de usuários e fluxos operacionais otimizados.

## Visão Geral

O projeto é uma solução full-stack projetada para oferecer visibilidade total sobre a saúde financeira e evolução patrimonial:

- `backend`: API REST robusta em Node.js/Express com TypeScript, MySQL e testes automatizados.
- `frontend`: Interface rica e responsiva em Next.js 14 (App Router), utilizando Material UI (MUI) para componentes complexos e Tailwind CSS para estilização personalizada.

## Funcionalidades Principais

### 📊 Dashboards Analíticos
- **Financeiro Executivo:** Indicadores de Receitas, Despesas, Provisões e Saldo Real vs. Previsto.
- **Investimentos:** Visão consolidada da carteira, evolução do patrimônio no tempo, e análise mensal de movimentações (Aporte, Resgate, Rendimento).

### 💰 Gestão de Finanças (Transações)
- CRUD completo de Bancos, Categorias e Descrições.
- Gestão de Transações com filtros avançados (mês, tipo, situação, banco, categoria).
- **Ações em Lote:** Copiar transações de um mês para múltiplos períodos e exclusão em massa.
- Resumo consolidado de transações em tempo real.

### 📈 Gestão de Investimentos
- **Carteira de Ativos:** Cadastro e monitoramento de ativos financeiros vinculados a instituições.
- **Movimentações:** Registro histórico de aportes, resgates e rendimentos com impacto automático no saldo acumulado.
- **Evolução Patrimonial:** Gráfico histórico que reconstrói o saldo mês a mês, respeitando a data inicial de cada investimento.

### 🔐 Segurança e UX
- **Autenticação:** Sistema de Login e Registro com JWT e proteção de rotas.
- **Interface Polida:** Modal de visualização de detalhes rico em informações, com ícones semânticos, cores contextuais e função de cópia rápida.
- **Modo Dark/Light:** Suporte completo a temas claro e escuro.

## Tecnologias

### Backend
- Node.js & Express
- TypeScript
- MySQL2 (com pool de conexões)
- Zod (validação de schemas)
- Swagger (Documentação OpenAPI)
- Custom Test Runner (200+ testes automatizados)

### Frontend
- Next.js 14 (App Router)
- React 18
- Material UI (MUI) & Tailwind CSS
- Recharts (Gráficos interativos)
- Lucide React (Iconografia)
- Axios (Interceptores de autenticação)

## Estrutura do Projeto

```text
financas/
├─ backend/
│  ├─ src/
│  │  ├─ controllers/     # Orquestração de requisições
│  │  ├─ services/        # Regras de negócio e lógica complexa
│  │  ├─ repositories/    # Acesso a dados (SQL)
│  │  ├─ models/          # Definições de tipos e DB
│  │  ├─ tests/           # Suíte de testes (Integração e Unitários)
│  │  └─ server.ts
├─ frontend/
│  ├─ src/
│  │  ├─ app/             # Rotas e Páginas (Next.js)
│  │  ├─ components/      # Componentes UI reutilizáveis
│  │  ├─ services/        # Integração com API
│  │  └─ theme/           # Configuração de temas (MUI/Tailwind)
├─ docker-compose.yml     # Orquestração do ambiente
└─ database.sql           # Schema inicial do banco
```

## Configuração Local

### 1. Banco de dados
Crie o banco no MySQL:
```sql
CREATE DATABASE financas_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```
API disponível em `http://localhost:3001` e Documentação em `/api-docs`.

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend disponível em `http://localhost:3000`.

## Execução com Docker

Na raiz do projeto:
```bash
docker compose up -d --build
```
- **Frontend:** `http://localhost:3000`
- **Backend:** `http://localhost:3001`
- **Swagger:** `http://localhost:3001/api-docs`

## Scripts Disponíveis

### Backend (`backend/`)
- `npm run test`: Executa os 200+ testes automatizados.
- `npm run build`: Compila o projeto para produção.
- `npm run test:coverage`: Gera relatório de cobertura de código.

### Frontend (`frontend/`)
- `npm run lint`: Verifica padrões de código e tipos.
- `npm run build`: Gera o build otimizado do Next.js.

## Pré-requisitos

- Node.js 18+
- npm 9+
- MySQL 8+

## Configuração Local

### 1. Banco de dados

Crie o banco no MySQL:

```sql
CREATE DATABASE financas_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Backend

```bash
cd backend
npm install
```

Crie o arquivo de ambiente com base no exemplo:

```bash
cp .env.example .env
```

No Windows (PowerShell):

```powershell
Copy-Item .env.example .env
```

Ajuste o arquivo `.env` conforme seu MySQL:

```env
PORT=3001
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=financas_db
```

Inicie o backend:

```bash
npm run dev
```

API disponível em `http://localhost:3001`.

### 3. Frontend

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

Se quiser definir a URL da API explicitamente:

```env
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Frontend disponível em `http://localhost:3000`.

## Execução com Docker

O projeto possui containerização individual (`frontend` e `backend`) e orquestração via Docker Compose, com volume persistente para MySQL.

### Serviços

- `db` (MySQL 8)
- `backend` (Node.js/Express)
- `frontend` (Next.js)

### Subir ambiente completo

Na raiz do projeto:

```bash
docker compose up -d --build
```

### Endpoints após subir os containers

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`
- Swagger: `http://localhost:3001/api-docs`
- Health: `http://localhost:3001/health`

### Banco de dados (host)

Para evitar conflito com MySQL local, o container publica:

- Host: `localhost`
- Porta: `3307`
- Banco: `financas_db`
- Usuário: `root`
- Senha: `root`

Os dados do banco ficam persistidos no volume Docker `mysql_data`.

### Parar ambiente

```bash
docker compose down
```

Para remover também o volume de dados:

```bash
docker compose down -v
```

## Documentação da API

Com backend em execução:

- Swagger UI: `http://localhost:3001/api-docs`
- Health check: `http://localhost:3001/health`
- Raiz da API: `http://localhost:3001/`

## Scripts

### Backend (`backend/`)

- `npm run dev`: inicia em desenvolvimento
- `npm run build`: compila TypeScript
- `npm start`: executa build de produção
- `npm run test`: executa os testes automatizados do backend
- `npm run test:coverage`: executa testes com relatório e validação mínima de cobertura

### Frontend (`frontend/`)

- `npm run dev`: inicia em desenvolvimento
- `npm run build`: build de produção
- `npm start`: executa build de produção
- `npm run lint`: análise estática

## Licença

Este projeto está licenciado sob a licença MIT.
Consulte o arquivo `LICENSE` para mais detalhes.

## Governança do Repositório

- Diretrizes de contribuição: `CONTRIBUTING.md`
- Política de segurança: `SECURITY.md`
- Código de conduta: `CODE_OF_CONDUCT.md`
- Template de Pull Request: `.github/pull_request_template.md`
- Templates de Issues: `.github/ISSUE_TEMPLATE/`
