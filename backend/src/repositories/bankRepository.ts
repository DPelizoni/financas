import { RowDataPacket, ResultSetHeader } from "mysql2";
import pool from "../config/database";
import { Bank, BankInput, BankFilters } from "../models/Bank";

export class BankRepository {
  /**
   * Lista bancos com paginação e filtros
   */
  async findAll(
    filters: BankFilters,
  ): Promise<{ banks: Bank[]; total: number }> {
    const { search, ativo, page = 1, limit = 10 } = filters;
    const offset = (page - 1) * limit;

    let query = "SELECT * FROM banks WHERE 1=1";
    const params: any[] = [];

    // Filtro de busca
    if (search) {
      query += " AND (nome LIKE ? OR codigo LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    // Filtro de status
    if (ativo !== undefined) {
      query += " AND ativo = ?";
      params.push(ativo);
    }

    // Query para total
    const [countResult] = await pool.query<RowDataPacket[]>(
      query.replace("SELECT *", "SELECT COUNT(*) as total"),
      params,
    );
    const total = countResult[0].total;

    // Query com paginação
    query += " ORDER BY nome ASC, id ASC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const [banks] = await pool.query<RowDataPacket[]>(query, params);
    return { banks: banks as Bank[], total };
  }

  /**
   * Busca banco por ID
   */
  async findById(id: number): Promise<Bank | null> {
    const [banks] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM banks WHERE id = ?",
      [id],
    );
    return banks.length > 0 ? (banks[0] as Bank) : null;
  }

  /**
   * Cria novo banco
   */
  async create(bank: BankInput): Promise<Bank> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO banks (nome, codigo, cor, icone, saldo_inicial, ativo) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        bank.nome,
        bank.codigo || null,
        bank.cor || "#3B82F6",
        bank.icone || null,
        bank.saldo_inicial || 0,
        bank.ativo !== undefined ? bank.ativo : true,
      ],
    );

    const createdBank = await this.findById(result.insertId);
    if (!createdBank) {
      throw new Error("Erro ao criar banco");
    }
    return createdBank;
  }

  /**
   * Atualiza banco de forma dinâmica
   */
  async update(id: number, bank: Partial<BankInput>): Promise<Bank | null> {
    const fields: string[] = [];
    const values: any[] = [];

    const allowedFields: (keyof BankInput)[] = [
      "nome",
      "codigo",
      "cor",
      "icone",
      "saldo_inicial",
      "ativo",
    ];

    allowedFields.forEach((field) => {
      if (bank[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(bank[field]);
      }
    });

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    await pool.query(
      `UPDATE banks SET ${fields.join(", ")} WHERE id = ?`,
      values,
    );

    return this.findById(id);
  }

  /**
   * Exclui banco
   */
  async delete(id: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
      "DELETE FROM banks WHERE id = ?",
      [id],
    );
    return result.affectedRows > 0;
  }

  /**
   * Verifica se banco existe por ID
   */
  async exists(id: number): Promise<boolean> {
    const bank = await this.findById(id);
    return bank !== null;
  }
}

export default new BankRepository();
