# Sistema de Finanças Pessoais

Aplicação web completa para gerenciamento financeiro pessoal, com dashboard analítico, cadastros auxiliares e gestão de transações.

## Visão Geral

O projeto está dividido em duas aplicações:

- `backend`: API REST em Node.js/Express com TypeScript e MySQL
- `frontend`: interface em Next.js (App Router) com TypeScript e Tailwind CSS

## Funcionalidades

- Dashboard executivo com indicadores financeiros
- Gráficos de evolução, saldo acumulado, categorias e distribuições (Pago e Provisão)
- CRUD de Bancos
- CRUD de Categorias
- CRUD de Descrições
- CRUD de Transações
- Filtros por mês, tipo, situação, banco, categoria e busca textual
- Ordenação em tabelas e paginação padronizada
- Resumo consolidado de transações via endpoint dedicado (`/api/transacoes/summary`)

## Tecnologias

### Backend

- Node.js
- Express
- TypeScript
- MySQL2
- Zod
- Swagger (OpenAPI)

### Frontend

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Recharts
- Axios
- lucide-react

## Estrutura do Projeto

```text
financas/
├─ backend/
│  ├─ src/
│  │  ├─ config/
│  │  ├─ controllers/
│  │  ├─ middlewares/
│  │  ├─ models/
│  │  ├─ repositories/
│  │  ├─ routes/
│  │  ├─ schemas/
│  │  ├─ services/
│  │  ├─ utils/
│  │  └─ server.ts
│  └─ .env.example
├─ frontend/
│  └─ src/
│     ├─ app/
│     ├─ components/
│     ├─ services/
│     └─ types/
├─ database.sql
└─ README.md
```

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

Frontend disponível em `http://localhost:3000`.

## Documentação da API

Com backend em execução:

- Swagger UI: `http://localhost:3001/api-docs`
- Health check: `http://localhost:3001/health`

## Scripts

### Backend (`backend/`)

- `npm run dev`: inicia em desenvolvimento
- `npm run build`: compila TypeScript
- `npm start`: executa build de produção

### Frontend (`frontend/`)

- `npm run dev`: inicia em desenvolvimento
- `npm run build`: build de produção
- `npm start`: executa build de produção
- `npm run lint`: análise estática

## Publicação no GitHub (repositório público)

Checklist recomendado:

- Confirmar que arquivos sensíveis não serão versionados (`.env`, `node_modules`, `dist`, `.next`)
- Revisar `.env.example` para conter apenas placeholders
- Validar build local de backend e frontend
- Atualizar README com instruções de setup

Comandos básicos:

```bash
git init
git branch -M main
git add .
git commit -m "chore: initial public release"
git remote add origin https://github.com/<usuario>/<repositorio>.git
git push -u origin main
```

## Licença

Este projeto está licenciado sob a licença MIT.
Consulte o arquivo `LICENSE` para mais detalhes.

## Governança do Repositório

- Diretrizes de contribuição: `CONTRIBUTING.md`
- Política de segurança: `SECURITY.md`
- Código de conduta: `CODE_OF_CONDUCT.md`
- Template de Pull Request: `.github/pull_request_template.md`
- Templates de Issues: `.github/ISSUE_TEMPLATE/`
