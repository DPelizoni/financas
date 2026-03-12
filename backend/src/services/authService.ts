import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppError } from "../middlewares/errorHandler";
import {
  AuthResult,
  AuthTokenPayload,
  User,
  UserCreateInput,
  UserLoginInput,
  UserPublic,
} from "../models/User";
import userRepository from "../repositories/userRepository";

class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: jwt.SignOptions["expiresIn"];

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || "financas_dev_secret_change_me";
    this.jwtExpiresIn = (process.env.JWT_EXPIRES_IN ||
      "8h") as jwt.SignOptions["expiresIn"];
  }

  private sanitizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private toPublicUser(user: User): UserPublic {
    return {
      id: user.id,
      nome: user.nome,
      email: user.email,
      status: user.status,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }

  private generateToken(user: User): string {
    const payload: AuthTokenPayload = {
      sub: user.id,
      nome: user.nome,
      email: user.email,
      status: user.status,
      role: user.role,
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn,
    });
  }

  async register(input: UserCreateInput): Promise<AuthResult> {
    const normalizedEmail = this.sanitizeEmail(input.email);
    const existing = await userRepository.findByEmail(normalizedEmail);

    if (existing) {
      throw new AppError(409, "Já existe um usuário com este email");
    }

    const senhaHash = await bcrypt.hash(input.senha, 10);

    const createdUser = await userRepository.create({
      nome: input.nome.trim(),
      email: normalizedEmail,
      senha: senhaHash,
      status: "ATIVO",
      role: "USUARIO",
    });

    const token = this.generateToken(createdUser);
    return {
      token,
      usuario: this.toPublicUser(createdUser),
    };
  }

  async login(input: UserLoginInput): Promise<AuthResult> {
    const normalizedEmail = this.sanitizeEmail(input.email);
    const user = await userRepository.findByEmail(normalizedEmail);

    if (!user) {
      throw new AppError(401, "Email ou senha inválidos");
    }

    const isMatch = await bcrypt.compare(input.senha, user.senha);
    if (!isMatch) {
      throw new AppError(401, "Email ou senha inválidos");
    }

    if (user.status === "INATIVO") {
      throw new AppError(
        403,
        "Usuário inativo. Entre em contato com o suporte",
      );
    }

    const token = this.generateToken(user);
    return {
      token,
      usuario: this.toPublicUser(user),
    };
  }

  async getMe(userId: number): Promise<UserPublic> {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new AppError(404, "Usuário não encontrado");
    }

    if (user.status === "INATIVO") {
      throw new AppError(403, "Usuário inativo");
    }

    return this.toPublicUser(user);
  }

  verifyToken(token: string): AuthTokenPayload {
    const decoded = jwt.verify(token, this.jwtSecret);

    if (typeof decoded === "string") {
      throw new AppError(401, "Token inválido");
    }

    const sub =
      typeof decoded.sub === "string" ? Number(decoded.sub) : decoded.sub;
    const nome = decoded.nome;
    const email = decoded.email;
    const status = decoded.status;
    const role = decoded.role;

    if (
      typeof sub !== "number" ||
      !Number.isFinite(sub) ||
      typeof nome !== "string" ||
      typeof email !== "string" ||
      (status !== "ATIVO" && status !== "INATIVO")
    ) {
      throw new AppError(401, "Token inválido");
    }

    const parsedRole =
      role === "GESTOR" || role === "ADMIN" || role === "USUARIO"
        ? role
        : "USUARIO";

    return {
      sub,
      nome,
      email,
      status,
      role: parsedRole,
    };
  }
}

export default new AuthService();
