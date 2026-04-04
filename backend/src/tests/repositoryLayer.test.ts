import assert from "node:assert/strict";
import pool from "../config/database";
import { BankRepository } from "../repositories/bankRepository";
import { CategoryRepository } from "../repositories/categoryRepository";
import { DescricaoRepository } from "../repositories/descricaoRepository";
import { TransacaoRepository } from "../repositories/transacaoRepository";
import { TestCase } from "./types";

interface QueryCapture {
  sql: string;
  params: unknown[];
}

const originalPoolQuery = pool.query;

const restorePoolQuery = () => {
  pool.query = originalPoolQuery;
};

const stubPoolQuery = (
  responses: unknown[],
  captures: QueryCapture[],
): void => {
  let index = 0;

  pool.query = (async (...args: unknown[]) => {
    const sql = String(args[0] ?? "");
    const rawParams = args[1];
    const params = Array.isArray(rawParams) ? [...rawParams] : [];
    captures.push({ sql, params });

    const next = responses[index++];
    if (next instanceof Error) {
      throw next;
    }

    return next as never;
  }) as typeof pool.query;
};

const bankRepositoryFindAllMontaQueryComFiltros = async () => {
  const captures: QueryCapture[] = [];

  try {
    stubPoolQuery(
      [
        [[{ total: 7 }]],
        [[{ id: 1, nome: "Itaú" }]],
      ],
      captures,
    );

    const repository = new BankRepository();
    const result = await repository.findAll({
      search: "it",
      ativo: false,
      page: 2,
      limit: 5,
    });

    assert.equal(result.total, 7);
    assert.equal(result.banks.length, 1);
    assert.equal(captures.length, 2);

    assert.match(captures[0].sql, /SELECT COUNT\(\*\) as total/i);
    assert.match(captures[0].sql, /nome LIKE \? OR codigo LIKE \?/i);
    assert.match(captures[0].sql, /ativo = \?/i);
    assert.deepEqual(captures[0].params, ["%it%", "%it%", false]);

    assert.match(captures[1].sql, /ORDER BY nome ASC, id ASC LIMIT \? OFFSET \?/i);
    assert.deepEqual(captures[1].params, ["%it%", "%it%", false, 5, 5]);
  } finally {
    restorePoolQuery();
  }
};

const categoryRepositoryFindAllIncluiTipoNaConsulta = async () => {
  const captures: QueryCapture[] = [];

  try {
    stubPoolQuery(
      [
        [[{ total: 3 }]],
        [[{ id: 10, nome: "Lazer", tipo: "DESPESA" }]],
      ],
      captures,
    );

    const repository = new CategoryRepository();
    const result = await repository.findAll({
      tipo: "DESPESA",
      page: 1,
      limit: 2,
    });

    assert.equal(result.total, 3);
    assert.equal(result.categories.length, 1);
    assert.equal(captures.length, 2);

    assert.match(captures[0].sql, /SELECT COUNT\(\*\) as total/i);
    assert.match(captures[0].sql, /c\.tipo = \?/i);
    assert.deepEqual(captures[0].params, ["DESPESA"]);

    assert.match(captures[1].sql, /ORDER BY c\.nome ASC, c\.id ASC/i);
    assert.match(captures[1].sql, /LIMIT \? OFFSET \?/i);
    assert.deepEqual(captures[1].params, ["DESPESA", 2, 0]);
  } finally {
    restorePoolQuery();
  }
};

const descricaoRepositoryFindAllRespeitaFiltrosEPaginacao = async () => {
  const captures: QueryCapture[] = [];

  try {
    stubPoolQuery(
      [
        [[{ total: 4 }]],
        [[{ id: 1, nome: "Netflix", categoria_id: 9, ativo: true }]],
      ],
      captures,
    );

    const repository = new DescricaoRepository();
    const result = await repository.findAll({
      search: "net",
      ativo: true,
      categoria_id: 9,
      page: 3,
      limit: 2,
    });

    assert.equal(result.total, 4);
    assert.equal(result.descricoes.length, 1);
    assert.equal(captures.length, 2);

    assert.match(captures[0].sql, /SELECT COUNT\(\*\) as total FROM/i);
    assert.match(captures[0].sql, /nome LIKE \?/i);
    assert.match(captures[0].sql, /ativo = \?/i);
    assert.match(captures[0].sql, /categoria_id = \?/i);
    assert.deepEqual(captures[0].params, ["%net%", true, 9]);

    assert.match(captures[1].sql, /ORDER BY nome ASC, id ASC/i);
    assert.match(captures[1].sql, /LIMIT \? OFFSET \?/i);
    assert.deepEqual(captures[1].params, ["%net%", true, 9, 2, 4]);
  } finally {
    restorePoolQuery();
  }
};

const transacaoRepositoryFindAllFiltraPorAnoComPaginacao = async () => {
  const captures: QueryCapture[] = [];

  try {
    stubPoolQuery(
      [
        [[{ total: 12 }]],
        [[{ id: 1, mes: "03/2026", situacao: "PAGO" }]],
      ],
      captures,
    );

    const repository = new TransacaoRepository();
    const result = await repository.findAll({
      situacao: "PAGO",
      ano: "2026",
      page: 2,
      limit: 10,
    });

    assert.equal(result.total, 12);
    assert.equal(result.transacoes.length, 1);
    assert.equal(captures.length, 2);

    assert.match(captures[0].sql, /SELECT COUNT\(\*\) as total FROM/i);
    assert.match(captures[0].sql, /t\.situacao = \?/i);
    assert.match(captures[0].sql, /RIGHT\(t\.mes, 4\) = \?/i);
    assert.deepEqual(captures[0].params, ["PAGO", "2026"]);

    assert.match(captures[1].sql, /ORDER BY/i);
    assert.match(captures[1].sql, /LIMIT \? OFFSET \?/i);
    assert.deepEqual(captures[1].params, ["PAGO", "2026", 10, 10]);
  } finally {
    restorePoolQuery();
  }
};

const transacaoRepositoryCreateManyVazioNaoConsultaBanco = async () => {
  const captures: QueryCapture[] = [];

  try {
    stubPoolQuery([], captures);

    const repository = new TransacaoRepository();
    const result = await repository.createMany([]);

    assert.equal(result, 0);
    assert.equal(captures.length, 0);
  } finally {
    restorePoolQuery();
  }
};

const bankRepositoryUpdateSemCamposRetornaFindById = async () => {
  const captures: QueryCapture[] = [];

  try {
    stubPoolQuery([[[{ id: 2, nome: "Banco Atual" }]]], captures);

    const repository = new BankRepository();
    const result = await repository.update(2, {});

    assert.equal((result as { id?: number })?.id, 2);
    assert.equal(captures.length, 1);
    assert.match(captures[0].sql, /SELECT \* FROM banks WHERE id = \?/i);
    assert.deepEqual(captures[0].params, [2]);
  } finally {
    restorePoolQuery();
  }
};

const categoryRepositoryUpdateSemCamposRetornaFindById = async () => {
  const captures: QueryCapture[] = [];

  try {
    stubPoolQuery(
      [[[{
        id: 4,
        nome: "Categoria Atual",
        tipo: "DESPESA",
        cor: "#111111",
        ativo: true,
      }]]],
      captures,
    );

    const repository = new CategoryRepository();
    const result = await repository.update(4, {});

    assert.equal((result as { id?: number })?.id, 4);
    assert.equal(captures.length, 1);
    assert.match(captures[0].sql, /FROM categories c/i);
    assert.deepEqual(captures[0].params, [4]);
  } finally {
    restorePoolQuery();
  }
};

const descricaoRepositoryUpdateSemCamposRetornaFindById = async () => {
  const captures: QueryCapture[] = [];

  try {
    stubPoolQuery(
      [[[{
        id: 5,
        nome: "Descrição Atual",
        categoria_id: 1,
        ativo: true,
      }]]],
      captures,
    );

    const repository = new DescricaoRepository();
    const result = await repository.update(5, {});

    assert.equal(result.id, 5);
    assert.equal(captures.length, 1);
    assert.match(captures[0].sql, /SELECT \* FROM descricoes WHERE id = \?/i);
    assert.deepEqual(captures[0].params, [5]);
  } finally {
    restorePoolQuery();
  }
};

const transacaoRepositoryFindAllPriorizaFiltroMes = async () => {
  const captures: QueryCapture[] = [];

  try {
    stubPoolQuery(
      [
        [[{ total: 2 }]],
        [[{ id: 9, mes: "03/2026" }]],
      ],
      captures,
    );

    const repository = new TransacaoRepository();
    const result = await repository.findAll({
      mes: "03/2026",
      ano: "2027",
      page: 1,
      limit: 5,
    });

    assert.equal(result.total, 2);
    assert.equal(result.transacoes.length, 1);
    assert.equal(captures.length, 2);

    assert.match(captures[0].sql, /t\.mes = \?/i);
    assert.doesNotMatch(captures[0].sql, /RIGHT\(t\.mes, 4\)/i);
    assert.deepEqual(captures[0].params, ["03/2026"]);
    assert.deepEqual(captures[1].params, ["03/2026", 5, 0]);
  } finally {
    restorePoolQuery();
  }
};

const transacaoRepositoryUpdateSemCamposRetornaFindById = async () => {
  const captures: QueryCapture[] = [];

  try {
    stubPoolQuery([[[{ id: 7, mes: "02/2026" }]]], captures);

    const repository = new TransacaoRepository();
    const result = await repository.update(7, {});

    assert.equal((result as { id?: number })?.id, 7);
    assert.equal(captures.length, 1);
    assert.match(captures[0].sql, /WHERE t\.id = \?/i);
    assert.deepEqual(captures[0].params, [7]);
  } finally {
    restorePoolQuery();
  }
};

const transacaoRepositoryDeleteByIdsVazioNaoConsultaBanco = async () => {
  const captures: QueryCapture[] = [];

  try {
    stubPoolQuery([], captures);

    const repository = new TransacaoRepository();
    const result = await repository.deleteByIds([]);

    assert.equal(result, 0);
    assert.equal(captures.length, 0);
  } finally {
    restorePoolQuery();
  }
};

const transacaoRepositoryDeleteByMesesVazioNaoConsultaBanco = async () => {
  const captures: QueryCapture[] = [];

  try {
    stubPoolQuery([], captures);

    const repository = new TransacaoRepository();
    const result = await repository.deleteByMeses([]);

    assert.equal(result, 0);
    assert.equal(captures.length, 0);
  } finally {
    restorePoolQuery();
  }
};

export const repositoryLayerTests: TestCase[] = [
  {
    name: "Repository: Bank findAll monta query com filtros",
    run: bankRepositoryFindAllMontaQueryComFiltros,
  },
  {
    name: "Repository: Bank update sem campos retorna findById",
    run: bankRepositoryUpdateSemCamposRetornaFindById,
  },
  {
    name: "Repository: Category findAll inclui tipo na consulta",
    run: categoryRepositoryFindAllIncluiTipoNaConsulta,
  },
  {
    name: "Repository: Category update sem campos retorna findById",
    run: categoryRepositoryUpdateSemCamposRetornaFindById,
  },
  {
    name: "Repository: Descricao findAll respeita filtros e paginacao",
    run: descricaoRepositoryFindAllRespeitaFiltrosEPaginacao,
  },
  {
    name: "Repository: Descricao update sem campos retorna findById",
    run: descricaoRepositoryUpdateSemCamposRetornaFindById,
  },
  {
    name: "Repository: Transacao findAll filtra por ano com paginacao",
    run: transacaoRepositoryFindAllFiltraPorAnoComPaginacao,
  },
  {
    name: "Repository: Transacao findAll prioriza filtro por mes",
    run: transacaoRepositoryFindAllPriorizaFiltroMes,
  },
  {
    name: "Repository: Transacao createMany vazio nao consulta banco",
    run: transacaoRepositoryCreateManyVazioNaoConsultaBanco,
  },
  {
    name: "Repository: Transacao update sem campos retorna findById",
    run: transacaoRepositoryUpdateSemCamposRetornaFindById,
  },
  {
    name: "Repository: Transacao deleteByIds vazio nao consulta banco",
    run: transacaoRepositoryDeleteByIdsVazioNaoConsultaBanco,
  },
  {
    name: "Repository: Transacao deleteByMeses vazio nao consulta banco",
    run: transacaoRepositoryDeleteByMesesVazioNaoConsultaBanco,
  },
];
