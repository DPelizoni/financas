import assert from "node:assert/strict";
import { AppError } from "../middlewares/errorHandler";
import { Transacao } from "../models/Transacao";
import { TransacaoService } from "../services/transacaoService";

export interface TestCase {
  name: string;
  run: () => Promise<void>;
}

type TransacaoSemAuditoria = Omit<Transacao, "created_at" | "updated_at">;
type TransacaoCreateInput = Omit<Transacao, "id" | "created_at" | "updated_at">;

interface TransacaoRepositoryMock {
  findByMes(mes: string): Promise<TransacaoSemAuditoria[]>;
  createMany(records: TransacaoCreateInput[]): Promise<number>;
  update(id: number, data: Partial<TransacaoCreateInput>): Promise<unknown>;
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

const copiaAjustaVencimentoFimMes = async () => {
  const service = new TransacaoService();
  const createdRecords: TransacaoCreateInput[] = [];
  const findByMesCalls: string[] = [];

  const repositoryMock: TransacaoRepositoryMock = {
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
  };

  (
    service as unknown as { transacaoRepository: TransacaoRepositoryMock }
  ).transacaoRepository = repositoryMock;

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

  const repositoryMock: TransacaoRepositoryMock = {
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
  };

  (
    service as unknown as { transacaoRepository: TransacaoRepositoryMock }
  ).transacaoRepository = repositoryMock;

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
      assert.match(error.message, /12 transacoes/i);
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
];
