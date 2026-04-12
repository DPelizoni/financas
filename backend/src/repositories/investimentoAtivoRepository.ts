import { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "../config/database";
import {
  InvestimentoAtivo,
  InvestimentoAtivoFilters,
  InvestimentoAtivoInput,
} from "../models/Investimento";

export class InvestimentoAtivoRepository {
  private summaryJoinSql = `
    LEFT JOIN (
      SELECT
        investimento_ativo_id,
        COALESCE(SUM(CASE WHEN tipo = 'APORTE' THEN valor ELSE 0 END), 0) AS total_aporte,
        COALESCE(SUM(CASE WHEN tipo = 'RESGATE' THEN valor ELSE 0 END), 0) AS total_resgate,
        COALESCE(SUM(CASE WHEN tipo = 'RENDIMENTO' THEN valor ELSE 0 END), 0) AS total_rendimento
      FROM investimento_movimentacoes
      GROUP BY investimento_ativo_id
    ) ims ON ims.investimento_ativo_id = ia.id
  `;

  /**
   * Lista todos os ativos de investimento com filtros e paginação
   */
  async findAll(
    filters: InvestimentoAtivoFilters,
  ): Promise<{ ativos: InvestimentoAtivo[]; total: number }> {
    const {
      search,
      banco_id,
      ativo,
      data_de,
      data_ate,
      page = 1,
      limit = 10,
    } = filters;
    const offset = (page - 1) * limit;

    const baseFrom = `
      FROM investimento_ativos ia
      LEFT JOIN banks b ON b.id = ia.banco_id
      ${this.summaryJoinSql}
    `;
    let whereClause = "WHERE 1=1";
    const params: Array<string | number | boolean> = [];

    if (search) {
      whereClause += " AND (ia.nome LIKE ? OR b.nome LIKE ?)";
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (banco_id) {
      whereClause += " AND ia.banco_id = ?";
      params.push(banco_id);
    }

    if (ativo !== undefined) {
      whereClause += " AND ia.ativo = ?";
      params.push(ativo);
    }

    if (data_de) {
      whereClause += " AND ia.data_saldo_inicial >= ?";
      params.push(data_de);
    }

    if (data_ate) {
      whereClause += " AND ia.data_saldo_inicial <= ?";
      params.push(data_ate);
    }

    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total ${baseFrom} ${whereClause}`,
      params,
    );
    const total = Number(countRows[0].total || 0);

    const [rows] = await pool.query<RowDataPacket[]>(
      `
        SELECT
          ia.id,
          ia.nome,
          ia.banco_id,
          b.nome AS banco_nome,
          ia.saldo_inicial,
          DATE_FORMAT(ia.data_saldo_inicial, '%Y-%m-%d') AS data_saldo_inicial,
          ia.ativo,
          ia.created_at,
          ia.updated_at,
          COALESCE(ims.total_aporte, 0) AS total_aporte,
          COALESCE(ims.total_resgate, 0) AS total_resgate,
          COALESCE(ims.total_rendimento, 0) AS total_rendimento,
          (
            ia.saldo_inicial
            + COALESCE(ims.total_aporte, 0)
            + COALESCE(ims.total_rendimento, 0)
            - COALESCE(ims.total_resgate, 0)
          ) AS saldo_atual
        ${baseFrom}
        ${whereClause}
        ORDER BY ia.nome ASC, ia.id ASC
        LIMIT ? OFFSET ?
      `,
      [...params, limit, offset],
    );

    return { ativos: rows as InvestimentoAtivo[], total };
  }

  /**
   * Obtém os anos disponíveis com base nos ativos cadastrados
   */
  async getAvailableYears(filters: {
    banco_id?: number;
    ativo?: boolean;
  }): Promise<string[]> {
    const { banco_id, ativo } = filters;
    let query = `
      SELECT DISTINCT YEAR(ia.data_saldo_inicial) AS ano
      FROM investimento_ativos ia
      WHERE ia.data_saldo_inicial IS NOT NULL
    `;
    const params: Array<number | boolean> = [];

    if (banco_id) {
      query += " AND ia.banco_id = ?";
      params.push(banco_id);
    }

    if (ativo !== undefined) {
      query += " AND ia.ativo = ?";
      params.push(ativo);
    }

    query += " ORDER BY ano DESC";

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    return rows
      .map((row) => String(row.ano || ""))
      .filter((year) => /^\d{4}$/.test(year));
  }

  /**
   * Busca a carteira de ativos filtrada
   */
  async findCarteira(filters: {
    banco_id?: number;
    ativo?: boolean;
  }): Promise<InvestimentoAtivo[]> {
    const { banco_id, ativo } = filters;
    let query = `
      SELECT
        ia.id,
        ia.nome,
        ia.banco_id,
        b.nome AS banco_nome,
        ia.saldo_inicial,
        DATE_FORMAT(ia.data_saldo_inicial, '%Y-%m-%d') AS data_saldo_inicial,
        ia.ativo,
        ia.created_at,
        ia.updated_at,
        COALESCE(ims.total_aporte, 0) AS total_aporte,
        COALESCE(ims.total_resgate, 0) AS total_resgate,
        COALESCE(ims.total_rendimento, 0) AS total_rendimento,
        (
          ia.saldo_inicial
          + COALESCE(ims.total_aporte, 0)
          + COALESCE(ims.total_rendimento, 0)
          - COALESCE(ims.total_resgate, 0)
        ) AS saldo_atual
      FROM investimento_ativos ia
      LEFT JOIN banks b ON b.id = ia.banco_id
      ${this.summaryJoinSql}
      WHERE 1=1
    `;
    const params: Array<number | boolean> = [];

    if (banco_id) {
      query += " AND ia.banco_id = ?";
      params.push(banco_id);
    }

    if (ativo !== undefined) {
      query += " AND ia.ativo = ?";
      params.push(ativo);
    }

    query += " ORDER BY saldo_atual DESC, ia.nome ASC";

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    return rows as InvestimentoAtivo[];
  }

  /**
   * Busca um ativo de investimento por ID
   */
  async findById(id: number): Promise<InvestimentoAtivo | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `
        SELECT
          ia.id,
          ia.nome,
          ia.banco_id,
          b.nome AS banco_nome,
          ia.saldo_inicial,
          DATE_FORMAT(ia.data_saldo_inicial, '%Y-%m-%d') AS data_saldo_inicial,
          ia.ativo,
          ia.created_at,
          ia.updated_at,
          COALESCE(ims.total_aporte, 0) AS total_aporte,
          COALESCE(ims.total_resgate, 0) AS total_resgate,
          COALESCE(ims.total_rendimento, 0) AS total_rendimento,
          (
            ia.saldo_inicial
            + COALESCE(ims.total_aporte, 0)
            + COALESCE(ims.total_rendimento, 0)
            - COALESCE(ims.total_resgate, 0)
          ) AS saldo_atual
        FROM investimento_ativos ia
        LEFT JOIN banks b ON b.id = ia.banco_id
        ${this.summaryJoinSql}
        WHERE ia.id = ?
      `,
      [id],
    );

    return rows.length > 0 ? (rows[0] as InvestimentoAtivo) : null;
  }

  /**
   * Cria um novo ativo de investimento
   */
  async create(input: InvestimentoAtivoInput): Promise<InvestimentoAtivo> {
    const [result] = await pool.query<ResultSetHeader>(
      `
        INSERT INTO investimento_ativos
          (nome, banco_id, saldo_inicial, data_saldo_inicial, ativo)
        VALUES (?, ?, ?, ?, ?)
      `,
      [
        input.nome,
        input.banco_id,
        input.saldo_inicial,
        input.data_saldo_inicial,
        input.ativo !== undefined ? input.ativo : true,
      ],
    );

    const created = await this.findById(result.insertId);
    if (!created) {
      throw new Error("Erro ao criar ativo de investimento");
    }

    return created;
  }

  /**
   * Atualiza um ativo de investimento de forma dinâmica
   */
  async update(
    id: number,
    input: Partial<InvestimentoAtivoInput>,
  ): Promise<InvestimentoAtivo | null> {
    const fields: string[] = [];
    const values: Array<string | number | boolean> = [];

    const allowedFields: (keyof InvestimentoAtivoInput)[] = [
      "nome",
      "banco_id",
      "saldo_inicial",
      "data_saldo_inicial",
      "ativo",
    ];

    allowedFields.forEach((field) => {
      if (input[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(input[field]);
      }
    });

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    await pool.query(
      `UPDATE investimento_ativos SET ${fields.join(", ")} WHERE id = ?`,
      values,
    );

    return this.findById(id);
  }

  /**
   * Exclui um ativo de investimento
   */
  async delete(id: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
      "DELETE FROM investimento_ativos WHERE id = ?",
      [id],
    );
    return result.affectedRows > 0;
  }

  /**
   * Verifica se um ativo de investimento existe por ID
   */
  async exists(id: number): Promise<boolean> {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT 1 FROM investimento_ativos WHERE id = ?",
      [id],
    );
    return rows.length > 0;
  }
}

export default new InvestimentoAtivoRepository();
