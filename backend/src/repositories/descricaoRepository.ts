import pool from "../config/database";
import {
  DescricaoInput,
  Descricao,
  DescricaoFilters,
} from "../models/Descricao";

export class DescricaoRepository {
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

    query += " ORDER BY nome ASC, id ASC";

    const countQuery = query.replace(
      /SELECT \* FROM/,
      "SELECT COUNT(*) as total FROM",
    );
    const [countResult] = await pool.query<any>(countQuery, params);
    const total = countResult[0].total;

    query += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [rows] = await pool.query<any>(query, params);
    return {
      descricoes: rows,
      total,
    };
  }

  async findById(id: number): Promise<Descricao | null> {
    const [rows] = await pool.query<any>(
      "SELECT * FROM descricoes WHERE id = ?",
      [id],
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async create(input: DescricaoInput): Promise<Descricao> {
    const { nome, categoria_id, ativo = true } = input;
    const [result] = await pool.query<any>(
      "INSERT INTO descricoes (nome, categoria_id, ativo) VALUES (?, ?, ?)",
      [nome, categoria_id, ativo],
    );

    const descricao = await this.findById((result as any).insertId);
    if (!descricao) {
      throw new Error("Falha ao criar descrição");
    }
    return descricao;
  }

  async update(id: number, input: Partial<DescricaoInput>): Promise<Descricao> {
    const updates: string[] = [];
    const values: (string | number | boolean)[] = [];

    if (input.nome !== undefined) {
      updates.push("nome = ?");
      values.push(input.nome);
    }
    if (input.categoria_id !== undefined) {
      updates.push("categoria_id = ?");
      values.push(input.categoria_id);
    }
    if (input.ativo !== undefined) {
      updates.push("ativo = ?");
      values.push(input.ativo);
    }

    if (updates.length === 0) {
      const descricao = await this.findById(id);
      if (!descricao) {
        throw new Error("Descrição não encontrada");
      }
      return descricao;
    }

    updates.push("updated_at = NOW()");
    values.push(id);

    await pool.query(
      `UPDATE descricoes SET ${updates.join(", ")} WHERE id = ?`,
      values,
    );

    const descricao = await this.findById(id);
    if (!descricao) {
      throw new Error("Descrição não encontrada após atualização");
    }
    return descricao;
  }

  async delete(id: number): Promise<void> {
    await pool.query("DELETE FROM descricoes WHERE id = ?", [id]);
  }

  async exists(id: number): Promise<boolean> {
    const [rows] = await pool.query<any>(
      "SELECT id FROM descricoes WHERE id = ? LIMIT 1",
      [id],
    );
    return rows.length > 0;
  }
}

export default new DescricaoRepository();
