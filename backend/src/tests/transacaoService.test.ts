import assert from "node:assert/strict";
import { AppError } from "../middlewares/errorHandler";
import { Transacao } from "../models/Transacao";
import { TransacaoService } from "../services/transacaoService";
import { TestCase } from "./types";

type TransacaoSemAuditoria = Omit<Transacao, "created_at" | "updated_at">;
type TransacaoCreateInput = Omit<Transacao, "id" | "created_at" | "updated_at">;

interface TransacaoRepositoryMock {
  findByMes(mes: string): Promise<TransacaoSemAuditoria[]>;
  createMany(records: TransacaoCreateInput[]): Promise<number>;
  update(id: number, data: Partial<TransacaoCreateInput>): Promise<unknown>;
  findById(id: number): Promise<TransacaoSemAuditoria | null>;
  exists(id: number): Promise<boolean>;
  delete(id: number): Promise<boolean>;
  deleteByMeses(meses: string[]): Promise<number>;
  deleteByIds(ids: number[]): Promise<number>;
}

const createTransacaoOrigem = (
  overrides: Partial<TransacaoSemAuditoria> = {},
): TransacaoSemAuditoria => ({
  id: 1,
  mes: "01/2024",
  vencimento: "31/01/2024",
  tipo: "DESPESA",
  categoria_id: 10,
  descricao_id: 20,
  banco_id: 30,
  situacao: "PENDENTE",
  valor: 150.5,
  ...overrides,
});

const setTransacaoRepository = (
  service: TransacaoService,
  overrides: Partial<TransacaoRepositoryMock>,
) => {
  const repositoryMock: TransacaoRepositoryMock = {
    async findByMes(): Promise<TransacaoSemAuditoria[]> {
      return [];
    },
    async createMany(records: TransacaoCreateInput[]): Promise<number> {
      return records.length;
    },
    async update(): Promise<unknown> {
      return null;
    },
    async findById(): Promise<TransacaoSemAuditoria | null> {
      return null;
    },
    async exists(): Promise<boolean> {
      return false;
    },
    async delete(): Promise<boolean> {
      return false;
    },
    async deleteByMeses(): Promise<number> {
      return 0;
    },
    async deleteByIds(): Promise<number> {
      return 0;
    },
    ...overrides,
  };

  (
    service as unknown as { transacaoRepository: TransacaoRepositoryMock }
  ).transacaoRepository = repositoryMock;
};

const copiaAjustaVencimentoFimMes = async () => {
  const service = new TransacaoService();
  const createdRecords: TransacaoCreateInput[] = [];
  const findByMesCalls: string[] = [];

  setTransacaoRepository(service, {
    async findByMes(mes: string): Promise<TransacaoSemAuditoria[]> {
      findByMesCalls.push(mes);
      if (mes === "01/2024") {
        return [createTransacaoOrigem()];
      }
      return [];
    },
    async createMany(records: TransacaoCreateInput[]): Promise<number> {
      createdRecords.push(...records);
      return records.length;
    },
    async update(): Promise<unknown> {
      throw new Error("update nao deveria ser chamado neste teste");
    },
  });

  const result = await service.copyTransacoesByMes("2024-01", ["2024-02"]);

  assert.deepEqual(findByMesCalls, ["01/2024", "02/2024"]);
  assert.equal(result.mes_origem, "01/2024");
  assert.deepEqual(result.meses_destino, ["02/2024"]);
  assert.equal(result.total_origem, 1);
  assert.equal(result.total_criadas, 1);
  assert.equal(createdRecords.length, 1);
  assert.equal(createdRecords[0].vencimento, "29/02/2024");
  assert.equal(createdRecords[0].mes, "02/2024");
};

const atualizaVencimentoExistenteSemDuplicar = async () => {
  const service = new TransacaoService();
  const updateCalls: Array<{
    id: number;
    data: Partial<TransacaoCreateInput>;
  }> = [];
  const createManyCalls: TransacaoCreateInput[][] = [];

  const origem = createTransacaoOrigem({
    id: 2,
    mes: "01/2025",
    vencimento: "31/01/2025",
    situacao: "PAGO",
    valor: 300,
  });

  const existenteDestino = createTransacaoOrigem({
    id: 77,
    mes: "03/2025",
    vencimento: "30/03/2025",
    situacao: "PAGO",
    valor: 300,
  });

  setTransacaoRepository(service, {
    async findByMes(mes: string): Promise<TransacaoSemAuditoria[]> {
      if (mes === "01/2025") return [origem];
      if (mes === "03/2025") return [existenteDestino];
      return [];
    },
    async createMany(records: TransacaoCreateInput[]): Promise<number> {
      createManyCalls.push(records);
      return records.length;
    },
    async update(
      id: number,
      data: Partial<TransacaoCreateInput>,
    ): Promise<unknown> {
      updateCalls.push({ id, data });
      return null;
    },
  });

  const result = await service.copyTransacoesByMes("01/2025", ["03/2025"]);

  assert.equal(result.total_criadas, 0);
  assert.equal(createManyCalls.length, 1);
  assert.equal(createManyCalls[0].length, 0);
  assert.equal(updateCalls.length, 1);
  assert.equal(updateCalls[0].id, 77);
  assert.deepEqual(updateCalls[0].data, { vencimento: "31/03/2025" });
};

const bloqueiaLoteMaiorQueDoze = async () => {
  const service = new TransacaoService();
  const transacoes = Array.from({ length: 13 }, (_, index) => ({
    mes: "03/2026",
    vencimento: "10/03/2026",
    tipo: "DESPESA" as const,
    categoria_id: 1,
    descricao_id: 1,
    banco_id: 1,
    situacao: "PENDENTE" as const,
    valor: 100 + index,
  }));

  await assert.rejects(
    async () => service.createTransacoesBatch(transacoes),
    (error: unknown) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.statusCode, 400);
      assert.match(error.message, /12 transa(?:coes|ções)/i);
      return true;
    },
  );
};

const bloqueiaLoteVazio = async () => {
  const service = new TransacaoService();

  await assert.rejects(
    async () => service.createTransacoesBatch([]),
    (error: unknown) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.statusCode, 400);
      assert.match(error.message, /ao menos uma transa/i);
      return true;
    },
  );
};

const getByIdRetorna404QuandoNaoEncontrada = async () => {
  const service = new TransacaoService();
  setTransacaoRepository(service, {
    async findById(): Promise<TransacaoSemAuditoria | null> {
      return null;
    },
  });

  await assert.rejects(
    async () => service.getById(999),
    (error: unknown) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.statusCode, 404);
      assert.match(error.message, /transa/i);
      return true;
    },
  );
};

const deleteTransacaoMapeiaErroDeChaveEstrangeira = async () => {
  const service = new TransacaoService();
  setTransacaoRepository(service, {
    async exists(): Promise<boolean> {
      return true;
    },
    async delete(): Promise<boolean> {
      throw { code: "ER_ROW_IS_REFERENCED_2" };
    },
  });

  await assert.rejects(
    async () => service.deleteTransacao(10),
    (error: unknown) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.statusCode, 409);
      assert.match(error.message, /n[aã]o [eé] poss[íi]vel excluir/i);
      return true;
    },
  );
};

const deleteTransacoesByMesesExigeAoMenosUmMes = async () => {
  const service = new TransacaoService();

  await assert.rejects(
    async () => service.deleteTransacoesByMeses([]),
    (error: unknown) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.statusCode, 400);
      assert.match(error.message, /ao menos um m[eê]s/i);
      return true;
    },
  );
};

const deleteTransacaoByMesesValidaId = async () => {
  const service = new TransacaoService();

  await assert.rejects(
    async () => service.deleteTransacaoByMeses(0, ["01/2026"]),
    (error: unknown) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.statusCode, 400);
      assert.match(error.message, /transa/i);
      return true;
    },
  );
};

const deleteTransacaoByMesesRetorna404QuandoNaoEncontraOrigem = async () => {
  const service = new TransacaoService();
  setTransacaoRepository(service, {
    async findById(): Promise<TransacaoSemAuditoria | null> {
      return null;
    },
  });

  await assert.rejects(
    async () => service.deleteTransacaoByMeses(15, ["01/2026"]),
    (error: unknown) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.statusCode, 404);
      assert.match(error.message, /transa/i);
      return true;
    },
  );
};

const copyTransacoesByMesExigeDestinoDiferenteDaOrigem = async () => {
  const service = new TransacaoService();

  await assert.rejects(
    async () => service.copyTransacoesByMes("01/2026", ["01/2026"]),
    (error: unknown) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.statusCode, 400);
      assert.match(error.message, /m[eê]s de destino/i);
      return true;
    },
  );
};

const copyTransacoesByMesRetorna404SemDadosNaOrigem = async () => {
  const service = new TransacaoService();
  setTransacaoRepository(service, {
    async findByMes(): Promise<TransacaoSemAuditoria[]> {
      return [];
    },
  });

  await assert.rejects(
    async () => service.copyTransacoesByMes("01/2026", ["02/2026"]),
    (error: unknown) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.statusCode, 404);
      assert.match(error.message, /m[eê]s de origem/i);
      return true;
    },
  );
};

export const transacaoServiceTests: TestCase[] = [
  {
    name: "TransacaoService: copia transacoes com ajuste de fim de mes",
    run: copiaAjustaVencimentoFimMes,
  },
  {
    name: "TransacaoService: atualiza vencimento existente sem duplicar",
    run: atualizaVencimentoExistenteSemDuplicar,
  },
  {
    name: "TransacaoService: bloqueia criacao em lote maior que 12",
    run: bloqueiaLoteMaiorQueDoze,
  },
  {
    name: "TransacaoService: bloqueia criacao em lote vazio",
    run: bloqueiaLoteVazio,
  },
  {
    name: "TransacaoService: getById retorna 404 quando nao encontrada",
    run: getByIdRetorna404QuandoNaoEncontrada,
  },
  {
    name: "TransacaoService: delete mapeia erro de chave estrangeira",
    run: deleteTransacaoMapeiaErroDeChaveEstrangeira,
  },
  {
    name: "TransacaoService: deleteTransacoesByMeses exige lista",
    run: deleteTransacoesByMesesExigeAoMenosUmMes,
  },
  {
    name: "TransacaoService: deleteTransacaoByMeses valida id",
    run: deleteTransacaoByMesesValidaId,
  },
  {
    name: "TransacaoService: deleteTransacaoByMeses retorna 404 sem origem",
    run: deleteTransacaoByMesesRetorna404QuandoNaoEncontraOrigem,
  },
  {
    name: "TransacaoService: copyByMonth exige destino diferente",
    run: copyTransacoesByMesExigeDestinoDiferenteDaOrigem,
  },
  {
    name: "TransacaoService: copyByMonth retorna 404 sem transacoes na origem",
    run: copyTransacoesByMesRetorna404SemDadosNaOrigem,
  },
];
