import { TransacaoRepository } from "../repositories/transacaoRepository";
import { BankRepository } from "../repositories/bankRepository";
import { CategoryRepository } from "../repositories/categoryRepository";
import { DescricaoRepository } from "../repositories/descricaoRepository";
import { Transacao, TransacaoComDetalhes } from "../models/Transacao";
import { AppError } from "../middlewares/errorHandler";

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

interface CopyMonthResult {
  mes_origem: string;
  meses_destino: string[];
  total_origem: number;
  total_criadas: number;
}

interface DeleteMonthsResult {
  meses: string[];
  total_excluidas: number;
}

interface DeleteTransactionMonthsResult {
  transacao_id: number;
  mes_origem: string;
  meses: string[];
  total_excluidas: number;
}

interface CreateBatchResult {
  total_recebidas: number;
  total_criadas: number;
}

export class TransacaoService {
  private transacaoRepository = new TransacaoRepository();
  private bankRepository = new BankRepository();
  private categoryRepository = new CategoryRepository();
  private descricaoRepository = new DescricaoRepository();

  async getAllTransacoes(filters: TransacaoFilters) {
    return this.transacaoRepository.findAll(filters);
  }

  async getById(id: number) {
    const transacao = await this.transacaoRepository.findById(id);
    if (!transacao) {
      throw new AppError(404, "Transação não encontrada");
    }
    return transacao;
  }

  async createTransacao(
    data: Omit<Transacao, "id" | "created_at" | "updated_at">,
  ) {
    await this.validateCreateTransacaoRefs(data);
    return this.transacaoRepository.create(data);
  }

  async createTransacoesBatch(
    data: Omit<Transacao, "id" | "created_at" | "updated_at">[],
  ): Promise<CreateBatchResult> {
    if (data.length === 0) {
      throw new AppError(400, "Informe ao menos uma transação para criação");
    }

    if (data.length > 12) {
      throw new AppError(400, "O limite de criação em lote é de 12 transações");
    }

    const caches = {
      bancos: new Map<number, unknown>(),
      categorias: new Map<number, unknown>(),
      descricoes: new Map<number, unknown>(),
    };

    for (const transacao of data) {
      await this.validateCreateTransacaoRefs(transacao, caches);
    }

    const totalCriadas = await this.transacaoRepository.createMany(data);

    return {
      total_recebidas: data.length,
      total_criadas: totalCriadas,
    };
  }

  async updateTransacao(
    id: number,
    data: Partial<Omit<Transacao, "id" | "created_at" | "updated_at">>,
  ) {
    const exists = await this.transacaoRepository.exists(id);
    if (!exists) {
      throw new AppError(404, "Transação não encontrada");
    }

    // Validate references if provided
    if (data.banco_id) {
      const banco_id = Number(data.banco_id);
      const bancoExists = await this.bankRepository.findById(banco_id);
      if (!bancoExists) {
        throw new AppError(404, "Banco não encontrado");
      }
    }

    if (data.categoria_id) {
      const categoria_id = Number(data.categoria_id);
      const categoriaExists =
        await this.categoryRepository.findById(categoria_id);
      if (!categoriaExists) {
        throw new AppError(404, "Categoria não encontrada");
      }

      if (data.tipo && categoriaExists.tipo !== data.tipo) {
        throw new AppError(
          400,
          `Categoria do tipo ${categoriaExists.tipo} não pode ser usada com o tipo ${data.tipo}`,
        );
      }
    }

    if (data.descricao_id) {
      const descricao_id = Number(data.descricao_id);
      const categoria_id = Number(data.categoria_id || 0);
      const descricaoExists =
        await this.descricaoRepository.findById(descricao_id);
      if (!descricaoExists) {
        throw new AppError(404, "Descrição não encontrada");
      }

      if (categoria_id > 0 && descricaoExists.categoria_id !== categoria_id) {
        throw new AppError(
          400,
          "Descrição não pertence à categoria selecionada",
        );
      }
    }

    return this.transacaoRepository.update(id, data);
  }

  async deleteTransacao(id: number) {
    try {
      const exists = await this.transacaoRepository.exists(id);
      if (!exists) {
        throw new AppError(404, "Transação não encontrada");
      }
      return this.transacaoRepository.delete(id);
    } catch (error) {
      if (error instanceof AppError) throw error;

      const dbError = error as { code?: string; message?: string };
      if (
        dbError.code === "ER_ROW_IS_REFERENCED_2" ||
        dbError.code === "ER_ROW_IS_REFERENCED" ||
        dbError.message?.toLowerCase().includes("foreign key")
      ) {
        throw new AppError(
          409,
          "Não é possível excluir esta transação porque ela está vinculada a outros registros.",
        );
      }

      throw new AppError(500, "Erro ao excluir transação");
    }
  }

  async getSummary(
    filters: {
      search?: string;
      tipo?: "DESPESA" | "RECEITA";
      categoria_id?: number;
      banco_id?: number;
      situacao?: "PENDENTE" | "PAGO";
      mes?: string;
      ano?: string;
    } = {},
  ) {
    return this.transacaoRepository.getSummary(filters);
  }

  async copyTransacoesByMes(
    mesOrigemInput: string,
    mesesDestinoInput: string[],
  ): Promise<CopyMonthResult> {
    const mesOrigem = this.normalizeMes(mesOrigemInput);
    const mesesDestino = Array.from(
      new Set(mesesDestinoInput.map((mes) => this.normalizeMes(mes))),
    ).filter((mes) => mes !== mesOrigem);

    if (mesesDestino.length === 0) {
      throw new AppError(
        400,
        "Informe ao menos um mês de destino diferente do mês de origem",
      );
    }

    const origem = await this.transacaoRepository.findByMes(mesOrigem);
    if (origem.length === 0) {
      throw new AppError(404, "Não há transações no mês de origem informado");
    }

    const novosRegistros: Omit<
      Transacao,
      "id" | "created_at" | "updated_at"
    >[] = [];

    for (const mesDestino of mesesDestino) {
      const existentesNoDestino = await this.transacaoRepository.findByMes(
        mesDestino,
      );
      const existingByIdentity = new Map<
        string,
        Omit<Transacao, "created_at" | "updated_at">[]
      >();

      for (const existente of existentesNoDestino) {
        const identity = this.buildCopyIdentitySignature({
          mes: existente.mes,
          vencimento: existente.vencimento,
          tipo: existente.tipo,
          categoria_id: Number(existente.categoria_id),
          descricao_id: Number(existente.descricao_id),
          banco_id: Number(existente.banco_id),
          situacao: existente.situacao,
          valor: Number(existente.valor),
        });
        const current = existingByIdentity.get(identity) || [];
        current.push(existente);
        existingByIdentity.set(identity, current);
      }

      const sourceCounts = new Map<string, number>();

      for (const transacao of origem) {
        const novoRegistro = {
          mes: mesDestino,
          vencimento: this.buildVencimento(
            transacao.vencimento,
            mesOrigem,
            mesDestino,
          ),
          tipo: transacao.tipo,
          categoria_id: Number(transacao.categoria_id),
          descricao_id: Number(transacao.descricao_id),
          banco_id: Number(transacao.banco_id),
          situacao: transacao.situacao,
          valor: Number(transacao.valor),
        };

        const identity = this.buildCopyIdentitySignature(novoRegistro);
        const sourceCount = (sourceCounts.get(identity) || 0) + 1;
        sourceCounts.set(identity, sourceCount);

        const existingMatches = existingByIdentity.get(identity) || [];
        const matchedExisting = existingMatches[sourceCount - 1];
        if (matchedExisting) {
          if (matchedExisting.vencimento !== novoRegistro.vencimento) {
            await this.transacaoRepository.update(matchedExisting.id, {
              vencimento: novoRegistro.vencimento,
            });
          }
          continue;
        }

        novosRegistros.push(novoRegistro);
      }
    }

    const totalCriadas =
      await this.transacaoRepository.createMany(novosRegistros);

    return {
      mes_origem: mesOrigem,
      meses_destino: mesesDestino,
      total_origem: origem.length,
      total_criadas: totalCriadas,
    };
  }

  async deleteTransacoesByMeses(
    mesesInput: string[],
  ): Promise<DeleteMonthsResult> {
    const meses = Array.from(
      new Set(mesesInput.map((mes) => this.normalizeMes(mes))),
    );

    if (meses.length === 0) {
      throw new AppError(400, "Informe ao menos um mês para exclusão");
    }

    const totalExcluidas = await this.transacaoRepository.deleteByMeses(meses);

    return {
      meses,
      total_excluidas: totalExcluidas,
    };
  }

  async deleteTransacaoByMeses(
    transacaoIdInput: number,
    mesesInput: string[],
  ): Promise<DeleteTransactionMonthsResult> {
    const transacaoId = Number(transacaoIdInput);
    if (!Number.isInteger(transacaoId) || transacaoId <= 0) {
      throw new AppError(400, "Transação inválida para exclusão");
    }

    const transacaoOrigem = await this.transacaoRepository.findById(transacaoId);
    if (!transacaoOrigem) {
      throw new AppError(404, "Transação não encontrada");
    }

    const meses = Array.from(
      new Set(mesesInput.map((mes) => this.normalizeMes(mes))),
    );

    if (meses.length === 0) {
      throw new AppError(400, "Informe ao menos um mês para exclusão");
    }

    const registrosMesOrigem = await this.transacaoRepository.findByMes(
      transacaoOrigem.mes,
    );
    const assinaturaBase = this.buildDeleteIdentitySignature(transacaoOrigem);
    const candidatosOrigem = registrosMesOrigem.filter(
      (registro) => this.buildDeleteIdentitySignature(registro) === assinaturaBase,
    );
    const indiceOrigem = candidatosOrigem.findIndex(
      (registro) => registro.id === transacaoId,
    );

    if (indiceOrigem < 0) {
      throw new AppError(
        500,
        "Não foi possível localizar a transação base para exclusão em lote",
      );
    }

    const idsParaExcluir = new Set<number>();

    for (const mes of meses) {
      if (mes === transacaoOrigem.mes) {
        idsParaExcluir.add(transacaoId);
        continue;
      }

      const registrosMes = await this.transacaoRepository.findByMes(mes);
      const candidatosMes = registrosMes.filter(
        (registro) =>
          this.buildDeleteIdentitySignature(registro) === assinaturaBase,
      );

      if (candidatosMes.length === 0) {
        continue;
      }

      const vencimentoEsperado = this.buildVencimento(
        transacaoOrigem.vencimento,
        transacaoOrigem.mes,
        mes,
      );

      const candidatosMesmoVencimento = candidatosMes.filter(
        (registro) => registro.vencimento === vencimentoEsperado,
      );

      const candidatosPrioritarios =
        candidatosMesmoVencimento.length > 0
          ? candidatosMesmoVencimento
          : candidatosMes;

      const alvo = candidatosPrioritarios[indiceOrigem];
      if (alvo) {
        idsParaExcluir.add(alvo.id);
      }
    }

    const totalExcluidas = await this.transacaoRepository.deleteByIds(
      Array.from(idsParaExcluir),
    );

    return {
      transacao_id: transacaoId,
      mes_origem: transacaoOrigem.mes,
      meses,
      total_excluidas: totalExcluidas,
    };
  }

  private async validateCreateTransacaoRefs(
    data: Omit<Transacao, "id" | "created_at" | "updated_at">,
    caches?: {
      bancos: Map<number, unknown>;
      categorias: Map<number, unknown>;
      descricoes: Map<number, unknown>;
    },
  ): Promise<void> {
    const banco_id = Number(data.banco_id);
    const categoria_id = Number(data.categoria_id);
    const descricao_id = Number(data.descricao_id);

    const bancoFromCache = caches?.bancos.get(banco_id);
    const bancoExists =
      bancoFromCache ?? (await this.bankRepository.findById(banco_id));
    if (!bancoExists) {
      throw new AppError(404, "Banco não encontrado");
    }
    caches?.bancos.set(banco_id, bancoExists);

    const categoriaFromCache = caches?.categorias.get(categoria_id);
    const categoriaExists =
      categoriaFromCache ??
      (await this.categoryRepository.findById(categoria_id));
    if (!categoriaExists) {
      throw new AppError(404, "Categoria não encontrada");
    }
    caches?.categorias.set(categoria_id, categoriaExists);

    const categoriaTipo = (categoriaExists as { tipo: "DESPESA" | "RECEITA" })
      .tipo;
    if (categoriaTipo !== data.tipo) {
      throw new AppError(
        400,
        `Categoria do tipo ${categoriaTipo} não pode ser usada com o tipo ${data.tipo}`,
      );
    }

    const descricaoFromCache = caches?.descricoes.get(descricao_id);
    const descricaoExists =
      descricaoFromCache ??
      (await this.descricaoRepository.findById(descricao_id));
    if (!descricaoExists) {
      throw new AppError(404, "Descrição não encontrada");
    }
    caches?.descricoes.set(descricao_id, descricaoExists);

    const descricaoCategoriaId = (descricaoExists as { categoria_id: number })
      .categoria_id;
    if (descricaoCategoriaId !== categoria_id) {
      throw new AppError(400, "Descrição não pertence à categoria selecionada");
    }
  }

  private normalizeMes(mes: string): string {
    if (/^\d{2}\/\d{4}$/.test(mes)) return mes;
    if (/^\d{4}-\d{2}$/.test(mes)) {
      const [year, month] = mes.split("-");
      return `${month}/${year}`;
    }
    throw new AppError(400, "Mês inválido. Use MM/AAAA ou YYYY-MM");
  }

  private buildVencimento(
    vencimentoOriginal: string,
    mesOrigem: string,
    mesDestino: string,
  ): string {
    const { day, month, year } = this.parseVencimento(vencimentoOriginal);
    const origemMes = this.parseMes(mesOrigem);
    const destinoMes = this.parseMes(mesDestino);
    const offsetMeses =
      (year - origemMes.year) * 12 + (month - origemMes.month);
    const target = this.addMonthsToMes(destinoMes, offsetMeses);
    const lastDayOfTargetMonth = new Date(target.year, target.month, 0).getDate();
    const safeDay = Math.min(day, lastDayOfTargetMonth);

    return `${String(safeDay).padStart(2, "0")}/${String(target.month).padStart(2, "0")}/${target.year}`;
  }

  private parseVencimento(
    vencimento: string,
  ): { day: number; month: number; year: number } {
    let day: number;
    let month: number;
    let year: number;

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(vencimento)) {
      const [dayStr, monthStr, yearStr] = vencimento.split("/");
      day = Number(dayStr);
      month = Number(monthStr);
      year = Number(yearStr);
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(vencimento)) {
      const [yearStr, monthStr, dayStr] = vencimento.split("-");
      day = Number(dayStr);
      month = Number(monthStr);
      year = Number(yearStr);
    } else {
      throw new AppError(
        400,
        "Vencimento inválido para cópia. Use DD/MM/AAAA ou YYYY-MM-DD",
      );
    }

    const parsedDate = new Date(year, month - 1, day);
    const isValidDate =
      parsedDate.getFullYear() === year &&
      parsedDate.getMonth() === month - 1 &&
      parsedDate.getDate() === day;

    if (!isValidDate) {
      throw new AppError(400, "Vencimento inválido para cópia");
    }

    return { day, month, year };
  }

  private parseMes(mes: string): { month: number; year: number } {
    if (!/^\d{2}\/\d{4}$/.test(mes)) {
      throw new AppError(400, "Mês inválido para cálculo de cópia");
    }

    const [monthStr, yearStr] = mes.split("/");
    const month = Number(monthStr);
    const year = Number(yearStr);

    if (!Number.isInteger(month) || month < 1 || month > 12) {
      throw new AppError(400, "Mês inválido para cálculo de cópia");
    }

    return { month, year };
  }

  private addMonthsToMes(
    base: { month: number; year: number },
    offset: number,
  ): { month: number; year: number } {
    const absoluteMonths = base.year * 12 + (base.month - 1) + offset;
    const targetYear = Math.floor(absoluteMonths / 12);
    const targetMonth = (absoluteMonths % 12) + 1;

    return { month: targetMonth, year: targetYear };
  }

  private buildCopyIdentitySignature(
    registro: Omit<Transacao, "id" | "created_at" | "updated_at">,
  ): string {
    return [
      registro.mes,
      registro.tipo,
      Number(registro.categoria_id),
      Number(registro.descricao_id),
      Number(registro.banco_id),
      registro.situacao,
      Number(registro.valor),
    ].join("|");
  }

  private buildDeleteIdentitySignature(
    registro: Pick<
      Transacao,
      "tipo" | "categoria_id" | "descricao_id" | "banco_id" | "valor"
    >,
  ): string {
    return [
      registro.tipo,
      Number(registro.categoria_id),
      Number(registro.descricao_id),
      Number(registro.banco_id),
      Number(registro.valor),
    ].join("|");
  }
}

