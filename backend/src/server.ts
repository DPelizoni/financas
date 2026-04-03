import { initDatabase, testConnection } from "./config/database";
import app from "./app";

const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    await testConnection();
    await initDatabase();

    app.listen(PORT, () => {
      console.log(`\nServidor rodando na porta ${PORT}`);
      console.log(`Documentacao Swagger: http://localhost:${PORT}/api-docs`);
      console.log(`Health Check: http://localhost:${PORT}/health`);
      console.log(`API Banks: http://localhost:${PORT}/api/banks\n`);
      console.log(`API Categories: http://localhost:${PORT}/api/categories\n`);
    });
  } catch (error) {
    console.error("Erro ao iniciar servidor:", error);
    process.exit(1);
  }
};

startServer();

export default app;
