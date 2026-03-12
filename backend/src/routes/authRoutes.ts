import { Router } from "express";
import authController from "../controllers/authController";
import { authenticateToken } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validator";
import { loginSchema, registerSchema } from "../schemas/authSchema";

const router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Cadastrar usuário
 *     description: Cria um usuário e retorna token de sessão autenticada.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthRegisterInput'
 *     responses:
 *       201:
 *         description: Usuário cadastrado com sucesso
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
 *                   example: Usuário cadastrado com sucesso
 *                 data:
 *                   $ref: '#/components/schemas/AuthSession'
 *       409:
 *         description: Email já cadastrado
 *       400:
 *         description: Erro de validação
 */
router.post("/register", validate(registerSchema), authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Realizar login
 *     description: Autentica o usuário e retorna token JWT.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthLoginInput'
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
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
 *                   example: Login realizado com sucesso
 *                 data:
 *                   $ref: '#/components/schemas/AuthSession'
 *       401:
 *         description: Credenciais inválidas
 */
router.post("/login", validate(loginSchema), authController.login);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Obter usuário autenticado
 *     description: Retorna os dados do usuário com base no token JWT.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Usuário autenticado
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
 *                   example: Usuário autenticado
 *                 data:
 *                   $ref: '#/components/schemas/UserPublic'
 *       401:
 *         description: Token inválido ou ausente
 */
router.get("/me", authenticateToken, authController.me);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Realizar logout
 *     description: Encerra sessão no cliente (invalidação do token no cliente).
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout realizado com sucesso
 */
router.post("/logout", authenticateToken, authController.logout);

export default router;
