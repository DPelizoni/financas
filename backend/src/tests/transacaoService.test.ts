import assert from "node:assert/strict";
import { AppError } from "../middlewares/errorHandler";
import { Transacao } from "../models/Transacao";
import { TransacaoService } from "../services/transacaoService";
import { TestCase } from "./types";

type TransacaoSemAuditoria = Omit<Transacao, "created_at" | "updated_at">;
type TransacaoCreateInput = Omit<Transacao, "id" | "created_at" | "updated_at">;

interface TransacaoRepositoryMock {
  findAll(filters: Record<string, unknown>): Promise<unknown>;
  create(data: TransacaoCreateInput): Promise<unknown>;
  findByMes(mes: string): Promise<TransacaoSemAuditoria[]>;
  createMany(records: TransacaoCreateInput[]): Promise<number>;
  update(id: number, data: Partial<TransacaoCreateInput>): Promise<unknown>;
  findById(id: number): Promise<TransacaoSemAuditoria | null>;
  exists(id: number): Promise<boolean>;
  delete(id: number): Promise<boolean>;
  deleteByMeses(meses: string[]): Promise<number>;
  deleteByIds(ids: number[]): Promise<number>;
  getSummary(filters: Record<string, unknown>): Promise<unknown>;
}

interface RefRepositoryMock {
  findById(id: number): Promise<unknown>;
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
    async findAll(): Promise<unknown> {
      return { transacoes: [], total: 0 };
    },
    async create(data: TransacaoCreateInput): Promise<unknown> {
      return { id: 1, ...data };
    },
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
    async getSummary(): Promise<unknown> {
      return { total_pago: 0 };
    },
    ...overrides,
  };

  (
    service as unknown as { transacaoRepository: TransacaoRepositoryMock }
  ).transacaoRepository = repositoryMock;
};

const setReferenceRepositories = (
  service: TransacaoService,
  overrides?: {
    bankRepository?: Partial<RefRepositoryMock>;
    categoryRepository?: Partial<RefRepositoryMock>;
    descricaoRepository?: Partial<RefRepositoryMock>;
  },
) => {
  const bankRepository: RefRepositoryMock = {
    async findById(id: number): Promise<unknown> {
      return { id };
    },
    ...overrides?.bankRepository,
  };

  const categoryRepository: RefRepositoryMock = {
    async findById(id: number): Promise<unknown> {
      return { id, tipo: "DESPESA" };
    },
    ...overrides?.categoryRepository,
  };

  const descricaoRepository: RefRepositoryMock = {
    async findById(id: number): Promise<unknown> {
      return { id, categoria_id: 10 };
    },
    ...overrides?.descricaoRepository,
  };

  (
    service as unknown as {
      bankRepository: RefRepositoryMock;
      categoryRepository: RefRepositoryMock;
      descricaoRepository: RefRepositoryMock;
    }
  ).bankRepository = bankRepository;

  (
    service as unknown as {
      bankRepository: RefRepositoryMock;
      categoryRepository: RefRepositoryMock;
      descricaoRepository: RefRepositoryMock;
    }
  ).categoryRepository = categoryRepository;

  (
    service as unknown as {
      bankRepository: RefRepositoryMock;
      categoryRepository: RefRepositoryMock;
      descricaoRepository: RefRepositoryMock;
    }
  ).descricaoRepository = descricaoRepository;
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

const createTransacaoComReferenciasValidas = async () => {
  const service = new TransacaoService();
  let payloadCriado: TransacaoCreateInput | undefined;

  setTransacaoRepository(service, {
    async create(data: TransacaoCreateInput): Promise<unknown> {
      payloadCriado = data;
      return { id: 70, ...data };
    },
  });

  setReferenceRepositories(service, {
    bankRepository: {
      async findById(id: number): Promise<unknown> {
        return { id };
      },
    },
    categoryRepository: {
      async findById(id: number): Promise<unknown> {
        return { id, tipo: "DESPESA" };
      },
    },
    descricaoRepository: {
      async findById(id: number): Promise<unknown> {
        return { id, categoria_id: 10 };
      },
    },
  });

  const data: TransacaoCreateInput = {
    mes: "04/2026",
    vencimento: "10/04/2026",
    tipo: "DESPESA",
    categoria_id: 10,
    descricao_id: 20,
    banco_id: 30,
    situacao: "PENDENTE",
    valor: 199.9,
  };

  const result = await service.createTransacao(data);

  assert.ok(payloadCriado);
  assert.equal(payloadCriado.mes, "04/2026");
  assert.equal((result as { id?: number }).id, 70);
};

const createTransacaoFalhaQuandoTipoDaCategoriaDiverge = async () => {
  const service = new TransacaoService();

  setReferenceRepositories(service, {
    bankRepository: {
      async findById(id: number): Promise<unknown> {
        return { id };
      },
    },
    categoryRepository: {
      async findById(id: number): Promise<unknown> {
        return { id, tipo: "RECEITA" };
      },
    },
    descricaoRepository: {
      async findById(id: number): Promise<unknown> {
        return { id, categoria_id: 10 };
      },
    },
  });

  await assert.rejects(
    async () =>
      service.createTransacao({
        mes: "04/2026",
        vencimento: "10/04/2026",
        tipo: "DESPESA",
        categoria_id: 10,
        descricao_id: 20,
        banco_id: 30,
        situacao: "PENDENTE",
        valor: 50,
      }),
    (error: unknown) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.statusCode, 400);
      assert.match(error.message, /categoria/i);
      return true;
    },
  );
};

const createTransacoesBatchAproveitaCacheDeReferencias = async () => {
  const service = new TransacaoService();
  let bancoCalls = 0;
  let categoriaCalls = 0;
  let descricaoCalls = 0;

  setTransacaoRepository(service, {
    async createMany(records: TransacaoCreateInput[]): Promise<number> {
      return records.length;
    },
  });

  setReferenceRepositories(service, {
    bankRepository: {
      async findById(id: number): Promise<unknown> {
        bancoCalls += 1;
        return { id };
      },
    },
    categoryRepository: {
      async findById(id: number): Promise<unknown> {
        categoriaCalls += 1;
        return { id, tipo: "DESPESA" };
      },
    },
    descricaoRepository: {
      async findById(id: number): Promise<unknown> {
        descricaoCalls += 1;
        return { id, categoria_id: 10 };
      },
    },
  });

  const transacoes: TransacaoCreateInput[] = [
    {
      mes: "04/2026",
      vencimento: "10/04/2026",
      tipo: "DESPESA",
      categoria_id: 10,
      descricao_id: 20,
      banco_id: 30,
      situacao: "PENDENTE",
      valor: 100,
    },
    {
      mes: "04/2026",
      vencimento: "15/04/2026",
      tipo: "DESPESA",
      categoria_id: 10,
      descricao_id: 20,
      banco_id: 30,
      situacao: "PAGO",
      valor: 120,
    },
  ];

  const result = await service.createTransacoesBatch(transacoes);

  assert.equal(result.total_recebidas, 2);
  assert.equal(result.total_criadas, 2);
  assert.equal(bancoCalls, 1);
  assert.equal(categoriaCalls, 1);
  assert.equal(descricaoCalls, 1);
};

const updateTransacaoRetorna404QuandoBancoNaoExiste = async () => {
  const service = new TransacaoService();

  setTransacaoRepository(service, {
    async exists(): Promise<boolean> {
      return true;
    },
  });

  setReferenceRepositories(service, {
    bankRepository: {
      async findById(): Promise<unknown> {
        return null;
      },
    },
  });

  await assert.rejects(
    async () =>
      service.updateTransacao(1, {
        banco_id: 999,
      }),
    (error: unknown) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.statusCode, 404);
      assert.match(error.message, /banco/i);
      return true;
    },
  );
};

const updateTransacaoAtualizaQuandoDadosValidos = async () => {
  const service = new TransacaoService();
  let payloadAtualizado: Partial<TransacaoCreateInput> | undefined;

  setTransacaoRepository(service, {
    async exists(): Promise<boolean> {
      return true;
    },
    async update(
      id: number,
      data: Partial<TransacaoCreateInput>,
    ): Promise<unknown> {
      payloadAtualizado = data;
      return { id, ...data };
    },
  });

  setReferenceRepositories(service, {
    bankRepository: {
      async findById(id: number): Promise<unknown> {
        return { id };
      },
    },
    categoryRepository: {
      async findById(id: number): Promise<unknown> {
        return { id, tipo: "DESPESA" };
      },
    },
    descricaoRepository: {
      async findById(id: number): Promise<unknown> {
        return { id, categoria_id: 10 };
      },
    },
  });

  const result = await service.updateTransacao(2, {
    tipo: "DESPESA",
    categoria_id: 10,
    descricao_id: 20,
    banco_id: 30,
    situacao: "PAGO",
  });

  assert.ok(payloadAtualizado);
  assert.equal(payloadAtualizado.situacao, "PAGO");
  assert.equal((result as { id?: number }).id, 2);
};

const deleteTransacaoRetorna404QuandoNaoExiste = async () => {
  const service = new TransacaoService();

  setTransacaoRepository(service, {
    async exists(): Promise<boolean> {
      return false;
    },
  });

  await assert.rejects(
    async () => service.deleteTransacao(99),
    (error: unknown) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.statusCode, 404);
      assert.match(error.message, /transa/i);
      return true;
    },
  );
};

const deleteTransacaoConverteErroGenericoPara500 = async () => {
  const service = new TransacaoService();

  setTransacaoRepository(service, {
    async exists(): Promise<boolean> {
      return true;
    },
    async delete(): Promise<boolean> {
      throw new Error("falha generica");
    },
  });

  await assert.rejects(
    async () => service.deleteTransacao(3),
    (error: unknown) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.statusCode, 500);
      assert.match(error.message, /erro ao excluir/i);
      return true;
    },
  );
};

const deleteTransacoesByMesesNormalizaEDeduplica = async () => {
  const service = new TransacaoService();
  let mesesRecebidos: string[] = [];

  setTransacaoRepository(service, {
    async deleteByMeses(meses: string[]): Promise<number> {
      mesesRecebidos = meses;
      return 4;
    },
  });

  const result = await service.deleteTransacoesByMeses([
    "2026-02",
    "02/2026",
    "03/2026",
  ]);

  assert.deepEqual(mesesRecebidos, ["02/2026", "03/2026"]);
  assert.deepEqual(result.meses, ["02/2026", "03/2026"]);
  assert.equal(result.total_excluidas, 4);
};

const deleteTransacaoByMesesExcluiIdsCorrespondentes = async () => {
  const service = new TransacaoService();
  let idsExcluidos: number[] = [];

  const origem = createTransacaoOrigem({
    id: 9,
    mes: "01/2026",
    vencimento: "31/01/2026",
    situacao: "PENDENTE",
    valor: 250,
  });

  setTransacaoRepository(service, {
    async findById(): Promise<TransacaoSemAuditoria | null> {
      return origem;
    },
    async findByMes(mes: string): Promise<TransacaoSemAuditoria[]> {
      if (mes === "01/2026") {
        return [origem];
      }

      if (mes === "02/2026") {
        return [
          createTransacaoOrigem({
            id: 21,
            mes: "02/2026",
            vencimento: "28/02/2026",
            situacao: "PENDENTE",
            valor: 250,
          }),
        ];
      }

      return [];
    },
    async deleteByIds(ids: number[]): Promise<number> {
      idsExcluidos = ids;
      return ids.length;
    },
  });

  const result = await service.deleteTransacaoByMeses(9, [
    "01/2026",
    "2026-02",
  ]);

  assert.deepEqual(result.meses, ["01/2026", "02/2026"]);
  assert.equal(result.total_excluidas, 2);
  assert.deepEqual(idsExcluidos.sort((a, b) => a - b), [9, 21]);
};

const deleteTransacaoByMesesFalhaSemIndiceOrigem = async () => {
  const service = new TransacaoService();

  const origem = createTransacaoOrigem({
    id: 99,
    mes: "01/2026",
    vencimento: "31/01/2026",
  });

  setTransacaoRepository(service, {
    async findById(): Promise<TransacaoSemAuditoria | null> {
      return origem;
    },
    async findByMes(mes: string): Promise<TransacaoSemAuditoria[]> {
      if (mes === "01/2026") {
        return [
          createTransacaoOrigem({
            id: 10,
            mes: "01/2026",
            vencimento: "31/01/2026",
          }),
        ];
      }

      return [];
    },
  });

  await assert.rejects(
    async () => service.deleteTransacaoByMeses(99, ["01/2026"]),
    (error: unknown) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.statusCode, 500);
      assert.match(error.message, /n[aã]o foi poss[íi]vel localizar/i);
      return true;
    },
  );
};

const getSummaryRepassaFiltrosParaRepositorio = async () => {
  const service = new TransacaoService();
  let filtrosRecebidos: Record<string, unknown> | undefined;

  setTransacaoRepository(service, {
    async getSummary(filters: Record<string, unknown>): Promise<unknown> {
      filtrosRecebidos = filters;
      return { total_pago: 123 };
    },
  });

  const result = await service.getSummary({
    tipo: "RECEITA",
    ano: "2026",
  });

  assert.equal((result as { total_pago?: number }).total_pago, 123);
  assert.deepEqual(filtrosRecebidos, { tipo: "RECEITA", ano: "2026" });
};

export const transacaoServiceTests: TestCase[] = [
  {
    name: "TransacaoService: create valida referencias e persiste",
    run: createTransacaoComReferenciasValidas,
  },
  {
    name: "TransacaoService: create falha com tipo de categoria divergente",
    run: createTransacaoFalhaQuandoTipoDaCategoriaDiverge,
  },
  {
    name: "TransacaoService: batch reutiliza cache de referencias",
    run: createTransacoesBatchAproveitaCacheDeReferencias,
  },
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
    name: "TransacaoService: update retorna 404 quando banco nao existe",
    run: updateTransacaoRetorna404QuandoBancoNaoExiste,
  },
  {
    name: "TransacaoService: update persiste quando referencias sao validas",
    run: updateTransacaoAtualizaQuandoDadosValidos,
  },
  {
    name: "TransacaoService: delete retorna 404 quando transacao nao existe",
    run: deleteTransacaoRetorna404QuandoNaoExiste,
  },
  {
    name: "TransacaoService: delete mapeia erro de chave estrangeira",
    run: deleteTransacaoMapeiaErroDeChaveEstrangeira,
  },
  {
    name: "TransacaoService: delete converte erro generico para 500",
    run: deleteTransacaoConverteErroGenericoPara500,
  },
  {
    name: "TransacaoService: getSummary repassa filtros para repositorio",
    run: getSummaryRepassaFiltrosParaRepositorio,
  },
  {
    name: "TransacaoService: deleteTransacoesByMeses exige lista",
    run: deleteTransacoesByMesesExigeAoMenosUmMes,
  },
  {
    name: "TransacaoService: deleteTransacoesByMeses normaliza e deduplica",
    run: deleteTransacoesByMesesNormalizaEDeduplica,
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
    name: "TransacaoService: deleteTransacaoByMeses exclui ids correspondentes",
    run: deleteTransacaoByMesesExcluiIdsCorrespondentes,
  },
  {
    name: "TransacaoService: deleteTransacaoByMeses falha sem indice de origem",
    run: deleteTransacaoByMesesFalhaSemIndiceOrigem,
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
