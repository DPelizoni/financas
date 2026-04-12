import { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "../config/database";
import {
  User,
  UserCreateInput,
  UserFilters,
  UserManagementInput,
  UserRole,
  UserRoleUpdateInput,
  UserStatusUpdateInput,
} from "../models/User";

export class UserRepository {
  /**
   * Lista todos os usuários com filtros e paginação
   */
  async findAll(
    filters: UserFilters,
  ): Promise<{ users: User[]; total: number }> {
    const { search, status, role, page = 1, limit = 10 } = filters;
    const offset = (page - 1) * limit;

    let query = "SELECT * FROM users WHERE 1=1";
    const params: any[] = [];

    if (search) {
      query += " AND (nome LIKE ? OR email LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    if (status) {
      query += " AND status = ?";
      params.push(status);
    }

    if (role) {
      query += " AND role = ?";
      params.push(role);
    }

    const [countRows] = await pool.query<RowDataPacket[]>(
      query.replace("SELECT *", "SELECT COUNT(*) as total"),
      params,
    );
    const total = Number(countRows[0]?.total || 0);

    query += " ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    return { users: rows as User[], total };
  }

  /**
   * Busca usuário por e-mail
   */
  async findByEmail(email: string): Promise<User | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM users WHERE email = ? LIMIT 1",
      [email],
    );

    return rows.length > 0 ? (rows[0] as User) : null;
  }

  /**
   * Busca usuário por ID
   */
  async findById(id: number): Promise<User | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM users WHERE id = ? LIMIT 1",
      [id],
    );

    return rows.length > 0 ? (rows[0] as User) : null;
  }

  /**
   * Cria um novo usuário
   */
  async create(input: UserCreateInput): Promise<User> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO users (nome, email, senha, status, role)
       VALUES (?, ?, ?, ?, ?)`,
      [
        input.nome,
        input.email,
        input.senha,
        input.status || "ATIVO",
        input.role || "USUARIO",
      ],
    );

    const created = await this.findById(result.insertId);
    if (!created) {
      throw new Error("Erro ao criar usuário");
    }

    return created;
  }

  /**
   * Atualiza o status de um usuário
   */
  async updateStatus(
    id: number,
    input: UserStatusUpdateInput,
  ): Promise<User | null> {
    await pool.query<ResultSetHeader>(
      "UPDATE users SET status = ? WHERE id = ?",
      [input.status, id],
    );

    return this.findById(id);
  }

  /**
   * Atualiza o papel (role) de um usuário
   */
  async updateRole(
    id: number,
    input: UserRoleUpdateInput,
  ): Promise<User | null> {
    await pool.query<ResultSetHeader>(
      "UPDATE users SET role = ? WHERE id = ?",
      [input.role, id],
    );

    return this.findById(id);
  }

  /**
   * Atualiza dados de um usuário de forma dinâmica
   */
  async updateUser(
    id: number,
    input: Partial<UserManagementInput>,
  ): Promise<User | null> {
    const fields: string[] = [];
    const values: any[] = [];

    const allowedFields: (keyof UserManagementInput)[] = [
      "nome",
      "email",
      "senha",
      "status",
      "role",
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
      `UPDATE users SET ${fields.join(", ")} WHERE id = ?`,
      values,
    );

    return this.findById(id);
  }

  /**
   * Exclui um usuário
   */
  async delete(id: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
      "DELETE FROM users WHERE id = ?",
      [id],
    );

    return result.affectedRows > 0;
  }

  /**
   * Conta usuários por papel
   */
  async countByRole(role: UserRole): Promise<number> {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) as total FROM users WHERE role = ?",
      [role],
    );

    return Number(rows[0]?.total || 0);
  }

  /**
   * Conta usuários ativos por papel
   */
  async countActiveByRole(role: UserRole): Promise<number> {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) as total FROM users WHERE role = ? AND status = 'ATIVO'",
      [role],
    );

    return Number(rows[0]?.total || 0);
  }

  /**
   * Verifica se um usuário existe por ID
   */
  async exists(id: number): Promise<boolean> {
    const user = await this.findById(id);
    return user !== null;
  }
}

export default new UserRepository();
