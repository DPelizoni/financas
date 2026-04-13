import assert from "node:assert/strict";
import { AppError } from "../middlewares/errorHandler";
import {
  InvestimentoAtivo,
  InvestimentoAtivoInput,
  InvestimentoDashboardFilters,
  InvestimentoMovimentacao,
  InvestimentoMovimentacaoFilters,
  InvestimentoMovimentacaoInput,
} from "../models/Investimento";
import investimentoAtivoService from "../services/investimentoAtivoService";
import investimentoDashboardService from "../services/investimentoDashboardService";
import investimentoMovimentacaoService from "../services/investimentoMovimentacaoService";
import ativoRepository from "../repositories/investimentoAtivoRepository";
import movimentacaoRepository from "../repositories/investimentoMovimentacaoRepository";
import bankRepository from "../repositories/bankRepository";
import { TestCase } from "./types";

const originalAtivoRepo = { ...ativoRepository };
const originalMovimentacaoRepo = { ...movimentacaoRepository };
const originalBankRepo = { ...bankRepository };

const restoreAllRepos = () => {
  Object.assign(ativoRepository, originalAtivoRepo);
  Object.assign(movimentacaoRepository, originalMovimentacaoRepo);
  Object.assign(bankRepository, originalBankRepo);
};

const createAtivo = (
  overrides: Partial<InvestimentoAtivo> = {},
): InvestimentoAtivo => ({
  id: 1,
  nome: "Tesouro Selic",
  banco_id: 10,
  banco_nome: "Banco Teste",
  saldo_inicial: 1000,
  data_saldo_inicial: "2026-01-01",
  ativo: true,
  total_aporte: 0,
  total_resgate: 0,
  total_rendimento: 0,
  saldo_atual: 1000,
  created_at: new Date("2026-01-01T00:00:00.000Z"),
  updated_at: new Date("2026-01-01T00:00:00.000Z"),
  ...overrides,
});

const createMovimentacao = (
  overrides: Partial<InvestimentoMovimentacao> = {},
): InvestimentoMovimentacao => ({
  id: 1,
  investimento_ativo_id: 1,
  ativo_nome: "Tesouro Selic",
  ativo_status: true,
  banco_id: 10,
  banco_nome: "Banco Teste",
  tipo: "APORTE",
  data: "2026-01-20",
  valor: 500,
  created_at: new Date("2026-01-20T00:00:00.000Z"),
  updated_at: new Date("2026-01-20T00:00:00.000Z"),
  ...overrides,
});

const ativoGetAllNormalizaDatas = async () => {
  let filtrosRecebidos: any;

  try {
    ativoRepository.findAll = async (filters) => {
      filtrosRecebidos = filters;
      return { ativos: [createAtivo()], total: 1 };
    };

    const result = await investimentoAtivoService.getAllAtivos({
      page: 2,
      limit: 15,
      data_de: "01/03/2026",
      data_ate: "2026-03-31",
    });

    assert.equal(result.total, 1);
    assert.equal(result.ativos.length, 1);
    assert.equal(filtrosRecebidos?.data_de, "2026-03-01");
    assert.equal(filtrosRecebidos?.data_ate, "2026-03-31");
  } finally {
    restoreAllRepos();
  }
};

const ativoGetAllRejeitaDataInvalida = async () => {
  await assert.rejects(
    async () =>
      investimentoAtivoService.getAllAtivos({
        data_de: "2026/03/01",
      }),
    (error: unknown) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.statusCode, 400);
      assert.match(error.message, /data invalida/i);
      return true;
    },
  );
};

const ativoCreateValidaBancoENormalizaData = async () => {
  let bancoValidado: number | undefined;
  let payloadCriado: InvestimentoAtivoInput | undefined;

  try {
    bankRepository.findById = async (id: number) => {
      bancoValidado = id;
      return { id } as any;
    };
    ativoRepository.create = async (input) => {
      payloadCriado = input;
      return createAtivo({ ...input, id: 99 });
    };

    const result = await investimentoAtivoService.createAtivo({
      nome: "CDB",
      banco_id: 7,
      saldo_inicial: 5500,
      data_saldo_inicial: "09/04/2026",
    });

    assert.equal(bancoValidado, 7);
    assert.equal(payloadCriado?.data_saldo_inicial, "2026-04-09");
    assert.equal(result.id, 99);
  } finally {
    restoreAllRepos();
  }
};

const ativoUpdateRetorna404QuandoNaoExiste = async () => {
  try {
    ativoRepository.exists = async () => false;

    await assert.rejects(
      async () => investimentoAtivoService.updateAtivo(404, { nome: "Nao existe" }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 404);
        assert.match(error.message, /ativo de investimento nao encontrado/i);
        return true;
      },
    );
  } finally {
    restoreAllRepos();
  }
};

const ativoUpdateNormalizaDataEValidaBanco = async () => {
  let bancoValidado: number | undefined;
  let payloadAtualizado: Partial<InvestimentoAtivoInput> | undefined;

  try {
    ativoRepository.exists = async () => true;
    bankRepository.findById = async (id: number) => {
      bancoValidado = id;
      return { id } as any;
    };
    ativoRepository.update = async (id, input) => {
      payloadAtualizado = input;
      return createAtivo({ id, ...input });
    };

    const result = await investimentoAtivoService.updateAtivo(12, {
      nome: "LCI",
      banco_id: 5,
      data_saldo_inicial: "10/04/2026",
    });

    assert.equal(bancoValidado, 5);
    assert.equal(payloadAtualizado?.data_saldo_inicial, "2026-04-10");
    assert.equal(result.id, 12);
  } finally {
    restoreAllRepos();
  }
};

const ativoDeleteMapeiaErroFkPara409 = async () => {
  try {
    ativoRepository.exists = async () => true;
    ativoRepository.delete = async () => {
      throw { code: "ER_ROW_IS_REFERENCED_2" };
    };

    await assert.rejects(
      async () => investimentoAtivoService.deleteAtivo(7),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 409);
        assert.match(error.message, /movimentacoes vinculadas/i);
        return true;
      },
    );
  } finally {
    restoreAllRepos();
  }
};

const movimentacaoGetAllNormalizaDatas = async () => {
  let filtrosRecebidos: any;

  try {
    movimentacaoRepository.findAll = async (filters) => {
      filtrosRecebidos = filters;
      return { movimentacoes: [createMovimentacao()], total: 1 };
    };

    const result = await investimentoMovimentacaoService.getAllMovimentacoes({
      page: 1,
      limit: 10,
      data_de: "01/04/2026",
      data_ate: "2026-04-30",
    });

    assert.equal(result.total, 1);
    assert.equal(result.movimentacoes.length, 1);
    assert.equal(filtrosRecebidos?.data_de, "2026-04-01");
    assert.equal(filtrosRecebidos?.data_ate, "2026-04-30");
  } finally {
    restoreAllRepos();
  }
};

const movimentacaoGetByIdRetorna404QuandoNaoExiste = async () => {
  try {
    movimentacaoRepository.findById = async () => null;

    await assert.rejects(
      async () => investimentoMovimentacaoService.getMovimentacaoById(321),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 404);
        assert.match(error.message, /movimentacao de investimento nao encontrada/i);
        return true;
      },
    );
  } finally {
    restoreAllRepos();
  }
};

const movimentacaoCreateValidaAtivo = async () => {
  let ativoValidado: number | undefined;
  let payloadCriado: InvestimentoMovimentacaoInput | undefined;

  try {
    ativoRepository.findById = async (id: number) => {
      ativoValidado = id;
      return createAtivo({ id });
    };
    movimentacaoRepository.create = async (input) => {
      payloadCriado = input;
      return createMovimentacao({ id: 88, ...input });
    };

    const result = await investimentoMovimentacaoService.createMovimentacao({
      investimento_ativo_id: 9,
      tipo: "RENDIMENTO",
      data: "15/04/2026",
      valor: 35,
    });

    assert.equal(ativoValidado, 9);
    assert.equal(payloadCriado?.data, "2026-04-15");
    assert.equal(result.id, 88);
  } finally {
    restoreAllRepos();
  }
};

const movimentacaoUpdateNormalizaData = async () => {
  let ativoValidado: number | undefined;
  let payloadAtualizado: any;

  try {
    movimentacaoRepository.exists = async () => true;
    ativoRepository.findById = async (id: number) => {
      ativoValidado = id;
      return createAtivo({ id });
    };
    movimentacaoRepository.update = async (id, input) => {
      payloadAtualizado = input;
      return createMovimentacao({ id, ...input });
    };

    const result = await investimentoMovimentacaoService.updateMovimentacao(44, {
      investimento_ativo_id: 2,
      data: "16/04/2026",
    });

    assert.equal(ativoValidado, 2);
    assert.equal(payloadAtualizado?.data, "2026-04-16");
    assert.equal(result.id, 44);
  } finally {
    restoreAllRepos();
  }
};

const movimentacaoDeleteRetorna500QuandoRepositorioNaoExclui = async () => {
  try {
    movimentacaoRepository.exists = async () => true;
    movimentacaoRepository.delete = async () => false;

    await assert.rejects(
      async () => investimentoMovimentacaoService.deleteMovimentacao(19),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 500);
        assert.match(error.message, /erro ao excluir movimentacao/i);
        return true;
      },
    );
  } finally {
    restoreAllRepos();
  }
};

const dashboardGetAvailableYearsDelegaParaRepositorio = async () => {
  let filtrosRecebidos: any;

  try {
    movimentacaoRepository.getAvailableYears = async (filters) => {
      filtrosRecebidos = filters;
      return ["2026", "2025"];
    };

    const years = await investimentoDashboardService.getAvailableYears({
      banco_id: 3,
      ativo: false,
    });

    assert.deepEqual(years, ["2026", "2025"]);
    assert.deepEqual(filtrosRecebidos, { banco_id: 3, ativo: false });
  } finally {
    restoreAllRepos();
  }
};

const dashboardGetDashboardCalculaCardsCarteiraETimeline = async () => {
  let filtrosSummary: any;
  let filtrosCarteira: any;
  let filtrosTimeline: any;

  try {
    movimentacaoRepository.getSummary = async (filters) => {
      filtrosSummary = filters;
      return {
        aporte: 300,
        resgate: 100,
        rendimentos: 50,
        liquido: 250,
      };
    };
    movimentacaoRepository.getTimeline = async (filters) => {
      filtrosTimeline = filters;
      return [
        {
          month_key: "2026-01",
          aporte: 120,
          resgate: 20,
          rendimentos: 10,
        },
      ];
    };
    ativoRepository.findCarteira = async (filters) => {
      filtrosCarteira = filters;
      return [
        createAtivo({ id: 1, saldo_inicial: 120, saldo_atual: 150 }),
        createAtivo({ id: 2, saldo_inicial: 30, saldo_atual: 50 }),
      ];
    };

    const result = await investimentoDashboardService.getDashboard({
      banco_id: 5,
      ativo: true,
      data_de: "01/01/2026",
      data_ate: "2026-04-30",
    });

    assert.deepEqual(filtrosSummary, {
      banco_id: 5,
      ativo: true,
      data_de: "2026-01-01",
      data_ate: "2026-04-30",
    });
    assert.deepEqual(filtrosCarteira, { banco_id: 5, ativo: true });
    assert.equal(result.cards.aporte, 300);
    assert.equal(result.cards.rendimentos, 50);
    assert.equal(result.cards.resgate, 100);
    assert.equal(result.cards.liquido, 200);
    assert.equal(result.carteira.total_ativos, 2);
    assert.equal(result.carteira.saldo_total, 200);
    assert.equal(result.timeline[0].month_label, "01/26");
    assert.equal(result.timeline[0].saldo, 260);
  } finally {
    restoreAllRepos();
  }
};

export const investimentoServiceTests: TestCase[] = [
  {
    name: "InvestimentoAtivoService: getAll normaliza datas",
    run: ativoGetAllNormalizaDatas,
  },
  {
    name: "InvestimentoAtivoService: getAll rejeita data invalida",
    run: ativoGetAllRejeitaDataInvalida,
  },
  {
    name: "InvestimentoAtivoService: create valida banco e normaliza data",
    run: ativoCreateValidaBancoENormalizaData,
  },
  {
    name: "InvestimentoAtivoService: update retorna 404 sem ativo",
    run: ativoUpdateRetorna404QuandoNaoExiste,
  },
  {
    name: "InvestimentoAtivoService: update normaliza data e valida banco",
    run: ativoUpdateNormalizaDataEValidaBanco,
  },
  {
    name: "InvestimentoAtivoService: delete mapeia FK para 409",
    run: ativoDeleteMapeiaErroFkPara409,
  },
  {
    name: "InvestimentoMovimentacaoService: getAll normaliza datas",
    run: movimentacaoGetAllNormalizaDatas,
  },
  {
    name: "InvestimentoMovimentacaoService: getById retorna 404 sem registro",
    run: movimentacaoGetByIdRetorna404QuandoNaoExiste,
  },
  {
    name: "InvestimentoMovimentacaoService: create valida ativo e normaliza data",
    run: movimentacaoCreateValidaAtivo,
  },
  {
    name: "InvestimentoMovimentacaoService: update normaliza data",
    run: movimentacaoUpdateNormalizaData,
  },
  {
    name: "InvestimentoMovimentacaoService: delete retorna 500 quando nao remove",
    run: movimentacaoDeleteRetorna500QuandoRepositorioNaoExclui,
  },
  {
    name: "InvestimentoDashboardService: getAvailableYears repassa filtros",
    run: dashboardGetAvailableYearsDelegaParaRepositorio,
  },
  {
    name: "InvestimentoDashboardService: getDashboard agrega cards, carteira e timeline",
    run: dashboardGetDashboardCalculaCardsCarteiraETimeline,
  },
];
