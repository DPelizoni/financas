import { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "../config/database";
import {
  InvestimentoDashboardFilters,
  InvestimentoMovimentacao,
  InvestimentoMovimentacaoFilters,
  InvestimentoMovimentacaoInput,
} from "../models/Investimento";

export class InvestimentoMovimentacaoRepository {
  /**
   * Constrói a cláusula WHERE baseada nos filtros fornecidos
   */
  private buildBaseFilters(
    filters: {
      search?: string;
      investimento_ativo_id?: number;
      banco_id?: number;
      ativo?: boolean;
      tipo?: string;
      data_de?: string;
      data_ate?: string;
    },
    params: Array<string | number | boolean>,
  ): string {
    let whereClause = "WHERE 1=1";

    if (filters.search) {
      whereClause += " AND (ia.nome LIKE ? OR b.nome LIKE ?)";
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (filters.investimento_ativo_id) {
      whereClause += " AND im.investimento_ativo_id = ?";
      params.push(filters.investimento_ativo_id);
    }

    if (filters.banco_id) {
      whereClause += " AND ia.banco_id = ?";
      params.push(filters.banco_id);
    }

    if (filters.ativo !== undefined) {
      whereClause += " AND ia.ativo = ?";
      params.push(filters.ativo);
    }

    if (filters.tipo) {
      whereClause += " AND im.tipo = ?";
      params.push(filters.tipo);
    }

    if (filters.data_de) {
      whereClause += " AND im.data >= ?";
      params.push(filters.data_de);
    }

    if (filters.data_ate) {
      whereClause += " AND im.data <= ?";
      params.push(filters.data_ate);
    }

    return whereClause;
  }

  /**
   * Lista todas as movimentações de investimento com filtros e paginação
   */
  async findAll(
    filters: InvestimentoMovimentacaoFilters,
  ): Promise<{ movimentacoes: InvestimentoMovimentacao[]; total: number }> {
    const { page = 1, limit = 10 } = filters;
    const offset = (page - 1) * limit;

    const fromClause = `
      FROM investimento_movimentacoes im
      INNER JOIN investimento_ativos ia ON ia.id = im.investimento_ativo_id
      LEFT JOIN banks b ON b.id = ia.banco_id
    `;

    const params: Array<string | number | boolean> = [];
    const whereClause = this.buildBaseFilters(filters, params);

    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total ${fromClause} ${whereClause}`,
      params,
    );
    const total = Number(countRows[0].total || 0);

    const [rows] = await pool.query<RowDataPacket[]>(
      `
        SELECT
          im.id,
          im.investimento_ativo_id,
          ia.nome AS ativo_nome,
          ia.ativo AS ativo_status,
          ia.banco_id,
          b.nome AS banco_nome,
          im.tipo,
          DATE_FORMAT(im.data, '%Y-%m-%d') AS data,
          im.valor,
          im.created_at,
          im.updated_at
        ${fromClause}
        ${whereClause}
        ORDER BY im.data DESC, im.id DESC
        LIMIT ? OFFSET ?
      `,
      [...params, limit, offset],
    );

    return { movimentacoes: rows as InvestimentoMovimentacao[], total };
  }

  /**
   * Busca uma movimentação de investimento por ID
   */
  async findById(id: number): Promise<InvestimentoMovimentacao | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `
        SELECT
          im.id,
          im.investimento_ativo_id,
          ia.nome AS ativo_nome,
          ia.ativo AS ativo_status,
          ia.banco_id,
          b.nome AS banco_nome,
          im.tipo,
          DATE_FORMAT(im.data, '%Y-%m-%d') AS data,
          im.valor,
          im.created_at,
          im.updated_at
        FROM investimento_movimentacoes im
        INNER JOIN investimento_ativos ia ON ia.id = im.investimento_ativo_id
        LEFT JOIN banks b ON b.id = ia.banco_id
        WHERE im.id = ?
      `,
      [id],
    );

    return rows.length > 0 ? (rows[0] as InvestimentoMovimentacao) : null;
  }

  /**
   * Cria uma nova movimentação de investimento
   */
  async create(
    input: InvestimentoMovimentacaoInput,
  ): Promise<InvestimentoMovimentacao> {
    const [result] = await pool.query<ResultSetHeader>(
      `
        INSERT INTO investimento_movimentacoes
          (investimento_ativo_id, tipo, data, valor)
        VALUES (?, ?, ?, ?)
      `,
      [input.investimento_ativo_id, input.tipo, input.data, input.valor],
    );

    const created = await this.findById(result.insertId);
    if (!created) {
      throw new Error("Erro ao criar movimentacao de investimento");
    }

    return created;
  }

  /**
   * Atualiza uma movimentação de investimento de forma dinâmica
   */
  async update(
    id: number,
    input: Partial<InvestimentoMovimentacaoInput>,
  ): Promise<InvestimentoMovimentacao | null> {
    const fields: string[] = [];
    const values: Array<string | number> = [];

    const allowedFields: (keyof InvestimentoMovimentacaoInput)[] = [
      "investimento_ativo_id",
      "tipo",
      "data",
      "valor",
    ];

    allowedFields.forEach((field) => {
      if (input[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(input[field] as any);
      }
    });

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    await pool.query(
      `UPDATE investimento_movimentacoes SET ${fields.join(", ")} WHERE id = ?`,
      values,
    );

    return this.findById(id);
  }

  /**
   * Exclui uma movimentação de investimento
   */
  async delete(id: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
      "DELETE FROM investimento_movimentacoes WHERE id = ?",
      [id],
    );
    return result.affectedRows > 0;
  }

  /**
   * Verifica se uma movimentação de investimento existe por ID
   */
  async exists(id: number): Promise<boolean> {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT 1 FROM investimento_movimentacoes WHERE id = ?",
      [id],
    );
    return rows.length > 0;
  }

  /**
   * Obtém resumo das movimentações para o dashboard
   */
  async getSummary(
    filters: InvestimentoDashboardFilters,
  ): Promise<{
    aporte: number;
    resgate: number;
    rendimentos: number;
    liquido: number;
  }> {
    const fromClause = `
      FROM investimento_movimentacoes im
      INNER JOIN investimento_ativos ia ON ia.id = im.investimento_ativo_id
      LEFT JOIN banks b ON b.id = ia.banco_id
    `;

    const params: Array<string | number | boolean> = [];
    const whereClause = this.buildBaseFilters(
      {
        banco_id: filters.banco_id,
        ativo: filters.ativo,
        data_de: filters.data_de,
        data_ate: filters.data_ate,
      },
      params,
    );

    const [rows] = await pool.query<RowDataPacket[]>(
      `
        SELECT
          COALESCE(SUM(CASE WHEN im.tipo = 'APORTE' THEN im.valor ELSE 0 END), 0) AS aporte,
          COALESCE(SUM(CASE WHEN im.tipo = 'RESGATE' THEN im.valor ELSE 0 END), 0) AS resgate,
          COALESCE(SUM(CASE WHEN im.tipo = 'RENDIMENTO' THEN im.valor ELSE 0 END), 0) AS rendimentos
        ${fromClause}
        ${whereClause}
      `,
      params,
    );

    const aporte = Number(rows[0]?.aporte || 0);
    const resgate = Number(rows[0]?.resgate || 0);
    const rendimentos = Number(rows[0]?.rendimentos || 0);

    return {
      aporte,
      resgate,
      rendimentos,
      liquido: aporte + rendimentos - resgate,
    };
  }

  /**
   * Obtém a linha do tempo das movimentações
   */
  async getTimeline(
    filters: InvestimentoDashboardFilters,
  ): Promise<
    Array<{
      month_key: string;
      aporte: number;
      resgate: number;
      rendimentos: number;
    }>
  > {
    const fromClause = `
      FROM investimento_movimentacoes im
      INNER JOIN investimento_ativos ia ON ia.id = im.investimento_ativo_id
      LEFT JOIN banks b ON b.id = ia.banco_id
    `;

    const params: Array<string | number | boolean> = [];
    const whereClause = this.buildBaseFilters(
      {
        banco_id: filters.banco_id,
        ativo: filters.ativo,
        data_de: filters.data_de,
        data_ate: filters.data_ate,
      },
      params,
    );

    const [rows] = await pool.query<RowDataPacket[]>(
      `
        SELECT
          DATE_FORMAT(im.data, '%Y-%m') AS month_key,
          COALESCE(SUM(CASE WHEN im.tipo = 'APORTE' THEN im.valor ELSE 0 END), 0) AS aporte,
          COALESCE(SUM(CASE WHEN im.tipo = 'RESGATE' THEN im.valor ELSE 0 END), 0) AS resgate,
          COALESCE(SUM(CASE WHEN im.tipo = 'RENDIMENTO' THEN im.valor ELSE 0 END), 0) AS rendimentos
        ${fromClause}
        ${whereClause}
        GROUP BY DATE_FORMAT(im.data, '%Y-%m')
        ORDER BY month_key ASC
      `,
      params,
    );

    return rows.map((row) => ({
      month_key: String(row.month_key || ""),
      aporte: Number(row.aporte || 0),
      resgate: Number(row.resgate || 0),
      rendimentos: Number(row.rendimentos || 0),
    }));
  }

  /**
   * Obtém os anos disponíveis com base nas movimentações
   */
  async getAvailableYears(filters: {
    banco_id?: number;
    ativo?: boolean;
  }): Promise<string[]> {
    const fromClause = `
      FROM investimento_movimentacoes im
      INNER JOIN investimento_ativos ia ON ia.id = im.investimento_ativo_id
      LEFT JOIN banks b ON b.id = ia.banco_id
    `;

    const params: Array<string | number | boolean> = [];
    const whereClause = this.buildBaseFilters(
      {
        banco_id: filters.banco_id,
        ativo: filters.ativo,
      },
      params,
    );

    const [rows] = await pool.query<RowDataPacket[]>(
      `
        SELECT DISTINCT YEAR(im.data) AS ano
        ${fromClause}
        ${whereClause}
        ORDER BY ano DESC
      `,
      params,
    );

    return rows
      .map((row) => String(row.ano || ""))
      .filter((year) => /^\d{4}$/.test(year));
  }
}

export default new InvestimentoMovimentacaoRepository();
