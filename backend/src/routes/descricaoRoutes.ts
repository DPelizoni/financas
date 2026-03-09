import { Router } from "express";
import { descricaoController } from "../controllers/descricaoController";
import { validate } from "../middlewares/validator";
import {
  descricaoCreateSchema,
  descricaoUpdateSchema,
} from "../schemas/descricaoSchema";

const router = Router();

/**
 * @swagger
 * /api/descricoes:
 *   get:
 *     tags:
 *       - Descrições
 *     summary: Lista descrições
 *     parameters:
 *       - name: page
 *         in: query
 *         type: number
 *       - name: limit
 *         in: query
 *         type: number
 *       - name: search
 *         in: query
 *         type: string
 *       - name: ativo
 *         in: query
 *         type: boolean
 *       - name: categoria_id
 *         in: query
 *         type: number
 *     responses:
 *       200:
 *         description: Lista de descrições
 */
router.get("/", descricaoController.getAll);

/**
 * @swagger
 * /api/descricoes/{id}:
 *   get:
 *     tags:
 *       - Descrições
 *     summary: Busca descrição por ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         type: number
 *     responses:
 *       200:
 *         description: Descrição encontrada
 *       404:
 *         description: Descrição não encontrada
 */
router.get("/:id", descricaoController.getById);

/**
 * @swagger
 * /api/descricoes:
 *   post:
 *     tags:
 *       - Descrições
 *     summary: Cria nova descrição
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               categoria_id:
 *                 type: number
 *               ativo:
 *                 type: boolean
 *               required:
 *                 - nome
 *                 - categoria_id
 *     responses:
 *       201:
 *         description: Descrição criada
 *       400:
 *         description: Dados inválidos
 */
router.post("/", validate(descricaoCreateSchema), descricaoController.create);

/**
 * @swagger
 * /api/descricoes/{id}:
 *   put:
 *     tags:
 *       - Descrições
 *     summary: Atualiza descrição
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         type: number
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               categoria_id:
 *                 type: number
 *               ativo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Descrição atualizada
 *       404:
 *         description: Descrição não encontrada
 */
router.put("/:id", validate(descricaoUpdateSchema), descricaoController.update);

/**
 * @swagger
 * /api/descricoes/{id}:
 *   delete:
 *     tags:
 *       - Descrições
 *     summary: Deleta descrição
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         type: number
 *     responses:
 *       200:
 *         description: Descrição deletada
 *       404:
 *         description: Descrição não encontrada
 */
router.delete("/:id", descricaoController.delete);

export default router;
