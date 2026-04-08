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
import { InvestimentoAtivoService } from "../services/investimentoAtivoService";
import { InvestimentoDashboardService } from "../services/investimentoDashboardService";
import { InvestimentoMovimentacaoService } from "../services/investimentoMovimentacaoService";
import { TestCase } from "./types";

interface AtivoRepositoryMock {
  findAll(
    filters: Record<string, unknown>,
  ): Promise<{ ativos: InvestimentoAtivo[]; total: number }>;
  getAvailableYears(filters: { banco_id?: number; ativo?: boolean }): Promise<string[]>;
  findById(id: number): Promise<InvestimentoAtivo | null>;
  create(input: InvestimentoAtivoInput): Promise<InvestimentoAtivo>;
  exists(id: number): Promise<boolean>;
  update(
    id: number,
    input: Partial<InvestimentoAtivoInput>,
  ): Promise<InvestimentoAtivo | null>;
  delete(id: number): Promise<boolean>;
  findCarteira(filters: { banco_id?: number; ativo?: boolean }): Promise<InvestimentoAtivo[]>;
}

interface MovimentacaoRepositoryMock {
  findAll(
    filters: InvestimentoMovimentacaoFilters,
  ): Promise<{ movimentacoes: InvestimentoMovimentacao[]; total: number }>;
  findById(id: number): Promise<InvestimentoMovimentacao | null>;
  create(input: InvestimentoMovimentacaoInput): Promise<InvestimentoMovimentacao>;
  exists(id: number): Promise<boolean>;
  update(
    id: number,
    input: Partial<InvestimentoMovimentacaoInput>,
  ): Promise<InvestimentoMovimentacao | null>;
  delete(id: number): Promise<boolean>;
  getSummary(filters: InvestimentoDashboardFilters): Promise<{
    aporte: number;
    resgate: number;
    rendimentos: number;
    liquido: number;
  }>;
  getTimeline(filters: InvestimentoDashboardFilters): Promise<
    Array<{
      month_key: string;
      aporte: number;
      resgate: number;
      rendimentos: number;
    }>
  >;
  getAvailableYears(filters: { banco_id?: number; ativo?: boolean }): Promise<string[]>;
}

interface BankRepositoryMock {
  findById(id: number): Promise<unknown>;
}

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

const setAtivoServiceDependencies = (
  service: InvestimentoAtivoService,
  overrides?: {
    ativoRepository?: Partial<AtivoRepositoryMock>;
    bankRepository?: Partial<BankRepositoryMock>;
  },
) => {
  const ativoRepository: AtivoRepositoryMock = {
    async findAll() {
      return { ativos: [], total: 0 };
    },
    async getAvailableYears() {
      return [];
    },
    async findById() {
      return null;
    },
    async create(input) {
      return createAtivo({ ...input, id: 20 });
    },
    async exists() {
      return false;
    },
    async update(id, input) {
      return createAtivo({ ...input, id });
    },
    async delete() {
      return true;
    },
    async findCarteira() {
      return [];
    },
    ...overrides?.ativoRepository,
  };

  const bankRepository: BankRepositoryMock = {
    async findById(id: number) {
      return { id };
    },
    ...overrides?.bankRepository,
  };

  (
    service as unknown as {
      ativoRepository: AtivoRepositoryMock;
      bankRepository: BankRepositoryMock;
    }
  ).ativoRepository = ativoRepository;
  (
    service as unknown as {
      ativoRepository: AtivoRepositoryMock;
      bankRepository: BankRepositoryMock;
    }
  ).bankRepository = bankRepository;
};

const setMovimentacaoServiceDependencies = (
  service: InvestimentoMovimentacaoService,
  overrides?: {
    movimentacaoRepository?: Partial<MovimentacaoRepositoryMock>;
    ativoRepository?: Partial<AtivoRepositoryMock>;
  },
) => {
  const movimentacaoRepository: MovimentacaoRepositoryMock = {
    async findAll() {
      return { movimentacoes: [], total: 0 };
    },
    async findById() {
      return null;
    },
    async create(input) {
      return createMovimentacao({ ...input, id: 30 });
    },
    async exists() {
      return false;
    },
    async update(id, input) {
      return createMovimentacao({ ...input, id });
    },
    async delete() {
      return true;
    },
    async getSummary() {
      return { aporte: 0, resgate: 0, rendimentos: 0, liquido: 0 };
    },
    async getTimeline() {
      return [];
    },
    async getAvailableYears() {
      return [];
    },
    ...overrides?.movimentacaoRepository,
  };

  const ativoRepository: AtivoRepositoryMock = {
    async findAll() {
      return { ativos: [], total: 0 };
    },
    async getAvailableYears() {
      return [];
    },
    async findById() {
      return null;
    },
    async create(input) {
      return createAtivo({ ...input, id: 40 });
    },
    async exists() {
      return false;
    },
    async update(id, input) {
      return createAtivo({ ...input, id });
    },
    async delete() {
      return true;
    },
    async findCarteira() {
      return [];
    },
    ...overrides?.ativoRepository,
  };

  (
    service as unknown as {
      movimentacaoRepository: MovimentacaoRepositoryMock;
      ativoRepository: AtivoRepositoryMock;
    }
  ).movimentacaoRepository = movimentacaoRepository;
  (
    service as unknown as {
      movimentacaoRepository: MovimentacaoRepositoryMock;
      ativoRepository: AtivoRepositoryMock;
    }
  ).ativoRepository = ativoRepository;
};

const setDashboardServiceDependencies = (
  service: InvestimentoDashboardService,
  overrides?: {
    ativoRepository?: Partial<AtivoRepositoryMock>;
    movimentacaoRepository?: Partial<MovimentacaoRepositoryMock>;
  },
) => {
  const ativoRepository: AtivoRepositoryMock = {
    async findAll() {
      return { ativos: [], total: 0 };
    },
    async getAvailableYears() {
      return [];
    },
    async findById() {
      return null;
    },
    async create(input) {
      return createAtivo({ ...input, id: 50 });
    },
    async exists() {
      return false;
    },
    async update(id, input) {
      return createAtivo({ ...input, id });
    },
    async delete() {
      return true;
    },
    async findCarteira() {
      return [];
    },
    ...overrides?.ativoRepository,
  };

  const movimentacaoRepository: MovimentacaoRepositoryMock = {
    async findAll() {
      return { movimentacoes: [], total: 0 };
    },
    async findById() {
      return null;
    },
    async create(input) {
      return createMovimentacao({ ...input, id: 60 });
    },
    async exists() {
      return false;
    },
    async update(id, input) {
      return createMovimentacao({ ...input, id });
    },
    async delete() {
      return true;
    },
    async getSummary() {
      return { aporte: 0, resgate: 0, rendimentos: 0, liquido: 0 };
    },
    async getTimeline() {
      return [];
    },
    async getAvailableYears() {
      return [];
    },
    ...overrides?.movimentacaoRepository,
  };

  (
    service as unknown as {
      ativoRepository: AtivoRepositoryMock;
      movimentacaoRepository: MovimentacaoRepositoryMock;
    }
  ).ativoRepository = ativoRepository;
  (
    service as unknown as {
      ativoRepository: AtivoRepositoryMock;
      movimentacaoRepository: MovimentacaoRepositoryMock;
    }
  ).movimentacaoRepository = movimentacaoRepository;
};

const ativoGetAllNormalizaDatas = async () => {
  const service = new InvestimentoAtivoService();
  let filtrosRecebidos: Record<string, unknown> | undefined;

  setAtivoServiceDependencies(service, {
    ativoRepository: {
      async findAll(filters) {
        filtrosRecebidos = filters;
        return { ativos: [createAtivo()], total: 1 };
      },
    },
  });

  const result = await service.getAllAtivos({
    page: 2,
    limit: 15,
    data_de: "01/03/2026",
    data_ate: "2026-03-31",
  });

  assert.equal(result.total, 1);
  assert.equal(result.ativos.length, 1);
  assert.equal(filtrosRecebidos?.data_de, "2026-03-01");
  assert.equal(filtrosRecebidos?.data_ate, "2026-03-31");
};

const ativoGetAllRejeitaDataInvalida = async () => {
  const service = new InvestimentoAtivoService();

  await assert.rejects(
    async () =>
      service.getAllAtivos({
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
  const service = new InvestimentoAtivoService();
  let bancoValidado: number | undefined;
  let payloadCriado: InvestimentoAtivoInput | undefined;

  setAtivoServiceDependencies(service, {
    bankRepository: {
      async findById(id: number) {
        bancoValidado = id;
        return { id };
      },
    },
    ativoRepository: {
      async create(input) {
        payloadCriado = input;
        return createAtivo({
          ...input,
          id: 99,
        });
      },
    },
  });

  const result = await service.createAtivo({
    nome: "CDB",
    banco_id: 7,
    saldo_inicial: 5500,
    data_saldo_inicial: "09/04/2026",
  });

  assert.equal(bancoValidado, 7);
  assert.equal(payloadCriado?.data_saldo_inicial, "2026-04-09");
  assert.equal(result.id, 99);
};

const ativoUpdateRetorna404QuandoNaoExiste = async () => {
  const service = new InvestimentoAtivoService();

  setAtivoServiceDependencies(service, {
    ativoRepository: {
      async exists() {
        return false;
      },
    },
  });

  await assert.rejects(
    async () => service.updateAtivo(404, { nome: "Nao existe" }),
    (error: unknown) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.statusCode, 404);
      assert.match(error.message, /ativo de investimento nao encontrado/i);
      return true;
    },
  );
};

const ativoUpdateNormalizaDataEValidaBanco = async () => {
  const service = new InvestimentoAtivoService();
  let bancoValidado: number | undefined;
  let payloadAtualizado: Partial<InvestimentoAtivoInput> | undefined;

  setAtivoServiceDependencies(service, {
    ativoRepository: {
      async exists() {
        return true;
      },
      async update(id, input) {
        payloadAtualizado = input;
        return createAtivo({ id, ...input });
      },
    },
    bankRepository: {
      async findById(id: number) {
        bancoValidado = id;
        return { id };
      },
    },
  });

  const result = await service.updateAtivo(12, {
    nome: "LCI",
    banco_id: 5,
    data_saldo_inicial: "10/04/2026",
  });

  assert.equal(bancoValidado, 5);
  assert.equal(payloadAtualizado?.data_saldo_inicial, "2026-04-10");
  assert.equal(result.id, 12);
};

const ativoDeleteMapeiaErroFkPara409 = async () => {
  const service = new InvestimentoAtivoService();

  setAtivoServiceDependencies(service, {
    ativoRepository: {
      async exists() {
        return true;
      },
      async delete() {
        throw { code: "ER_ROW_IS_REFERENCED_2" };
      },
    },
  });

  await assert.rejects(
    async () => service.deleteAtivo(7),
    (error: unknown) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.statusCode, 409);
      assert.match(error.message, /movimentacoes vinculadas/i);
      return true;
    },
  );
};

const movimentacaoGetAllNormalizaDatas = async () => {
  const service = new InvestimentoMovimentacaoService();
  let filtrosRecebidos: InvestimentoMovimentacaoFilters | undefined;

  setMovimentacaoServiceDependencies(service, {
    movimentacaoRepository: {
      async findAll(filters) {
        filtrosRecebidos = filters;
        return { movimentacoes: [createMovimentacao()], total: 1 };
      },
    },
  });

  const result = await service.getAllMovimentacoes({
    page: 1,
    limit: 10,
    data_de: "01/04/2026",
    data_ate: "2026-04-30",
  });

  assert.equal(result.total, 1);
  assert.equal(result.movimentacoes.length, 1);
  assert.equal(filtrosRecebidos?.data_de, "2026-04-01");
  assert.equal(filtrosRecebidos?.data_ate, "2026-04-30");
};

const movimentacaoGetByIdRetorna404QuandoNaoExiste = async () => {
  const service = new InvestimentoMovimentacaoService();

  setMovimentacaoServiceDependencies(service, {
    movimentacaoRepository: {
      async findById() {
        return null;
      },
    },
  });

  await assert.rejects(
    async () => service.getMovimentacaoById(321),
    (error: unknown) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.statusCode, 404);
      assert.match(error.message, /movimentacao de investimento nao encontrada/i);
      return true;
    },
  );
};

const movimentacaoCreateValidaAtivo = async () => {
  const service = new InvestimentoMovimentacaoService();
  let ativoValidado: number | undefined;
  let payloadCriado: InvestimentoMovimentacaoInput | undefined;

  setMovimentacaoServiceDependencies(service, {
    ativoRepository: {
      async findById(id: number) {
        ativoValidado = id;
        return createAtivo({ id });
      },
    },
    movimentacaoRepository: {
      async create(input) {
        payloadCriado = input;
        return createMovimentacao({ id: 88, ...input });
      },
    },
  });

  const result = await service.createMovimentacao({
    investimento_ativo_id: 9,
    tipo: "RENDIMENTO",
    data: "15/04/2026",
    valor: 35,
  });

  assert.equal(ativoValidado, 9);
  assert.equal(payloadCriado?.data, "2026-04-15");
  assert.equal(result.id, 88);
};

const movimentacaoUpdateNormalizaData = async () => {
  const service = new InvestimentoMovimentacaoService();
  let ativoValidado: number | undefined;
  let payloadAtualizado: Partial<InvestimentoMovimentacaoInput> | undefined;

  setMovimentacaoServiceDependencies(service, {
    movimentacaoRepository: {
      async exists() {
        return true;
      },
      async update(id, input) {
        payloadAtualizado = input;
        return createMovimentacao({ id, ...input });
      },
    },
    ativoRepository: {
      async findById(id: number) {
        ativoValidado = id;
        return createAtivo({ id });
      },
    },
  });

  const result = await service.updateMovimentacao(44, {
    investimento_ativo_id: 2,
    data: "16/04/2026",
  });

  assert.equal(ativoValidado, 2);
  assert.equal(payloadAtualizado?.data, "2026-04-16");
  assert.equal(result.id, 44);
};

const movimentacaoDeleteRetorna500QuandoRepositorioNaoExclui = async () => {
  const service = new InvestimentoMovimentacaoService();

  setMovimentacaoServiceDependencies(service, {
    movimentacaoRepository: {
      async exists() {
        return true;
      },
      async delete() {
        return false;
      },
    },
  });

  await assert.rejects(
    async () => service.deleteMovimentacao(19),
    (error: unknown) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.statusCode, 500);
      assert.match(error.message, /erro ao excluir movimentacao/i);
      return true;
    },
  );
};

const dashboardGetAvailableYearsDelegaParaRepositorio = async () => {
  const service = new InvestimentoDashboardService();
  let filtrosRecebidos: { banco_id?: number; ativo?: boolean } | undefined;

  setDashboardServiceDependencies(service, {
    movimentacaoRepository: {
      async getAvailableYears(filters) {
        filtrosRecebidos = filters;
        return ["2026", "2025"];
      },
    },
  });

  const years = await service.getAvailableYears({
    banco_id: 3,
    ativo: false,
  });

  assert.deepEqual(years, ["2026", "2025"]);
  assert.deepEqual(filtrosRecebidos, { banco_id: 3, ativo: false });
};

const dashboardGetDashboardCalculaCardsCarteiraETimeline = async () => {
  const service = new InvestimentoDashboardService();
  let filtrosSummary: InvestimentoDashboardFilters | undefined;
  let filtrosCarteira: { banco_id?: number; ativo?: boolean } | undefined;
  let filtrosTimeline: InvestimentoDashboardFilters | undefined;

  setDashboardServiceDependencies(service, {
    movimentacaoRepository: {
      async getSummary(filters) {
        filtrosSummary = filters;
        return {
          aporte: 300,
          resgate: 100,
          rendimentos: 50,
          liquido: 250,
        };
      },
      async getTimeline(filters) {
        filtrosTimeline = filters;
        return [
          {
            month_key: "2026-01",
            aporte: 120,
            resgate: 20,
            rendimentos: 10,
          },
          {
            month_key: "semformato",
            aporte: 10,
            resgate: 0,
            rendimentos: 1,
          },
        ];
      },
    },
    ativoRepository: {
      async findCarteira(filters) {
        filtrosCarteira = filters;
        return [
          createAtivo({ id: 1, saldo_inicial: 120, saldo_atual: 150 }),
          createAtivo({ id: 2, saldo_inicial: 30, saldo_atual: 50 }),
        ];
      },
    },
  });

  const result = await service.getDashboard({
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
  assert.deepEqual(filtrosTimeline, {
    banco_id: 5,
    ativo: true,
    data_de: "2026-01-01",
    data_ate: "2026-04-30",
  });
  assert.equal(result.cards.aporte, 300);
  assert.equal(result.cards.rendimentos, 50);
  assert.equal(result.cards.resgate, 100);
  assert.equal(result.cards.liquido, 400);
  assert.equal(result.carteira.total_ativos, 2);
  assert.equal(result.carteira.saldo_total, 200);
  assert.equal(result.timeline[0].month_label, "01/26");
  assert.equal(result.timeline[0].saldo, 110);
  assert.equal(result.timeline[1].month_label, "semformato");
  assert.equal(result.timeline[1].saldo, 11);
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
