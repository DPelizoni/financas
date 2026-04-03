import cors from "cors";
import dotenv from "dotenv";
import express, { Application } from "express";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import { authenticateToken } from "./middlewares/authMiddleware";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";
import authRoutes from "./routes/authRoutes";
import bankRoutes from "./routes/bankRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import descricaoRoutes from "./routes/descricaoRoutes";
import transacaoRoutes from "./routes/transacaoRoutes";
import userRoutes from "./routes/userRoutes";

dotenv.config();

export const createApp = (): Application => {
  const app: Application = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get("/health", (_req, res) => {
    res.json({
      success: true,
      message: "API de Finanças Pessoais está funcionando!",
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/", (_req, res) => {
    res.json({
      success: true,
      message: "API de Finanças Pessoais online.",
      docs: "/api-docs",
      health: "/health",
    });
  });

  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "API Finanças - Documentação",
    }),
  );

  app.use("/api/auth", authRoutes);
  app.use("/api", authenticateToken);
  app.use("/api/banks", bankRoutes);
  app.use("/api/categories", categoryRoutes);
  app.use("/api/descricoes", descricaoRoutes);
  app.use("/api/transacoes", transacaoRoutes);
  app.use("/api/users", userRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

const app = createApp();

export default app;
