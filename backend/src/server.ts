import express, { Application } from "express";
import cors from "cors";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import { testConnection, initDatabase } from "./config/database";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";
import { authenticateToken } from "./middlewares/authMiddleware";
import authRoutes from "./routes/authRoutes";
import bankRoutes from "./routes/bankRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import descricaoRoutes from "./routes/descricaoRoutes";
import transacaoRoutes from "./routes/transacaoRoutes";
import userRoutes from "./routes/userRoutes";

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rota de health check
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "API de Finanças Pessoais está funcionando!",
    timestamp: new Date().toISOString(),
  });
});

// Rota raiz da API
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API de Finanças Pessoais online.",
    docs: "/api-docs",
    health: "/health",
  });
});

// Documentação Swagger
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "API Finanças - Documentação",
  }),
);

// Rotas da API
app.use("/api/auth", authRoutes);
app.use("/api", authenticateToken);
app.use("/api/banks", bankRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/descricoes", descricaoRoutes);
app.use("/api/transacoes", transacaoRoutes);
app.use("/api/users", userRoutes);

// Handlers de erro
app.use(notFoundHandler);
app.use(errorHandler);

// Inicialização do servidor
const startServer = async () => {
  try {
    // Testa conexão com o banco
    await testConnection();

    // Inicializa as tabelas
    await initDatabase();

    // Inicia o servidor
    app.listen(PORT, () => {
      console.log(`\n🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📝 Documentação Swagger: http://localhost:${PORT}/api-docs`);
      console.log(`💚 Health Check: http://localhost:${PORT}/health`);
      console.log(`🏦 API Banks: http://localhost:${PORT}/api/banks\n`);
      console.log(
        `🗂️ API Categories: http://localhost:${PORT}/api/categories\n`,
      );
    });
  } catch (error) {
    console.error("❌ Erro ao iniciar servidor:", error);
    process.exit(1);
  }
};

startServer();

export default app;
