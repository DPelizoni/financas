import { RowDataPacket, ResultSetHeader } from "mysql2";
import pool from "../config/database";
import { Category, CategoryInput, CategoryFilters } from "../models/Category";

export class CategoryRepository {
  /**
   * Lista todas as categorias com filtros e paginação
   */
  async findAll(
    filters: CategoryFilters,
  ): Promise<{ categories: Category[]; total: number }> {
    const {
      search,
      ativo,
      tipo,
      page = 1,
      limit = 10,
      sortBy = "nome",
      sortDirection = "ASC",
    } = filters;
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

    // Validação básica para evitar SQL Injection no ORDER BY
    const allowedSortColumns = ["id", "nome", "tipo", "ativo", "created_at"];
    const sortColumn = allowedSortColumns.includes(sortBy) ? sortBy : "nome";
    const direction = sortDirection.toUpperCase() === "DESC" ? "DESC" : "ASC";

    const [categories] = await pool.query<RowDataPacket[]>(
      `SELECT c.*
       ${baseQuery}
       ORDER BY c.${sortColumn} ${direction}, c.id ASC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    return { categories: categories as Category[], total };
  }

  /**
   * Busca categoria por ID
   */
  async findById(id: number): Promise<Category | null> {
    const [categories] = await pool.query<RowDataPacket[]>(
      `SELECT c.*
       FROM categories c
       WHERE c.id = ?`,
      [id],
    );

    return categories.length > 0 ? (categories[0] as Category) : null;
  }

  /**
   * Cria uma nova categoria
   */
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

  /**
   * Atualiza uma categoria de forma dinâmica
   */
  async update(
    id: number,
    category: Partial<CategoryInput>,
  ): Promise<Category | null> {
    const fields: string[] = [];
    const values: any[] = [];

    const allowedFields: (keyof CategoryInput)[] = [
      "nome",
      "tipo",
      "cor",
      "ativo",
    ];

    allowedFields.forEach((field) => {
      if (category[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(category[field]);
      }
    });

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

  /**
   * Exclui uma categoria
   */
  async delete(id: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
      "DELETE FROM categories WHERE id = ?",
      [id],
    );
    return result.affectedRows > 0;
  }

  /**
   * Verifica se uma categoria existe por ID
   */
  async exists(id: number): Promise<boolean> {
    const category = await this.findById(id);
    return category !== null;
  }
}

export default new CategoryRepository();
