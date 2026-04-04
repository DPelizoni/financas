import assert from "node:assert/strict";
import pool from "../config/database";
import { BankRepository } from "../repositories/bankRepository";
import { CategoryRepository } from "../repositories/categoryRepository";
import { DescricaoRepository } from "../repositories/descricaoRepository";
import { TransacaoRepository } from "../repositories/transacaoRepository";
import { UserRepository } from "../repositories/userRepository";
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

const transacaoRepositoryFindByMesRetornaRegistros = async () => {
  const captures: QueryCapture[] = [];

  try {
    stubPoolQuery([[[{ id: 13, mes: "04/2026", valor: 230.9 }]]], captures);

    const repository = new TransacaoRepository();
    const result = await repository.findByMes("04/2026");

    assert.equal(result.length, 1);
    assert.equal(result[0].id, 13);
    assert.equal(captures.length, 1);
    assert.match(captures[0].sql, /FROM transacoes/i);
    assert.match(captures[0].sql, /WHERE mes = \?/i);
    assert.match(captures[0].sql, /ORDER BY STR_TO_DATE/i);
    assert.deepEqual(captures[0].params, ["04/2026"]);
  } finally {
    restorePoolQuery();
  }
};

const transacaoRepositoryCreateManyInsereRegistros = async () => {
  const captures: QueryCapture[] = [];

  try {
    stubPoolQuery([[{ affectedRows: 2 }]], captures);

    const repository = new TransacaoRepository();
    const result = await repository.createMany([
      {
        mes: "04/2026",
        vencimento: "10/04/2026",
        tipo: "DESPESA",
        categoria_id: 1,
        descricao_id: 2,
        banco_id: 3,
        situacao: "PENDENTE",
        valor: 150,
      },
      {
        mes: "04/2026",
        vencimento: "15/04/2026",
        tipo: "RECEITA",
        categoria_id: 4,
        descricao_id: 5,
        banco_id: 6,
        situacao: "PAGO",
        valor: 400,
      },
    ]);

    assert.equal(result, 2);
    assert.equal(captures.length, 1);
    assert.match(captures[0].sql, /INSERT INTO transacoes/i);
    assert.deepEqual(captures[0].params, [[
      ["04/2026", "10/04/2026", "DESPESA", 1, 2, 3, "PENDENTE", 150],
      ["04/2026", "15/04/2026", "RECEITA", 4, 5, 6, "PAGO", 400],
    ]]);
  } finally {
    restorePoolQuery();
  }
};

const transacaoRepositoryCreateRetornaRegistroCriado = async () => {
  const captures: QueryCapture[] = [];

  try {
    stubPoolQuery(
      [
        [{ insertId: 21 }],
        [[{ id: 21, mes: "05/2026", valor: 99.9 }]],
      ],
      captures,
    );

    const repository = new TransacaoRepository();
    const result = await repository.create({
      mes: "05/2026",
      vencimento: "20/05/2026",
      tipo: "DESPESA",
      categoria_id: 2,
      descricao_id: 3,
      banco_id: 4,
      situacao: "PENDENTE",
      valor: 99.9,
    });

    assert.equal((result as { id?: number })?.id, 21);
    assert.equal(captures.length, 2);
    assert.match(captures[0].sql, /INSERT INTO transacoes/i);
    assert.deepEqual(captures[0].params, [
      "05/2026",
      "20/05/2026",
      "DESPESA",
      2,
      3,
      4,
      "PENDENTE",
      99.9,
    ]);
    assert.match(captures[1].sql, /WHERE t\.id = \?/i);
    assert.deepEqual(captures[1].params, [21]);
  } finally {
    restorePoolQuery();
  }
};

const transacaoRepositoryFindByIdRetornaNullQuandoNaoExiste = async () => {
  const captures: QueryCapture[] = [];

  try {
    stubPoolQuery([[[]]], captures);

    const repository = new TransacaoRepository();
    const result = await repository.findById(999);

    assert.equal(result, null);
    assert.equal(captures.length, 1);
    assert.match(captures[0].sql, /WHERE t\.id = \?/i);
    assert.deepEqual(captures[0].params, [999]);
  } finally {
    restorePoolQuery();
  }
};

const transacaoRepositoryUpdateComCamposExecutaUpdate = async () => {
  const captures: QueryCapture[] = [];

  try {
    stubPoolQuery(
      [
        [{ affectedRows: 1 }],
        [[{ id: 31, situacao: "PAGO", valor: 220 }]],
      ],
      captures,
    );

    const repository = new TransacaoRepository();
    const result = await repository.update(31, {
      valor: 220,
      situacao: "PAGO",
    });

    assert.equal((result as { id?: number })?.id, 31);
    assert.equal(captures.length, 2);
    assert.match(captures[0].sql, /UPDATE transacoes SET/i);
    assert.match(captures[0].sql, /valor = \?/i);
    assert.match(captures[0].sql, /situacao = \?/i);
    assert.deepEqual(captures[0].params, [220, "PAGO", 31]);
  } finally {
    restorePoolQuery();
  }
};

const transacaoRepositoryDeleteRetornaTrueQuandoAfetaLinhas = async () => {
  const captures: QueryCapture[] = [];

  try {
    stubPoolQuery([[{ affectedRows: 1 }]], captures);

    const repository = new TransacaoRepository();
    const result = await repository.delete(45);

    assert.equal(result, true);
    assert.equal(captures.length, 1);
    assert.match(captures[0].sql, /DELETE FROM transacoes WHERE id = \?/i);
    assert.deepEqual(captures[0].params, [45]);
  } finally {
    restorePoolQuery();
  }
};

const transacaoRepositoryDeleteRetornaFalseQuandoNaoAfetaLinhas = async () => {
  const captures: QueryCapture[] = [];

  try {
    stubPoolQuery([[{ affectedRows: 0 }]], captures);

    const repository = new TransacaoRepository();
    const result = await repository.delete(46);

    assert.equal(result, false);
    assert.equal(captures.length, 1);
  } finally {
    restorePoolQuery();
  }
};

const transacaoRepositoryDeleteByIdsExecutaDelete = async () => {
  const captures: QueryCapture[] = [];

  try {
    stubPoolQuery([[{ affectedRows: 2 }]], captures);

    const repository = new TransacaoRepository();
    const result = await repository.deleteByIds([11, 12]);

    assert.equal(result, 2);
    assert.equal(captures.length, 1);
    assert.match(captures[0].sql, /DELETE FROM transacoes WHERE id IN \(\?, \?\)/i);
    assert.deepEqual(captures[0].params, [11, 12]);
  } finally {
    restorePoolQuery();
  }
};

const transacaoRepositoryDeleteByMesesExecutaDelete = async () => {
  const captures: QueryCapture[] = [];

  try {
    stubPoolQuery([[{ affectedRows: 3 }]], captures);

    const repository = new TransacaoRepository();
    const result = await repository.deleteByMeses(["01/2026", "02/2026"]);

    assert.equal(result, 3);
    assert.equal(captures.length, 1);
    assert.match(captures[0].sql, /DELETE FROM transacoes WHERE mes IN \(\?, \?\)/i);
    assert.deepEqual(captures[0].params, ["01/2026", "02/2026"]);
  } finally {
    restorePoolQuery();
  }
};

const transacaoRepositoryExistsRetornaTrueQuandoEncontrada = async () => {
  const captures: QueryCapture[] = [];

  try {
    stubPoolQuery([[[{ id: 1 }]]], captures);

    const repository = new TransacaoRepository();
    const result = await repository.exists(1);

    assert.equal(result, true);
    assert.equal(captures.length, 1);
    assert.match(captures[0].sql, /SELECT 1 FROM transacoes WHERE id = \?/i);
    assert.deepEqual(captures[0].params, [1]);
  } finally {
    restorePoolQuery();
  }
};

const transacaoRepositoryExistsRetornaFalseQuandoNaoEncontrada = async () => {
  const captures: QueryCapture[] = [];

  try {
    stubPoolQuery([[[]]], captures);

    const repository = new TransacaoRepository();
    const result = await repository.exists(2);

    assert.equal(result, false);
    assert.equal(captures.length, 1);
  } finally {
    restorePoolQuery();
  }
};

const transacaoRepositoryGetSummaryComFiltros = async () => {
  const captures: QueryCapture[] = [];

  try {
    stubPoolQuery(
      [[[{ total_pago: 100, total_pendente: 50, total_registros: 3 }]]],
      captures,
    );

    const repository = new TransacaoRepository();
    const result = await repository.getSummary({
      search: "mercado",
      tipo: "DESPESA",
      categoria_id: 8,
      banco_id: 2,
      situacao: "PAGO",
      ano: "2026",
    });

    assert.equal(result.total_pago, 100);
    assert.equal(result.total_pendente, 50);
    assert.equal(captures.length, 1);
    assert.match(captures[0].sql, /c\.nome LIKE \? OR d\.nome LIKE \? OR b\.nome LIKE \?/i);
    assert.match(captures[0].sql, /t\.tipo = \?/i);
    assert.match(captures[0].sql, /t\.categoria_id = \?/i);
    assert.match(captures[0].sql, /t\.banco_id = \?/i);
    assert.match(captures[0].sql, /t\.situacao = \?/i);
    assert.match(captures[0].sql, /RIGHT\(t\.mes, 4\) = \?/i);
    assert.deepEqual(captures[0].params, [
      "%mercado%",
      "%mercado%",
      "%mercado%",
      "DESPESA",
      8,
      2,
      "PAGO",
      "2026",
    ]);
  } finally {
    restorePoolQuery();
  }
};

const transacaoRepositoryGetSummaryPriorizaMesSobreAno = async () => {
  const captures: QueryCapture[] = [];

  try {
    stubPoolQuery([[[]]], captures);

    const repository = new TransacaoRepository();
    await repository.getSummary({
      mes: "03/2026",
      ano: "2025",
    });

    assert.equal(captures.length, 1);
    assert.match(captures[0].sql, /t\.mes = \?/i);
    assert.doesNotMatch(captures[0].sql, /RIGHT\(t\.mes, 4\) = \?/i);
    assert.deepEqual(captures[0].params, ["03/2026"]);
  } finally {
    restorePoolQuery();
  }
};

const userRepositoryFindAllComFiltros = async () => {
  const captures: QueryCapture[] = [];

  try {
    stubPoolQuery(
      [
        [[{ total: 5 }]],
        [[{ id: 1, nome: "Ana", email: "ana@email.com", role: "ADMIN" }]],
      ],
      captures,
    );

    const repository = new UserRepository();
    const result = await repository.findAll({
      search: "ana",
      status: "ATIVO",
      role: "ADMIN",
      page: 2,
      limit: 3,
    });

    assert.equal(result.total, 5);
    assert.equal(result.users.length, 1);
    assert.equal(captures.length, 2);

    assert.match(captures[0].sql, /SELECT COUNT\(\*\) as total/i);
    assert.match(captures[0].sql, /nome LIKE \? OR email LIKE \?/i);
    assert.match(captures[0].sql, /status = \?/i);
    assert.match(captures[0].sql, /role = \?/i);
    assert.deepEqual(
      captures[0].params,
      ["%ana%", "%ana%", "ATIVO", "ADMIN"],
    );

    assert.match(
      captures[1].sql,
      /ORDER BY created_at DESC, id DESC LIMIT \? OFFSET \?/i,
    );
    assert.deepEqual(
      captures[1].params,
      ["%ana%", "%ana%", "ATIVO", "ADMIN", 3, 3],
    );
  } finally {
    restorePoolQuery();
  }
};

const userRepositoryCreateAplicaDefaultsERetornaUsuario = async () => {
  const captures: QueryCapture[] = [];

  try {
    stubPoolQuery(
      [
        [{ insertId: 8 }],
        [[{ id: 8, nome: "Novo", email: "novo@email.com", role: "USUARIO" }]],
      ],
      captures,
    );

    const repository = new UserRepository();
    const result = await repository.create({
      nome: "Novo",
      email: "novo@email.com",
      senha: "senha-123",
    });

    assert.equal(result.id, 8);
    assert.equal(captures.length, 2);

    assert.match(captures[0].sql, /INSERT INTO users/i);
    assert.deepEqual(captures[0].params, [
      "Novo",
      "novo@email.com",
      "senha-123",
      "ATIVO",
      "USUARIO",
    ]);

    assert.match(captures[1].sql, /SELECT \* FROM users WHERE id = \? LIMIT 1/i);
    assert.deepEqual(captures[1].params, [8]);
  } finally {
    restorePoolQuery();
  }
};

const userRepositoryCreateLancaErroQuandoNaoEncontraUsuarioCriado = async () => {
  const captures: QueryCapture[] = [];

  try {
    stubPoolQuery([[{ insertId: 11 }], [[]]], captures);

    const repository = new UserRepository();

    await assert.rejects(
      repository.create({
        nome: "Sem Retorno",
        email: "sem-retorno@email.com",
        senha: "segredo",
      }),
      (error: unknown) =>
        error instanceof Error && /Erro ao criar usu/i.test(error.message),
    );

    assert.equal(captures.length, 2);
  } finally {
    restorePoolQuery();
  }
};

const userRepositoryUpdateStatusAtualizaERetornaUsuario = async () => {
  const captures: QueryCapture[] = [];

  try {
    stubPoolQuery(
      [
        [{ affectedRows: 1 }],
        [[{ id: 4, status: "INATIVO" }]],
      ],
      captures,
    );

    const repository = new UserRepository();
    const result = await repository.updateStatus(4, { status: "INATIVO" });

    assert.equal((result as { id?: number })?.id, 4);
    assert.equal(captures.length, 2);
    assert.match(captures[0].sql, /UPDATE users SET status = \? WHERE id = \?/i);
    assert.deepEqual(captures[0].params, ["INATIVO", 4]);
  } finally {
    restorePoolQuery();
  }
};

const userRepositoryUpdateRoleAtualizaERetornaUsuario = async () => {
  const captures: QueryCapture[] = [];

  try {
    stubPoolQuery(
      [
        [{ affectedRows: 1 }],
        [[{ id: 4, role: "GESTOR" }]],
      ],
      captures,
    );

    const repository = new UserRepository();
    const result = await repository.updateRole(4, { role: "GESTOR" });

    assert.equal((result as { id?: number })?.id, 4);
    assert.equal(captures.length, 2);
    assert.match(captures[0].sql, /UPDATE users SET role = \? WHERE id = \?/i);
    assert.deepEqual(captures[0].params, ["GESTOR", 4]);
  } finally {
    restorePoolQuery();
  }
};

const userRepositoryUpdateUserComSenhaUsaQueryComSenha = async () => {
  const captures: QueryCapture[] = [];

  try {
    stubPoolQuery(
      [
        [{ affectedRows: 1 }],
        [[{ id: 5, nome: "Ana Atualizada", role: "ADMIN" }]],
      ],
      captures,
    );

    const repository = new UserRepository();
    const result = await repository.updateUser(5, {
      nome: "Ana Atualizada",
      email: "ana@novo.com",
      senha: "nova-senha",
      status: "ATIVO",
      role: "ADMIN",
    });

    assert.equal((result as { id?: number })?.id, 5);
    assert.equal(captures.length, 2);
    assert.match(captures[0].sql, /SET nome = \?, email = \?, senha = \?, status = \?, role = \?/i);
    assert.deepEqual(captures[0].params, [
      "Ana Atualizada",
      "ana@novo.com",
      "nova-senha",
      "ATIVO",
      "ADMIN",
      5,
    ]);
  } finally {
    restorePoolQuery();
  }
};

const userRepositoryUpdateUserSemSenhaUsaQuerySemSenha = async () => {
  const captures: QueryCapture[] = [];

  try {
    stubPoolQuery(
      [
        [{ affectedRows: 1 }],
        [[{ id: 6, nome: "Bruno", role: "USUARIO" }]],
      ],
      captures,
    );

    const repository = new UserRepository();
    const result = await repository.updateUser(6, {
      nome: "Bruno",
      email: "bruno@email.com",
      status: "ATIVO",
      role: "USUARIO",
    });

    assert.equal((result as { id?: number })?.id, 6);
    assert.equal(captures.length, 2);
    assert.match(captures[0].sql, /SET nome = \?, email = \?, status = \?, role = \?/i);
    assert.doesNotMatch(captures[0].sql, /senha = \?/i);
    assert.deepEqual(captures[0].params, [
      "Bruno",
      "bruno@email.com",
      "ATIVO",
      "USUARIO",
      6,
    ]);
  } finally {
    restorePoolQuery();
  }
};

const userRepositoryDeleteRetornaTrueQuandoAfetaLinhas = async () => {
  const captures: QueryCapture[] = [];

  try {
    stubPoolQuery([[{ affectedRows: 1 }]], captures);

    const repository = new UserRepository();
    const result = await repository.delete(7);

    assert.equal(result, true);
    assert.equal(captures.length, 1);
    assert.match(captures[0].sql, /DELETE FROM users WHERE id = \?/i);
    assert.deepEqual(captures[0].params, [7]);
  } finally {
    restorePoolQuery();
  }
};

const userRepositoryDeleteRetornaFalseQuandoNaoAfetaLinhas = async () => {
  const captures: QueryCapture[] = [];

  try {
    stubPoolQuery([[{ affectedRows: 0 }]], captures);

    const repository = new UserRepository();
    const result = await repository.delete(9);

    assert.equal(result, false);
    assert.equal(captures.length, 1);
  } finally {
    restorePoolQuery();
  }
};

const userRepositoryCountByRoleConverteParaNumero = async () => {
  const captures: QueryCapture[] = [];

  try {
    stubPoolQuery([[[{ total: "3" }]]], captures);

    const repository = new UserRepository();
    const result = await repository.countByRole("ADMIN");

    assert.equal(result, 3);
    assert.equal(captures.length, 1);
    assert.match(captures[0].sql, /COUNT\(\*\) as total FROM users WHERE role = \?/i);
    assert.deepEqual(captures[0].params, ["ADMIN"]);
  } finally {
    restorePoolQuery();
  }
};

const userRepositoryCountActiveByRoleConverteParaNumero = async () => {
  const captures: QueryCapture[] = [];

  try {
    stubPoolQuery([[[{ total: "2" }]]], captures);

    const repository = new UserRepository();
    const result = await repository.countActiveByRole("GESTOR");

    assert.equal(result, 2);
    assert.equal(captures.length, 1);
    assert.match(
      captures[0].sql,
      /COUNT\(\*\) as total FROM users WHERE role = \? AND status = 'ATIVO'/i,
    );
    assert.deepEqual(captures[0].params, ["GESTOR"]);
  } finally {
    restorePoolQuery();
  }
};

const userRepositoryExistsRetornaFalseQuandoUsuarioNaoExiste = async () => {
  const captures: QueryCapture[] = [];

  try {
    stubPoolQuery([[[]]], captures);

    const repository = new UserRepository();
    const result = await repository.exists(99);

    assert.equal(result, false);
    assert.equal(captures.length, 1);
    assert.match(captures[0].sql, /SELECT \* FROM users WHERE id = \? LIMIT 1/i);
    assert.deepEqual(captures[0].params, [99]);
  } finally {
    restorePoolQuery();
  }
};

const userRepositoryExistsRetornaTrueQuandoUsuarioExiste = async () => {
  const captures: QueryCapture[] = [];

  try {
    stubPoolQuery([[[{ id: 10, nome: "Existe" }]]], captures);

    const repository = new UserRepository();
    const result = await repository.exists(10);

    assert.equal(result, true);
    assert.equal(captures.length, 1);
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
  {
    name: "Repository: Transacao findByMes retorna registros",
    run: transacaoRepositoryFindByMesRetornaRegistros,
  },
  {
    name: "Repository: Transacao createMany insere registros",
    run: transacaoRepositoryCreateManyInsereRegistros,
  },
  {
    name: "Repository: Transacao create retorna registro criado",
    run: transacaoRepositoryCreateRetornaRegistroCriado,
  },
  {
    name: "Repository: Transacao findById retorna null quando nao existe",
    run: transacaoRepositoryFindByIdRetornaNullQuandoNaoExiste,
  },
  {
    name: "Repository: Transacao update com campos executa update",
    run: transacaoRepositoryUpdateComCamposExecutaUpdate,
  },
  {
    name: "Repository: Transacao delete retorna true quando remove",
    run: transacaoRepositoryDeleteRetornaTrueQuandoAfetaLinhas,
  },
  {
    name: "Repository: Transacao delete retorna false quando nao remove",
    run: transacaoRepositoryDeleteRetornaFalseQuandoNaoAfetaLinhas,
  },
  {
    name: "Repository: Transacao deleteByIds executa delete",
    run: transacaoRepositoryDeleteByIdsExecutaDelete,
  },
  {
    name: "Repository: Transacao deleteByMeses executa delete",
    run: transacaoRepositoryDeleteByMesesExecutaDelete,
  },
  {
    name: "Repository: Transacao exists retorna true quando encontra",
    run: transacaoRepositoryExistsRetornaTrueQuandoEncontrada,
  },
  {
    name: "Repository: Transacao exists retorna false quando nao encontra",
    run: transacaoRepositoryExistsRetornaFalseQuandoNaoEncontrada,
  },
  {
    name: "Repository: Transacao getSummary aplica filtros",
    run: transacaoRepositoryGetSummaryComFiltros,
  },
  {
    name: "Repository: Transacao getSummary prioriza mes sobre ano",
    run: transacaoRepositoryGetSummaryPriorizaMesSobreAno,
  },
  {
    name: "Repository: User findAll monta query com filtros",
    run: userRepositoryFindAllComFiltros,
  },
  {
    name: "Repository: User create aplica defaults e retorna usuario",
    run: userRepositoryCreateAplicaDefaultsERetornaUsuario,
  },
  {
    name: "Repository: User create lanca erro quando findById retorna vazio",
    run: userRepositoryCreateLancaErroQuandoNaoEncontraUsuarioCriado,
  },
  {
    name: "Repository: User updateStatus atualiza e retorna usuario",
    run: userRepositoryUpdateStatusAtualizaERetornaUsuario,
  },
  {
    name: "Repository: User updateRole atualiza e retorna usuario",
    run: userRepositoryUpdateRoleAtualizaERetornaUsuario,
  },
  {
    name: "Repository: User updateUser com senha usa query completa",
    run: userRepositoryUpdateUserComSenhaUsaQueryComSenha,
  },
  {
    name: "Repository: User updateUser sem senha usa query reduzida",
    run: userRepositoryUpdateUserSemSenhaUsaQuerySemSenha,
  },
  {
    name: "Repository: User delete retorna true quando remove",
    run: userRepositoryDeleteRetornaTrueQuandoAfetaLinhas,
  },
  {
    name: "Repository: User delete retorna false quando nao remove",
    run: userRepositoryDeleteRetornaFalseQuandoNaoAfetaLinhas,
  },
  {
    name: "Repository: User countByRole converte total para numero",
    run: userRepositoryCountByRoleConverteParaNumero,
  },
  {
    name: "Repository: User countActiveByRole converte total para numero",
    run: userRepositoryCountActiveByRoleConverteParaNumero,
  },
  {
    name: "Repository: User exists retorna false quando nao encontra",
    run: userRepositoryExistsRetornaFalseQuandoUsuarioNaoExiste,
  },
  {
    name: "Repository: User exists retorna true quando encontra",
    run: userRepositoryExistsRetornaTrueQuandoUsuarioExiste,
  },
];
