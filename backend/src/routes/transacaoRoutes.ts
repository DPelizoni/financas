import { Router } from "express";
import transacaoController from "../controllers/transacaoController";
import { validate } from "../middlewares/validator";
import {
  transacaoCreateSchema,
  transacaoCreateBatchSchema,
  transacaoUpdateSchema,
  transacaoCopyMonthSchema,
  transacaoDeleteMonthsSchema,
  transacaoDeleteTransactionMonthsSchema,
} from "../schemas/transacaoSchema";

const router = Router();

/**
 * @swagger
 * /api/transacoes:
 *   get:
 *     summary: Listar todas as transações
 *     tags: [Transações]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Número da página (padrão 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Itens por página (padrão 10)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Busca por categoria, descrição ou nome do banco
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [DESPESA, RECEITA]
 *         description: Filtrar por tipo
 *       - in: query
 *         name: categoria_id
 *         schema:
 *           type: integer
 *         description: Filtrar por ID da categoria
 *       - in: query
 *         name: banco_id
 *         schema:
 *           type: integer
 *         description: Filtrar por ID do banco
 *       - in: query
 *         name: situacao
 *         schema:
 *           type: string
 *           enum: [PENDENTE, PAGO]
 *         description: Filtrar por situação
 *       - in: query
 *         name: mes
 *         schema:
 *           type: string
 *         description: Filtrar por mês (MM/AAAA)
 *       - in: query
 *         name: ano
 *         schema:
 *           type: string
 *         description: Filtrar por ano (AAAA)
 *     responses:
 *       200:
 *         description: Lista de transações com paginação
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transacao'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
router.get("/", transacaoController.getAll);

/**
 * @swagger
 * /api/transacoes/summary:
 *   get:
 *     summary: Obter resumo das transações
 *     tags: [Transações]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Busca por categoria, descrição ou nome do banco
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [DESPESA, RECEITA]
 *         description: Filtrar por tipo da transação
 *       - in: query
 *         name: categoria_id
 *         schema:
 *           type: integer
 *         description: Filtrar por ID da categoria
 *       - in: query
 *         name: banco_id
 *         schema:
 *           type: integer
 *         description: Filtrar por ID do banco
 *       - in: query
 *         name: situacao
 *         schema:
 *           type: string
 *           enum: [PENDENTE, PAGO]
 *         description: Filtrar por situação
 *       - in: query
 *         name: mes
 *         schema:
 *           type: string
 *         description: Filtrar por mês (MM/AAAA)
 *       - in: query
 *         name: ano
 *         schema:
 *           type: string
 *         description: Filtrar por ano (AAAA)
 *     responses:
 *       200:
 *         description: Resumo das transações
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_pago:
 *                       type: number
 *                     total_pendente:
 *                       type: number
 *                     total_registros:
 *                       type: integer
 *                     total_receita:
 *                       type: number
 *                     total_despesa:
 *                       type: number
 *                     total_liquido:
 *                       type: number
 *                     pago_receita:
 *                       type: number
 *                     pago_despesa:
 *                       type: number
 *                     pago_liquido:
 *                       type: number
 *                     provisao_receita:
 *                       type: number
 *                     provisao_despesa:
 *                       type: number
 *                     provisao_liquido:
 *                       type: number
 */
router.get("/summary", transacaoController.getSummary);

router.post(
  "/batch",
  validate(transacaoCreateBatchSchema),
  transacaoController.createBatch,
);

/**
 * @swagger
 * /api/transacoes/copy-month:
 *   post:
 *     summary: Copiar transações de um mês de origem para um ou mais meses de destino
 *     tags: [Transações]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mes_origem
 *               - meses_destino
 *             properties:
 *               mes_origem:
 *                 type: string
 *                 example: "03/2026"
 *               meses_destino:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["04/2026", "05/2026"]
 *     responses:
 *       201:
 *         description: Transações copiadas com sucesso
 */
router.post(
  "/copy-month",
  validate(transacaoCopyMonthSchema),
  transacaoController.copyByMonth,
);

/**
 * @swagger
 * /api/transacoes/delete-months:
 *   delete:
 *     summary: Excluir transações por um ou mais meses
 *     tags: [Transações]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - meses
 *             properties:
 *               meses:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["03/2026", "04/2026"]
 *     responses:
 *       200:
 *         description: Transações excluídas com sucesso
 */
router.delete(
  "/delete-months",
  validate(transacaoDeleteMonthsSchema),
  transacaoController.deleteByMonths,
);

/**
 * @swagger
 * /api/transacoes/delete-transaction-months:
 *   delete:
 *     summary: Excluir uma transação específica em um ou mais meses
 *     tags: [Transações]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transacao_id
 *               - meses
 *             properties:
 *               transacao_id:
 *                 type: integer
 *                 example: 123
 *               meses:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["03/2026", "04/2026", "05/2026"]
 *     responses:
 *       200:
 *         description: Transação excluída nos meses selecionados
 */
router.delete(
  "/delete-transaction-months",
  validate(transacaoDeleteTransactionMonthsSchema),
  transacaoController.deleteTransactionByMeses,
);

/**
 * @swagger
 * /api/transacoes/{id}:
 *   get:
 *     summary: Obter transação por ID
 *     tags: [Transações]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Transação encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Transacao'
 *       404:
 *         description: Transação não encontrada
 */
router.get("/:id", transacaoController.getById);

/**
 * @swagger
 * /api/transacoes:
 *   post:
 *     summary: Criar uma nova transação
 *     tags: [Transações]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mes
 *               - vencimento
 *               - tipo
 *               - categoria_id
 *               - descricao_id
 *               - banco_id
 *               - valor
 *             properties:
 *               mes:
 *                 type: string
 *                 example: "03/2026"
 *               vencimento:
 *                 type: string
 *                 example: "15/03/2026"
 *               tipo:
 *                 type: string
 *                 enum: [DESPESA, RECEITA]
 *               categoria_id:
 *                 type: integer
 *               descricao_id:
 *                 type: integer
 *               banco_id:
 *                 type: integer
 *               situacao:
 *                 type: string
 *                 enum: [PENDENTE, PAGO]
 *                 default: PENDENTE
 *               valor:
 *                 type: number
 *     responses:
 *       201:
 *         description: Transação criada com sucesso
 */
router.post("/", validate(transacaoCreateSchema), transacaoController.create);

/**
 * @swagger
 * /api/transacoes/{id}:
 *   put:
 *     summary: Atualizar uma transação
 *     tags: [Transações]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mes:
 *                 type: string
 *               vencimento:
 *                 type: string
 *               tipo:
 *                 type: string
 *                 enum: [DESPESA, RECEITA]
 *               categoria_id:
 *                 type: integer
 *               descricao_id:
 *                 type: integer
 *               banco_id:
 *                 type: integer
 *               situacao:
 *                 type: string
 *                 enum: [PENDENTE, PAGO]
 *               valor:
 *                 type: number
 *     responses:
 *       200:
 *         description: Transação atualizada com sucesso
 */
router.put("/:id", validate(transacaoUpdateSchema), transacaoController.update);

/**
 * @swagger
 * /api/transacoes/{id}:
 *   delete:
 *     summary: Excluir uma transação
 *     tags: [Transações]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Transação excluída com sucesso
 */
router.delete("/:id", transacaoController.delete);

export default router;
