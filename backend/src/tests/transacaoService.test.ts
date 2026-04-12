import assert from "node:assert/strict";
import { AppError } from "../middlewares/errorHandler";
import { Transacao } from "../models/Transacao";
import transacaoService from "../services/transacaoService";
import transacaoRepository from "../repositories/transacaoRepository";
import bankRepository from "../repositories/bankRepository";
import categoryRepository from "../repositories/categoryRepository";
import descricaoRepository from "../repositories/descricaoRepository";
import { TestCase } from "./types";

type TransacaoSemAuditoria = Omit<Transacao, "created_at" | "updated_at">;
type TransacaoCreateInput = Omit<Transacao, "id" | "created_at" | "updated_at">;

const originalTransacaoRepo = { ...transacaoRepository };
const originalBankRepo = { ...bankRepository };
const originalCategoryRepo = { ...categoryRepository };
const originalDescricaoRepo = { ...descricaoRepository };

const restoreAllRepos = () => {
  Object.assign(transacaoRepository, originalTransacaoRepo);
  Object.assign(bankRepository, originalBankRepo);
  Object.assign(categoryRepository, originalCategoryRepo);
  Object.assign(descricaoRepository, originalDescricaoRepo);
};

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
  const createdRecords: TransacaoCreateInput[] = [];
  const findByMesCalls: string[] = [];

  try {
    transacaoRepository.findByMes = async (mes: string): Promise<TransacaoSemAuditoria[]> => {
      findByMesCalls.push(mes);
      if (mes === "01/2024") {
        return [createTransacaoOrigem()];
      }
      return [];
    };
    transacaoRepository.createMany = async (records: TransacaoCreateInput[]): Promise<number> => {
      createdRecords.push(...records);
      return records.length;
    };

    const result = await transacaoService.copyTransacoesByMes("2024-01", ["2024-02"]);

    assert.deepEqual(findByMesCalls, ["01/2024", "02/2024"]);
    assert.equal(result.mes_origem, "01/2024");
    assert.deepEqual(result.meses_destino, ["02/2024"]);
    assert.equal(result.total_origem, 1);
    assert.equal(result.total_criadas, 1);
    assert.equal(createdRecords.length, 1);
    assert.equal(createdRecords[0].vencimento, "29/02/2024");
    assert.equal(createdRecords[0].mes, "02/2024");
  } finally {
    restoreAllRepos();
  }
};

const atualizaVencimentoExistenteSemDuplicar = async () => {
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

  try {
    transacaoRepository.findByMes = async (mes: string): Promise<TransacaoSemAuditoria[]> => {
      if (mes === "01/2025") return [origem];
      if (mes === "03/2025") return [existenteDestino];
      return [];
    };
    transacaoRepository.createMany = async (records: TransacaoCreateInput[]): Promise<number> => {
      createManyCalls.push(records);
      return records.length;
    };
    transacaoRepository.update = async (
      id: number,
      data: Partial<TransacaoCreateInput>,
    ): Promise<any> => {
      updateCalls.push({ id, data });
      return null;
    };

    const result = await transacaoService.copyTransacoesByMes("01/2025", ["03/2025"]);

    assert.equal(result.total_criadas, 0);
    assert.equal(createManyCalls.length, 1);
    assert.equal(createManyCalls[0].length, 0);
    assert.equal(updateCalls.length, 1);
    assert.equal(updateCalls[0].id, 77);
    assert.deepEqual(updateCalls[0].data, { vencimento: "31/03/2025" });
  } finally {
    restoreAllRepos();
  }
};

const bloqueiaLoteMaiorQueDoze = async () => {
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
    async () => transacaoService.createTransacoesBatch(transacoes),
    (error: unknown) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.statusCode, 400);
      assert.match(error.message, /12 transa(?:coes|ções)/i);
      return true;
    },
  );
};

const bloqueiaLoteVazio = async () => {
  await assert.rejects(
    async () => transacaoService.createTransacoesBatch([]),
    (error: unknown) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.statusCode, 400);
      assert.match(error.message, /ao menos uma transa/i);
      return true;
    },
  );
};

const getByIdRetorna404QuandoNaoEncontrada = async () => {
  try {
    transacaoRepository.findById = async (): Promise<any> => null;

    await assert.rejects(
      async () => transacaoService.getById(999),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 404);
        assert.match(error.message, /transa/i);
        return true;
      },
    );
  } finally {
    restoreAllRepos();
  }
};

const deleteTransacaoMapeiaErroDeChaveEstrangeira = async () => {
  try {
    transacaoRepository.exists = async (): Promise<boolean> => true;
    transacaoRepository.delete = async (): Promise<boolean> => {
      throw { code: "ER_ROW_IS_REFERENCED_2" };
    };

    await assert.rejects(
      async () => transacaoService.deleteTransacao(10),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 409);
        assert.match(error.message, /n[aã]o [eé] poss[íi]vel excluir/i);
        return true;
      },
    );
  } finally {
    restoreAllRepos();
  }
};

const deleteTransacoesByMesesExigeAoMenosUmMes = async () => {
  await assert.rejects(
    async () => transacaoService.deleteTransacoesByMeses([]),
    (error: unknown) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.statusCode, 400);
      assert.match(error.message, /ao menos um m[eê]s/i);
      return true;
    },
  );
};

const deleteTransacaoByMesesValidaId = async () => {
  await assert.rejects(
    async () => transacaoService.deleteTransacaoByMeses(0, ["01/2026"]),
    (error: unknown) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.statusCode, 400);
      assert.match(error.message, /transa/i);
      return true;
    },
  );
};

const deleteTransacaoByMesesRetorna404QuandoNaoEncontraOrigem = async () => {
  try {
    transacaoRepository.findById = async (): Promise<any> => null;

    await assert.rejects(
      async () => transacaoService.deleteTransacaoByMeses(15, ["01/2026"]),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 404);
        assert.match(error.message, /transa/i);
        return true;
      },
    );
  } finally {
    restoreAllRepos();
  }
};

const copyTransacoesByMesExigeDestinoDiferenteDaOrigem = async () => {
  await assert.rejects(
    async () => transacaoService.copyTransacoesByMes("01/2026", ["01/2026"]),
    (error: unknown) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.statusCode, 400);
      assert.match(error.message, /m[eê]s de destino/i);
      return true;
    },
  );
};

const copyTransacoesByMesRetorna404SemDadosNaOrigem = async () => {
  try {
    transacaoRepository.findByMes = async (): Promise<any[]> => [];

    await assert.rejects(
      async () => transacaoService.copyTransacoesByMes("01/2026", ["02/2026"]),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 404);
        assert.match(error.message, /m[eê]s de origem/i);
        return true;
      },
    );
  } finally {
    restoreAllRepos();
  }
};

const createTransacaoComReferenciasValidas = async () => {
  let payloadCriado: TransacaoCreateInput | undefined;

  try {
    transacaoRepository.create = async (data: TransacaoCreateInput): Promise<any> => {
      payloadCriado = data;
      return { id: 70, ...data };
    };
    bankRepository.findById = async (id: number): Promise<any> => ({ id });
    categoryRepository.findById = async (id: number): Promise<any> => ({ id, tipo: "DESPESA" });
    descricaoRepository.findById = async (id: number): Promise<any> => ({ id, categoria_id: 10 });

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

    const result = await transacaoService.createTransacao(data);

    assert.ok(payloadCriado);
    assert.equal(payloadCriado.mes, "04/2026");
    assert.equal((result as { id?: number }).id, 70);
  } finally {
    restoreAllRepos();
  }
};

const createTransacaoFalhaQuandoTipoDaCategoriaDiverge = async () => {
  try {
    bankRepository.findById = async (id: number): Promise<any> => ({ id });
    categoryRepository.findById = async (id: number): Promise<any> => ({ id, tipo: "RECEITA" });
    descricaoRepository.findById = async (id: number): Promise<any> => ({ id, categoria_id: 10 });

    await assert.rejects(
      async () =>
        transacaoService.createTransacao({
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
  } finally {
    restoreAllRepos();
  }
};

const createTransacoesBatchAproveitaCacheDeReferencias = async () => {
  let bancoCalls = 0;
  let categoriaCalls = 0;
  let descricaoCalls = 0;

  try {
    transacaoRepository.createMany = async (records: TransacaoCreateInput[]): Promise<number> => {
      return records.length;
    };
    bankRepository.findById = async (id: number): Promise<any> => {
      bancoCalls += 1;
      return { id };
    };
    categoryRepository.findById = async (id: number): Promise<any> => {
      categoriaCalls += 1;
      return { id, tipo: "DESPESA" };
    };
    descricaoRepository.findById = async (id: number): Promise<any> => {
      descricaoCalls += 1;
      return { id, categoria_id: 10 };
    };

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

    const result = await transacaoService.createTransacoesBatch(transacoes);

    assert.equal(result.total_recebidas, 2);
    assert.equal(result.total_criadas, 2);
    assert.equal(bancoCalls, 1);
    assert.equal(categoriaCalls, 1);
    assert.equal(descricaoCalls, 1);
  } finally {
    restoreAllRepos();
  }
};

const updateTransacaoRetorna404QuandoBancoNaoExiste = async () => {
  try {
    transacaoRepository.exists = async (): Promise<boolean> => true;
    bankRepository.findById = async (): Promise<any> => null;

    await assert.rejects(
      async () =>
        transacaoService.updateTransacao(1, {
          banco_id: 999,
        }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 404);
        assert.match(error.message, /banco/i);
        return true;
      },
    );
  } finally {
    restoreAllRepos();
  }
};

const updateTransacaoAtualizaQuandoDadosValidos = async () => {
  let payloadAtualizado: Partial<TransacaoCreateInput> | undefined;

  try {
    transacaoRepository.exists = async (): Promise<boolean> => true;
    transacaoRepository.update = async (
      id: number,
      data: Partial<TransacaoCreateInput>,
    ): Promise<any> => {
      payloadAtualizado = data;
      return { id, ...data };
    };
    bankRepository.findById = async (id: number): Promise<any> => ({ id });
    categoryRepository.findById = async (id: number): Promise<any> => ({ id, tipo: "DESPESA" });
    descricaoRepository.findById = async (id: number): Promise<any> => ({ id, categoria_id: 10 });

    const result = await transacaoService.updateTransacao(2, {
      tipo: "DESPESA",
      categoria_id: 10,
      descricao_id: 20,
      banco_id: 30,
      situacao: "PAGO",
    });

    assert.ok(payloadAtualizado);
    assert.equal(payloadAtualizado.situacao, "PAGO");
    assert.equal((result as { id?: number }).id, 2);
  } finally {
    restoreAllRepos();
  }
};

const deleteTransacaoRetorna404QuandoNaoExiste = async () => {
  try {
    transacaoRepository.exists = async (): Promise<boolean> => false;

    await assert.rejects(
      async () => transacaoService.deleteTransacao(99),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 404);
        assert.match(error.message, /transa/i);
        return true;
      },
    );
  } finally {
    restoreAllRepos();
  }
};

const deleteTransacaoConverteErroGenericoPara500 = async () => {
  try {
    transacaoRepository.exists = async (): Promise<boolean> => true;
    transacaoRepository.delete = async (): Promise<boolean> => {
      throw new Error("falha generica");
    };

    await assert.rejects(
      async () => transacaoService.deleteTransacao(3),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 500);
        assert.match(error.message, /erro ao excluir/i);
        return true;
      },
    );
  } finally {
    restoreAllRepos();
  }
};

const deleteTransacoesByMesesNormalizaEDeduplica = async () => {
  let mesesRecebidos: string[] = [];

  try {
    transacaoRepository.deleteByMeses = async (meses: string[]): Promise<number> => {
      mesesRecebidos = meses;
      return 4;
    };

    const result = await transacaoService.deleteTransacoesByMeses([
      "2026-02",
      "02/2026",
      "03/2026",
    ]);

    assert.deepEqual(mesesRecebidos, ["02/2026", "03/2026"]);
    assert.deepEqual(result.meses, ["02/2026", "03/2026"]);
    assert.equal(result.total_excluidas, 4);
  } finally {
    restoreAllRepos();
  }
};

const deleteTransacaoByMesesExcluiIdsCorrespondentes = async () => {
  let idsExcluidos: number[] = [];

  const origem = createTransacaoOrigem({
    id: 9,
    mes: "01/2026",
    vencimento: "31/01/2026",
    situacao: "PENDENTE",
    valor: 250,
  });

  try {
    transacaoRepository.findById = async (): Promise<any> => origem;
    transacaoRepository.findByMes = async (mes: string): Promise<any[]> => {
      if (mes === "01/2026") return [origem];
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
    };
    transacaoRepository.deleteByIds = async (ids: number[]): Promise<number> => {
      idsExcluidos = ids;
      return ids.length;
    };

    const result = await transacaoService.deleteTransacaoByMeses(9, [
      "01/2026",
      "2026-02",
    ]);

    assert.deepEqual(result.meses, ["01/2026", "02/2026"]);
    assert.equal(result.total_excluidas, 2);
    assert.deepEqual(idsExcluidos.sort((a, b) => a - b), [9, 21]);
  } finally {
    restoreAllRepos();
  }
};

const deleteTransacaoByMesesFalhaSemIndiceOrigem = async () => {
  const origem = createTransacaoOrigem({
    id: 99,
    mes: "01/2026",
    vencimento: "31/01/2026",
  });

  try {
    transacaoRepository.findById = async (): Promise<any> => origem;
    transacaoRepository.findByMes = async (mes: string): Promise<any[]> => {
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
    };

    await assert.rejects(
      async () => transacaoService.deleteTransacaoByMeses(99, ["01/2026"]),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 500);
        assert.match(error.message, /n[aã]o foi poss[íi]vel localizar/i);
        return true;
      },
    );
  } finally {
    restoreAllRepos();
  }
};

const getSummaryRepassaFiltrosParaRepositorio = async () => {
  let filtrosRecebidos: any;

  try {
    transacaoRepository.getSummary = async (filters: any): Promise<any> => {
      filtrosRecebidos = filters;
      return { total_pago: 123 };
    };

    const result = await transacaoService.getSummary({
      tipo: "RECEITA",
      ano: "2026",
    });

    assert.equal((result as { total_pago?: number }).total_pago, 123);
    assert.deepEqual(filtrosRecebidos, { tipo: "RECEITA", ano: "2026" });
  } finally {
    restoreAllRepos();
  }
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
