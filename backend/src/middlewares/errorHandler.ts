import { Request, Response, NextFunction } from "express";
import { errorResponse } from "../utils/response";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public errors?: any[],
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const isTestEnvironment = process.env.NODE_ENV === "test";
  const shouldLogError = !isTestEnvironment || !(err instanceof AppError);

  if (shouldLogError) {
    console.error("❌ Erro:", err);
  }

  if (err instanceof AppError) {
    return res
      .status(err.statusCode)
      .json(errorResponse(err.message, err.errors));
  }

  // Erro genérico
  return res
    .status(500)
    .json(
      errorResponse(
        "Erro interno do servidor. Por favor, tente novamente mais tarde.",
      ),
    );
};

export const notFoundHandler = (req: Request, res: Response) => {
  res
    .status(404)
    .json(errorResponse(`Rota ${req.method} ${req.path} não encontrada`));
};
