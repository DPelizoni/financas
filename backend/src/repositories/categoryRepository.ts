import { RowDataPacket, ResultSetHeader } from "mysql2";
import pool from "../config/database";
import { Category, CategoryInput, CategoryFilters } from "../models/Category";

export class CategoryRepository {
  async findAll(
    filters: CategoryFilters,
  ): Promise<{ categories: Category[]; total: number }> {
    const { search, ativo, tipo, page = 1, limit = 10 } = filters;
    const offset = (page - 1) * limit;

    let baseQuery = `FROM categories c WHERE 1=1`;
    const params: any[] = [];

    if (search) {
      baseQuery += " AND c.nome LIKE ?";
      params.push(`%${search}%`);
    }

    if (ativo !== undefined) {
      baseQuery += " AND c.ativo = ?";
      params.push(ativo);
    }

    if (tipo) {
      baseQuery += " AND c.tipo = ?";
      params.push(tipo);
    }

    const [countResult] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total ${baseQuery}`,
      params,
    );
    const total = countResult[0].total;

    const [categories] = await pool.query<RowDataPacket[]>(
      `SELECT c.*
       ${baseQuery}
       ORDER BY c.nome ASC, c.id ASC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    return { categories: categories as Category[], total };
  }

  async findById(id: number): Promise<Category | null> {
    const [categories] = await pool.query<RowDataPacket[]>(
      `SELECT c.*
       FROM categories c
       WHERE c.id = ?`,
      [id],
    );

    return categories.length > 0 ? (categories[0] as Category) : null;
  }

  async create(category: CategoryInput): Promise<Category> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO categories (nome, tipo, cor, ativo)
       VALUES (?, ?, ?, ?)`,
      [
        category.nome,
        category.tipo,
        category.cor || "#0EA5E9",
        category.ativo !== undefined ? category.ativo : true,
      ],
    );

    const createdCategory = await this.findById(result.insertId);
    if (!createdCategory) {
      throw new Error("Erro ao criar categoria");
    }

    return createdCategory;
  }

  async update(
    id: number,
    category: Partial<CategoryInput>,
  ): Promise<Category | null> {
    const fields: string[] = [];
    const values: any[] = [];

    if (category.nome !== undefined) {
      fields.push("nome = ?");
      values.push(category.nome);
    }
    if (category.tipo !== undefined) {
      fields.push("tipo = ?");
      values.push(category.tipo);
    }
    if (category.cor !== undefined) {
      fields.push("cor = ?");
      values.push(category.cor);
    }
    if (category.ativo !== undefined) {
      fields.push("ativo = ?");
      values.push(category.ativo);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    await pool.query(
      `UPDATE categories SET ${fields.join(", ")} WHERE id = ?`,
      values,
    );

    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
      "DELETE FROM categories WHERE id = ?",
      [id],
    );
    return result.affectedRows > 0;
  }

  async exists(id: number): Promise<boolean> {
    const category = await this.findById(id);
    return category !== null;
  }
}

export default new CategoryRepository();
