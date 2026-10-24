-- Script para criar o banco de dados e dados de exemplo

-- Criar banco de dados
CREATE DATABASE IF NOT EXISTS financas_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE financas_db;

-- A tabela será criada automaticamente pelo backend
-- Mas podemos inserir dados de exemplo após o backend criar a tabela

-- Exemplos de INSERT (execute após iniciar o backend pela primeira vez):
/*
INSERT INTO banks (nome, codigo, icone, saldo_inicial, ativo) VALUES
('Nubank', '260', 'nubank-icon', 1500.00, true),
('Itaú', '341', 'itau-icon', 5000.00, true),
('Bradesco', '237', 'bradesco-icon', 3200.00, true),
('Banco do Brasil', '001', 'bb-icon', 2800.00, true),
('Caixa Econômica', '104', 'caixa-icon', 1200.00, true),
('Inter', '077', 'inter-icon', 800.00, true),
('Santander', '033', 'santander-icon', 4500.00, true),
('Picpay', '', 'picpay-icon', 350.00, true);

INSERT INTO categories (nome, tipo, cor, ativo) VALUES
('Alimentação', 'DESPESA', '#F97316', true),
('Transporte', 'DESPESA', '#3B82F6', true),
('Salário', 'RECEITA', '#10B981', true),
('Investimentos', 'RECEITA', '#8B5CF6', true);
*/
