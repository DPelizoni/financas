import pool from "../config/database";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import {
  DescricaoInput,
  Descricao,
  DescricaoFilters,
} from "../models/Descricao";

export class DescricaoRepository {
  /**
   * Lista todas as descrições com filtros e paginação
   */
  async findAll(
    filters: DescricaoFilters,
  ): Promise<{ descricoes: Descricao[]; total: number }> {
    const { search, ativo, categoria_id, page = 1, limit = 10 } = filters;
    const offset = (page - 1) * limit;

    let query = "SELECT * FROM descricoes WHERE 1=1";
    const params: (string | number | boolean)[] = [];

    if (search) {
      query += " AND nome LIKE ?";
      params.push(`%${search}%`);
    }

    if (ativo !== undefined) {
      query += " AND ativo = ?";
      params.push(ativo);
    }

    if (categoria_id !== undefined) {
      query += " AND categoria_id = ?";
      params.push(categoria_id);
    }

    const [countResult] = await pool.query<RowDataPacket[]>(
      query.replace("SELECT *", "SELECT COUNT(*) as total"),
      params,
    );
    const total = Number(countResult[0]?.total || 0);

    query += " ORDER BY nome ASC, id ASC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    return {
      descricoes: rows as Descricao[],
      total,
    };
  }

  /**
   * Busca descrição por ID
   */
  async findById(id: number): Promise<Descricao | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM descricoes WHERE id = ?",
      [id],
    );
    return rows.length > 0 ? (rows[0] as Descricao) : null;
  }

  /**
   * Cria uma nova descrição
   */
  async create(input: DescricaoInput): Promise<Descricao> {
    const { nome, categoria_id, ativo = true } = input;
    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO descricoes (nome, categoria_id, ativo) VALUES (?, ?, ?)",
      [nome, categoria_id, ativo],
    );

    const descricao = await this.findById(result.insertId);
    if (!descricao) {
      throw new Error("Falha ao criar descrição");
    }
    return descricao;
  }

  /**
   * Atualiza uma descrição de forma dinâmica
   */
  async update(id: number, input: Partial<DescricaoInput>): Promise<Descricao | null> {
    const fields: string[] = [];
    const values: any[] = [];

    const allowedFields: (keyof DescricaoInput)[] = [
      "nome",
      "categoria_id",
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
      `UPDATE descricoes SET ${fields.join(", ")} WHERE id = ?`,
      values,
    );

    return this.findById(id);
  }

  /**
   * Exclui uma descrição
   */
  async delete(id: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
      "DELETE FROM descricoes WHERE id = ?",
      [id],
    );
    return result.affectedRows > 0;
  }

  /**
   * Verifica se uma descrição existe por ID
   */
  async exists(id: number): Promise<boolean> {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM descricoes WHERE id = ? LIMIT 1",
      [id],
    );
    return rows.length > 0;
  }
}

export default new DescricaoRepository();
