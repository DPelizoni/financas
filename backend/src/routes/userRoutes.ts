import { Router } from "express";
import userController from "../controllers/userController";
import { validate } from "../middlewares/validator";
import {
  userCreateManagementSchema,
  userRoleUpdateSchema,
  userStatusUpdateSchema,
  userUpdateManagementSchema,
} from "../schemas/userSchema";
import { authorizeRoles } from "../middlewares/authMiddleware";

const router = Router();

router.post(
  "/",
  authorizeRoles("GESTOR", "ADMIN"),
  validate(userCreateManagementSchema),
  userController.create,
);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Listar usuários
 *     description: Retorna lista paginada de usuários para gestão administrativa.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ATIVO, INATIVO]
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [USUARIO, GESTOR, ADMIN]
 *     responses:
 *       200:
 *         description: Usuários listados com sucesso
 */
router.get("/", authorizeRoles("GESTOR", "ADMIN"), userController.list);

router.put(
  "/:id",
  authorizeRoles("GESTOR", "ADMIN"),
  validate(userUpdateManagementSchema),
  userController.update,
);

/**
 * @swagger
 * /api/users/{id}/status:
 *   patch:
 *     summary: Atualizar status do usuário
 *     description: Atualiza o status (ATIVO/INATIVO) de um usuário.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
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
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ATIVO, INATIVO]
 *     responses:
 *       200:
 *         description: Status do usuário atualizado com sucesso
 */
router.patch(
  "/:id/status",
  authorizeRoles("GESTOR", "ADMIN"),
  validate(userStatusUpdateSchema),
  userController.updateStatus,
);

/**
 * @swagger
 * /api/users/{id}/role:
 *   patch:
 *     summary: Atualizar papel do usuário
 *     description: Atualiza o papel (USUARIO/GESTOR/ADMIN) de um usuário. Apenas ADMIN pode executar.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
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
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [USUARIO, GESTOR, ADMIN]
 *     responses:
 *       200:
 *         description: Papel do usuário atualizado com sucesso
 */
router.patch(
  "/:id/role",
  authorizeRoles("ADMIN"),
  validate(userRoleUpdateSchema),
  userController.updateRole,
);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Excluir usuário
 *     description: Remove definitivamente um usuário. Apenas ADMIN pode executar.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Usuário excluído com sucesso
 *       400:
 *         description: Regra de negócio para exclusão não permitiu a operação
 *       403:
 *         description: Acesso negado para perfil sem permissão
 *       404:
 *         description: Usuário não encontrado
 *       401:
 *         description: Usuário não autenticado
 */
router.delete("/:id", authorizeRoles("ADMIN"), userController.delete);

export default router;
