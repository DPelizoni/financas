import { Router } from "express";
import categoryController from "../controllers/categoryController";
import { validate } from "../middlewares/validator";
import {
  createCategorySchema,
  updateCategorySchema,
} from "../schemas/categorySchema";

const router = Router();

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Lista categorias
 *     description: Retorna lista paginada de categorias com filtros
 *     tags: [Categories]
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
 *         description: Busca por nome da categoria
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [RECEITA, DESPESA]
 *         description: Filtrar por tipo
 *       - in: query
 *         name: ativo
 *         schema:
 *           type: boolean
 *         description: Filtrar por status (ativo/inativo)
 *     responses:
 *       200:
 *         description: Lista de categorias retornada com sucesso
 */
router.get("/", categoryController.list);

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: Busca categoria por ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da categoria
 *     responses:
 *       200:
 *         description: Categoria encontrada
 *       404:
 *         description: Categoria não encontrada
 */
router.get("/:id", categoryController.getById);

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Cria nova categoria
 *     tags: [Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryInput'
 *     responses:
 *       201:
 *         description: Categoria criada com sucesso
 *       400:
 *         description: Erro de validação
 */
router.post("/", validate(createCategorySchema), categoryController.create);

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Atualiza categoria
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da categoria
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryInput'
 *     responses:
 *       200:
 *         description: Categoria atualizada com sucesso
 *       404:
 *         description: Categoria não encontrada
 */
router.put("/:id", validate(updateCategorySchema), categoryController.update);

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Exclui categoria
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da categoria
 *     responses:
 *       200:
 *         description: Categoria excluída com sucesso
 *       404:
 *         description: Categoria não encontrada
 */
router.delete("/:id", categoryController.delete);

export default router;
