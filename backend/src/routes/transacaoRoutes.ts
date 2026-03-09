import { Router } from "express";
import { transacaoController } from "../controllers/transacaoController";
import { validate } from "../middlewares/validator";
import {
  transacaoCreateSchema,
  transacaoUpdateSchema,
  transacaoFiltersSchema,
} from "../schemas/transacaoSchema";

const router = Router();

/**
 * @swagger
 * /api/transacoes:
 *   get:
 *     summary: List all transactions
 *     tags: [Transações]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number (default 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page (default 10)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by category, description or bank name
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [DESPESA, RECEITA]
 *         description: Filter by type
 *       - in: query
 *         name: categoria_id
 *         schema:
 *           type: integer
 *         description: Filter by category ID
 *       - in: query
 *         name: banco_id
 *         schema:
 *           type: integer
 *         description: Filter by bank ID
 *       - in: query
 *         name: situacao
 *         schema:
 *           type: string
 *           enum: [PENDENTE, PAGO]
 *         description: Filter by status
 *       - in: query
 *         name: mes
 *         schema:
 *           type: string
 *         description: Filter by month (MM/AAAA)
 *     responses:
 *       200:
 *         description: List of transactions with pagination
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
 *     summary: Get transaction summary
 *     tags: [Transações]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by category, description or bank name
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [DESPESA, RECEITA]
 *         description: Filter by transaction type
 *       - in: query
 *         name: categoria_id
 *         schema:
 *           type: integer
 *         description: Filter by category ID
 *       - in: query
 *         name: banco_id
 *         schema:
 *           type: integer
 *         description: Filter by bank ID
 *       - in: query
 *         name: situacao
 *         schema:
 *           type: string
 *           enum: [PENDENTE, PAGO]
 *         description: Filter by status
 *       - in: query
 *         name: mes
 *         schema:
 *           type: string
 *         description: Filter by month (MM/AAAA)
 *     responses:
 *       200:
 *         description: Summary of transactions
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

/**
 * @swagger
 * /api/transacoes/{id}:
 *   get:
 *     summary: Get a transaction by ID
 *     tags: [Transações]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Transaction found
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
 *         description: Transaction not found
 */
router.get("/:id", transacaoController.getById);

/**
 * @swagger
 * /api/transacoes:
 *   post:
 *     summary: Create a new transaction
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
 *         description: Transaction created successfully
 */
router.post("/", validate(transacaoCreateSchema), transacaoController.create);

/**
 * @swagger
 * /api/transacoes/{id}:
 *   put:
 *     summary: Update a transaction
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
 *         description: Transaction updated successfully
 */
router.put("/:id", validate(transacaoUpdateSchema), transacaoController.update);

/**
 * @swagger
 * /api/transacoes/{id}:
 *   delete:
 *     summary: Delete a transaction
 *     tags: [Transações]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Transaction deleted successfully
 */
router.delete("/:id", transacaoController.delete);

export default router;
