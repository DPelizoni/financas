import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "financas_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Testa a conexão
export const testConnection = async (): Promise<void> => {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Conexão com MySQL estabelecida com sucesso!");
    connection.release();
  } catch (error) {
    console.error("❌ Erro ao conectar com MySQL:", error);
    throw error;
  }
};

// Inicializa o banco de dados
export const initDatabase = async (): Promise<void> => {
  try {
    const connection = await pool.getConnection();

    // Cria a tabela de usuários
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        nome VARCHAR(120) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        senha VARCHAR(255) NOT NULL,
        status ENUM('ATIVO', 'INATIVO') DEFAULT 'ATIVO',
        role ENUM('USUARIO', 'GESTOR', 'ADMIN') NOT NULL DEFAULT 'USUARIO',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_users_email (email),
        INDEX idx_users_status (status),
        INDEX idx_users_role (role)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    try {
      await connection.query(`
        ALTER TABLE users
        ADD COLUMN role ENUM('USUARIO', 'GESTOR', 'ADMIN') NOT NULL DEFAULT 'USUARIO' AFTER status;
      `);
    } catch {
      // Ignora quando a coluna role ja existe.
    }

    const managerEmailsRaw =
      process.env.MANAGER_EMAILS || "gestor_admin@example.com";
    const adminEmailsRaw = process.env.ADMIN_EMAILS || "";
    const managerEmails = managerEmailsRaw
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter((email) => email.length > 0);
    const adminEmails = adminEmailsRaw
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter((email) => email.length > 0);

    if (adminEmails.length > 0) {
      const adminPlaceholders = adminEmails.map(() => "?").join(",");
      await connection.query(
        `UPDATE users SET role = 'ADMIN' WHERE LOWER(email) IN (${adminPlaceholders})`,
        adminEmails,
      );
    }

    if (managerEmails.length > 0) {
      const placeholders = managerEmails.map(() => "?").join(",");
      await connection.query(
        `UPDATE users SET role = 'GESTOR' WHERE LOWER(email) IN (${placeholders}) AND role <> 'ADMIN'`,
        managerEmails,
      );
    }

    // Cria a tabela de bancos
    await connection.query(`
      CREATE TABLE IF NOT EXISTS banks (
        id INT PRIMARY KEY AUTO_INCREMENT,
        nome VARCHAR(100) NOT NULL,
        codigo VARCHAR(10),
        cor VARCHAR(7) DEFAULT '#3B82F6',
        icone VARCHAR(100),
        saldo_inicial DECIMAL(15, 2) DEFAULT 0.00,
        ativo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_nome (nome),
        INDEX idx_ativo (ativo)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Cria a tabela de categorias
    await connection.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT PRIMARY KEY AUTO_INCREMENT,
        nome VARCHAR(100) NOT NULL,
        tipo ENUM('RECEITA', 'DESPESA') NOT NULL,
        cor VARCHAR(7) DEFAULT '#0EA5E9',
        bank_id INT NULL,
        ativo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_category_nome (nome),
        INDEX idx_category_tipo (tipo),
        INDEX idx_category_ativo (ativo)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Compatibilidade com versões anteriores que exigiam vínculo obrigatório com banco
    try {
      await connection.query(`
        ALTER TABLE categories
        MODIFY COLUMN bank_id INT NULL;
      `);
    } catch {
      // Ignora quando a coluna não existe
    }

    try {
      await connection.query(`
        ALTER TABLE categories
        DROP COLUMN icone;
      `);
    } catch {
      // Ignora quando a coluna não existe (instalações novas ou migração já aplicada)
    }

    try {
      await connection.query(`
        ALTER TABLE categories
        DROP FOREIGN KEY fk_category_bank;
      `);
    } catch {
      // Ignora quando a FK não existe (instalações novas ou migração já aplicada)
    }

    try {
      await connection.query(`
        ALTER TABLE categories
        DROP COLUMN bank_id;
      `);
    } catch {
      // Ignora quando a coluna não existe (instalações novas ou migração já aplicada)
    }

    // Cria a tabela de descrições
    await connection.query(`
      CREATE TABLE IF NOT EXISTS descricoes (
        id INT PRIMARY KEY AUTO_INCREMENT,
        nome VARCHAR(100) NOT NULL,
        categoria_id INT NOT NULL,
        ativo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (categoria_id) REFERENCES categories(id) ON DELETE CASCADE,
        INDEX idx_descricao_nome (nome),
        INDEX idx_descricao_categoria (categoria_id),
        INDEX idx_descricao_ativo (ativo)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Cria a tabela de transações
    await connection.query(`
      CREATE TABLE IF NOT EXISTS transacoes (
        id INT PRIMARY KEY AUTO_INCREMENT,
        mes VARCHAR(7) NOT NULL,
        vencimento VARCHAR(10) NOT NULL,
        tipo ENUM('DESPESA', 'RECEITA') NOT NULL,
        categoria_id INT NOT NULL,
        descricao_id INT NOT NULL,
        banco_id INT NOT NULL,
        situacao ENUM('PENDENTE', 'PAGO') DEFAULT 'PENDENTE',
        valor DECIMAL(15, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (categoria_id) REFERENCES categories(id) ON DELETE RESTRICT,
        FOREIGN KEY (descricao_id) REFERENCES descricoes(id) ON DELETE RESTRICT,
        FOREIGN KEY (banco_id) REFERENCES banks(id) ON DELETE RESTRICT,
        INDEX idx_transacao_mes (mes),
        INDEX idx_transacao_vencimento (vencimento),
        INDEX idx_transacao_tipo (tipo),
        INDEX idx_transacao_categoria (categoria_id),
        INDEX idx_transacao_descricao (descricao_id),
        INDEX idx_transacao_banco (banco_id),
        INDEX idx_transacao_situacao (situacao)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Cria a tabela de ativos de investimento
    await connection.query(`
      CREATE TABLE IF NOT EXISTS investimento_ativos (
        id INT PRIMARY KEY AUTO_INCREMENT,
        nome VARCHAR(120) NOT NULL,
        banco_id INT NOT NULL,
        saldo_inicial DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        data_saldo_inicial DATE NOT NULL,
        ativo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (banco_id) REFERENCES banks(id) ON DELETE RESTRICT,
        INDEX idx_investimento_ativo_nome (nome),
        INDEX idx_investimento_ativo_banco (banco_id),
        INDEX idx_investimento_ativo_status (ativo)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Cria a tabela de movimentacoes de investimento
    await connection.query(`
      CREATE TABLE IF NOT EXISTS investimento_movimentacoes (
        id INT PRIMARY KEY AUTO_INCREMENT,
        investimento_ativo_id INT NOT NULL,
        tipo ENUM('APORTE', 'RESGATE', 'RENDIMENTO') NOT NULL,
        data DATE NOT NULL,
        valor DECIMAL(15, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (investimento_ativo_id) REFERENCES investimento_ativos(id) ON DELETE RESTRICT,
        INDEX idx_investimento_mov_ativo (investimento_ativo_id),
        INDEX idx_investimento_mov_tipo (tipo),
        INDEX idx_investimento_mov_data (data)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log("✅ Tabelas criadas/verificadas com sucesso!");
    connection.release();
  } catch (error) {
    console.error("❌ Erro ao inicializar banco de dados:", error);
    throw error;
  }
};

export default pool;
