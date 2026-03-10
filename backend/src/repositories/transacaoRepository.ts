import pool from "../config/database";
import { RowDataPacket } from "mysql2";
import { Transacao, TransacaoComDetalhes } from "../models/Transacao";
import { transacaoFiltersSchema } from "../schemas/transacaoSchema";

interface TransacaoFilters {
  page?: number;
  limit?: number;
  search?: string;
  tipo?: "DESPESA" | "RECEITA";
  categoria_id?: number;
  banco_id?: number;
  situacao?: "PENDENTE" | "PAGO";
  mes?: string;
  ano?: string;
}

export class TransacaoRepository {
  async findByMes(
    mes: string,
  ): Promise<Omit<Transacao, "created_at" | "updated_at">[]> {
    const query = `
      SELECT
        id, mes, vencimento, tipo, categoria_id,
        descricao_id, banco_id, situacao, valor
      FROM transacoes
      WHERE mes = ?
      ORDER BY STR_TO_DATE(vencimento, '%d/%m/%Y') ASC, id ASC
    `;

    const [rows] = await pool.query<RowDataPacket[]>(query, [mes]);
    return rows as Omit<Transacao, "created_at" | "updated_at">[];
  }

  async createMany(
    records: Omit<Transacao, "id" | "created_at" | "updated_at">[],
  ): Promise<number> {
    if (records.length === 0) return 0;

    const values = records.map((record) => [
      record.mes,
      record.vencimento,
      record.tipo,
      record.categoria_id,
      record.descricao_id,
      record.banco_id,
      record.situacao,
      record.valor,
    ]);

    const query = `
      INSERT INTO transacoes
      (mes, vencimento, tipo, categoria_id, descricao_id, banco_id, situacao, valor)
      VALUES ?
    `;

    const [result] = await pool.query(query, [values]);
    const insertResult = result as { affectedRows: number };
    return insertResult.affectedRows || 0;
  }

  async findAll(
    filters: TransacaoFilters,
  ): Promise<{ transacoes: TransacaoComDetalhes[]; total: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        t.id, t.mes, t.vencimento, t.tipo, t.categoria_id, 
        t.descricao_id, t.banco_id, t.situacao, t.valor,
        t.created_at, t.updated_at,
        c.nome AS categoria_nome,
        d.nome AS descricao_nome,
        b.nome AS banco_nome
      FROM transacoes t
      LEFT JOIN categories c ON t.categoria_id = c.id
      LEFT JOIN descricoes d ON t.descricao_id = d.id
      LEFT JOIN banks b ON t.banco_id = b.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (filters.search) {
      query += ` AND (c.nome LIKE ? OR d.nome LIKE ? OR b.nome LIKE ?)`;
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (filters.tipo) {
      query += ` AND t.tipo = ?`;
      params.push(filters.tipo);
    }

    if (filters.categoria_id) {
      query += ` AND t.categoria_id = ?`;
      params.push(filters.categoria_id);
    }

    if (filters.banco_id) {
      query += ` AND t.banco_id = ?`;
      params.push(filters.banco_id);
    }

    if (filters.situacao) {
      query += ` AND t.situacao = ?`;
      params.push(filters.situacao);
    }

    if (filters.mes) {
      query += ` AND t.mes = ?`;
      params.push(filters.mes);
    } else if (filters.ano) {
      query += ` AND RIGHT(t.mes, 4) = ?`;
      params.push(filters.ano);
    }

    // Count total
    const countQuery = query.replace(
      /SELECT[\s\S]*?FROM/,
      "SELECT COUNT(*) as total FROM",
    );
    const [countResult] = await pool.query<RowDataPacket[]>(countQuery, params);
    const total = countResult[0].total;

    // Get paginated results
    query += `
      ORDER BY
        STR_TO_DATE(CONCAT('01/', t.mes), '%d/%m/%Y') ASC,
        STR_TO_DATE(t.vencimento, '%d/%m/%Y') ASC,
        t.id ASC
      LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    return { transacoes: rows as TransacaoComDetalhes[], total };
  }

  async findById(id: number): Promise<TransacaoComDetalhes | null> {
    const query = `
      SELECT 
        t.id, t.mes, t.vencimento, t.tipo, t.categoria_id, 
        t.descricao_id, t.banco_id, t.situacao, t.valor,
        t.created_at, t.updated_at,
        c.nome AS categoria_nome,
        d.nome AS descricao_nome,
        b.nome AS banco_nome
      FROM transacoes t
      LEFT JOIN categories c ON t.categoria_id = c.id
      LEFT JOIN descricoes d ON t.descricao_id = d.id
      LEFT JOIN banks b ON t.banco_id = b.id
      WHERE t.id = ?
    `;
    const [rows] = await pool.query<RowDataPacket[]>(query, [id]);
    return (rows as TransacaoComDetalhes[])[0] || null;
  }

  async create(data: Omit<Transacao, "id" | "created_at" | "updated_at">) {
    const {
      mes,
      vencimento,
      tipo,
      categoria_id,
      descricao_id,
      banco_id,
      situacao,
      valor,
    } = data;

    const query = `
      INSERT INTO transacoes 
      (mes, vencimento, tipo, categoria_id, descricao_id, banco_id, situacao, valor)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(query, [
      mes,
      vencimento,
      tipo,
      categoria_id,
      descricao_id,
      banco_id,
      situacao,
      valor,
    ]);

    const insertResult = result as any;
    return this.findById(insertResult.insertId);
  }

  async update(id: number, data: Partial<Omit<Transacao, "id">>) {
    const allowedFields = [
      "mes",
      "vencimento",
      "tipo",
      "categoria_id",
      "descricao_id",
      "banco_id",
      "situacao",
      "valor",
    ];

    const updates: string[] = [];
    const values: any[] = [];

    Object.entries(data).forEach(([key, value]) => {
      if (allowedFields.includes(key) && value !== undefined) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (updates.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    const query = `UPDATE transacoes SET ${updates.join(", ")} WHERE id = ?`;
    await pool.query(query, values);

    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const [result] = await pool.query("DELETE FROM transacoes WHERE id = ?", [
      id,
    ]);
    const deleteResult = result as any;
    return deleteResult.affectedRows > 0;
  }

  async deleteByMeses(meses: string[]): Promise<number> {
    if (meses.length === 0) return 0;

    const placeholders = meses.map(() => "?").join(", ");
    const query = `DELETE FROM transacoes WHERE mes IN (${placeholders})`;
    const [result] = await pool.query(query, meses);
    const deleteResult = result as { affectedRows: number };
    return deleteResult.affectedRows || 0;
  }

  async exists(id: number): Promise<boolean> {
    const [rows] = await pool.query("SELECT 1 FROM transacoes WHERE id = ?", [
      id,
    ]);
    return (rows as any[]).length > 0;
  }

  async getSummary(filters: Omit<TransacaoFilters, "page" | "limit"> = {}) {
    let query = `
      SELECT 
        COALESCE(SUM(CASE WHEN t.situacao = 'PAGO' THEN t.valor ELSE 0 END), 0) as total_pago,
        COALESCE(SUM(CASE WHEN t.situacao = 'PENDENTE' THEN t.valor ELSE 0 END), 0) as total_pendente,
        COUNT(*) as total_registros,
        COALESCE(SUM(CASE WHEN t.tipo = 'RECEITA' THEN t.valor ELSE 0 END), 0) as total_receita,
        COALESCE(SUM(CASE WHEN t.tipo = 'DESPESA' THEN t.valor ELSE 0 END), 0) as total_despesa,
        COALESCE(SUM(CASE WHEN t.tipo = 'RECEITA' THEN t.valor ELSE 0 END), 0) - COALESCE(SUM(CASE WHEN t.tipo = 'DESPESA' THEN t.valor ELSE 0 END), 0) as total_liquido,
        COALESCE(SUM(CASE WHEN t.situacao = 'PAGO' AND t.tipo = 'RECEITA' THEN t.valor ELSE 0 END), 0) as pago_receita,
        COALESCE(SUM(CASE WHEN t.situacao = 'PAGO' AND t.tipo = 'DESPESA' THEN t.valor ELSE 0 END), 0) as pago_despesa,
        COALESCE(SUM(CASE WHEN t.situacao = 'PAGO' AND t.tipo = 'RECEITA' THEN t.valor ELSE 0 END), 0) - COALESCE(SUM(CASE WHEN t.situacao = 'PAGO' AND t.tipo = 'DESPESA' THEN t.valor ELSE 0 END), 0) as pago_liquido,
        COALESCE(SUM(CASE WHEN t.situacao = 'PENDENTE' AND t.tipo = 'RECEITA' THEN t.valor ELSE 0 END), 0) as provisao_receita,
        COALESCE(SUM(CASE WHEN t.situacao = 'PENDENTE' AND t.tipo = 'DESPESA' THEN t.valor ELSE 0 END), 0) as provisao_despesa,
        COALESCE(SUM(CASE WHEN t.situacao = 'PENDENTE' AND t.tipo = 'RECEITA' THEN t.valor ELSE 0 END), 0) - COALESCE(SUM(CASE WHEN t.situacao = 'PENDENTE' AND t.tipo = 'DESPESA' THEN t.valor ELSE 0 END), 0) as provisao_liquido
      FROM transacoes t
      LEFT JOIN categories c ON t.categoria_id = c.id
      LEFT JOIN descricoes d ON t.descricao_id = d.id
      LEFT JOIN banks b ON t.banco_id = b.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (filters.search) {
      query += ` AND (c.nome LIKE ? OR d.nome LIKE ? OR b.nome LIKE ?)`;
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (filters.tipo) {
      query += ` AND t.tipo = ?`;
      params.push(filters.tipo);
    }

    if (filters.categoria_id) {
      query += ` AND t.categoria_id = ?`;
      params.push(filters.categoria_id);
    }

    if (filters.banco_id) {
      query += ` AND t.banco_id = ?`;
      params.push(filters.banco_id);
    }

    if (filters.situacao) {
      query += ` AND t.situacao = ?`;
      params.push(filters.situacao);
    }

    if (filters.mes) {
      query += ` AND t.mes = ?`;
      params.push(filters.mes);
    } else if (filters.ano) {
      query += ` AND RIGHT(t.mes, 4) = ?`;
      params.push(filters.ano);
    }

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    return (rows as any[])[0];
  }
}
