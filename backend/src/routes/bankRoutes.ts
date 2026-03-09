import { Router } from "express";
import bankController from "../controllers/bankController";
import { validate } from "../middlewares/validator";
import { createBankSchema, updateBankSchema } from "../schemas/bankSchema";

const router = Router();

/**
 * @swagger
 * /api/banks:
 *   get:
 *     summary: Lista todos os bancos
 *     description: Retorna lista paginada de bancos com suporte a filtros
 *     tags: [Banks]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Itens por página
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Busca por nome ou código
 *       - in: query
 *         name: ativo
 *         schema:
 *           type: boolean
 *         description: Filtrar por status (ativo/inativo)
 *     responses:
 *       200:
 *         description: Lista de bancos retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Bancos listados com sucesso
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Bank'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */
router.get("/", bankController.list);

/**
 * @swagger
 * /api/banks/{id}:
 *   get:
 *     summary: Busca banco por ID
 *     description: Retorna detalhes de um banco específico
 *     tags: [Banks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do banco
 *     responses:
 *       200:
 *         description: Banco encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Banco encontrado
 *                 data:
 *                   $ref: '#/components/schemas/Bank'
 *       404:
 *         description: Banco não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:id", bankController.getById);

/**
 * @swagger
 * /api/banks:
 *   post:
 *     summary: Cria novo banco
 *     description: Cadastra um novo banco no sistema
 *     tags: [Banks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BankInput'
 *     responses:
 *       201:
 *         description: Banco criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Banco criado com sucesso
 *                 data:
 *                   $ref: '#/components/schemas/Bank'
 *       400:
 *         description: Erro de validação
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/", validate(createBankSchema), bankController.create);

/**
 * @swagger
 * /api/banks/{id}:
 *   put:
 *     summary: Atualiza banco
 *     description: Atualiza dados de um banco existente
 *     tags: [Banks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do banco
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BankInput'
 *     responses:
 *       200:
 *         description: Banco atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Banco atualizado com sucesso
 *                 data:
 *                   $ref: '#/components/schemas/Bank'
 *       404:
 *         description: Banco não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put("/:id", validate(updateBankSchema), bankController.update);

/**
 * @swagger
 * /api/banks/{id}:
 *   delete:
 *     summary: Exclui banco
 *     description: Remove um banco do sistema
 *     tags: [Banks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do banco
 *     responses:
 *       200:
 *         description: Banco excluído com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Banco excluído com sucesso
 *       404:
 *         description: Banco não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete("/:id", bankController.delete);

export default router;
