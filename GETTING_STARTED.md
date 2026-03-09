# 🚀 Guia de Inicialização Rápida

## ⚙️ Configuração do MySQL

### Opção 1: MySQL sem senha (desenvolvimento local)

Se o seu MySQL não tem senha:

1. Abra o arquivo `backend/.env`
2. Certifique-se que está assim:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=financas_db
```

### Opção 2: MySQL com senha

Se o seu MySQL tem senha:

1. Abra o arquivo `backend/.env`
2. Adicione sua senha:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha_aqui
DB_NAME=financas_db
```

### Criar o Banco de Dados

Abra o MySQL e execute:

```sql
CREATE DATABASE financas_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**Importante:** As tabelas serão criadas automaticamente quando você iniciar o backend pela primeira vez!

## 🎯 Iniciar a Aplicação

### 1. Iniciar Backend (Terminal 1)

```bash
cd backend
npm run dev
```

Aguarde até ver:

```
✅ Conexão com MySQL estabelecida com sucesso!
✅ Tabelas criadas/verificadas com sucesso!
🚀 Servidor rodando na porta 3001
📝 Documentação Swagger: http://localhost:3001/api-docs
```

### 2. Iniciar Frontend (Terminal 2)

```bash
cd frontend
npm run dev
```

Aguarde até ver:

```
- ready started server on 0.0.0.0:3000
```

### 3. Acessar a Aplicação

- **Frontend**: http://localhost:3000
- **API Swagger**: http://localhost:3001/api-docs
- **Health Check**: http://localhost:3001/health

## 🧪 Testar a API

### Via Swagger (Recomendado)

1. Acesse http://localhost:3001/api-docs
2. Clique em **POST /api/banks**
3. Clique em **Try it out**
4. Use este exemplo:

```json
{
  "nome": "Nubank",
  "codigo": "260",
  "cor": "#8B10AE",
  "saldo_inicial": 1500.0,
  "ativo": true
}
```

5. Clique em **Execute**

### Via cURL

```bash
# Criar banco
curl -X POST http://localhost:3001/api/banks \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Nubank",
    "codigo": "260",
    "cor": "#8B10AE",
    "saldo_inicial": 1500.00,
    "ativo": true
  }'

# Listar bancos
curl http://localhost:3001/api/banks

# Buscar banco por ID
curl http://localhost:3001/api/banks/1

# Atualizar banco
curl -X PUT http://localhost:3001/api/banks/1 \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Nubank Atualizado",
    "saldo_inicial": 2000.00
  }'

# Deletar banco
curl -X DELETE http://localhost:3001/api/banks/1
```

## 📊 Inserir Dados de Exemplo

Após iniciar o backend, você pode inserir dados de exemplo via SQL:

```sql
USE financas_db;

INSERT INTO banks (nome, codigo, cor, icone, saldo_inicial, ativo) VALUES
('Nubank', '260', '#8B10AE', 'nubank-icon', 1500.00, true),
('Itaú', '341', '#FF6600', 'itau-icon', 5000.00, true),
('Bradesco', '237', '#CC092F', 'bradesco-icon', 3200.00, true),
('Banco do Brasil', '001', '#FFDD00', 'bb-icon', 2800.00, true),
('Caixa Econômica', '104', '#0066B3', 'caixa-icon', 1200.00, true);
```

Ou use o frontend para criar os bancos visualmente! 🎨

## ❌ Problemas Comuns

### "Access denied for user 'root'@'localhost'"

- Verifique a senha do MySQL no arquivo `backend/.env`
- Ou crie um usuário específico para a aplicação

### "connect ECONNREFUSED"

- Verifique se o MySQL está rodando
- Windows: `services.msc` → procure por MySQL
- Ou instale o MySQL: https://dev.mysql.com/downloads/installer/

### "Port 3001 already in use"

- Outra aplicação está usando a porta
- Altere a porta no `backend/.env`: `PORT=3002`

### Frontend não conecta na API

- Certifique-se que o backend está rodando
- Verifique o arquivo `frontend/.env.local`

## 🎉 Pronto!

Agora você tem:

- ✅ Backend API REST rodando
- ✅ Frontend Next.js rodando
- ✅ Swagger UI para testar a API
- ✅ CRUD completo de Bancos funcionando

Acesse http://localhost:3000 e comece a gerenciar seus bancos! 🏦
