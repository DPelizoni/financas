import { Router } from "express";
import { validate } from "../middlewares/validator";
import {
  createInvestimentoAtivoSchema,
  createInvestimentoMovimentacaoSchema,
  updateInvestimentoAtivoSchema,
  updateInvestimentoMovimentacaoSchema,
} from "../schemas/investimentoSchema";
import { investimentoAtivoController } from "../controllers/investimentoAtivoController";
import { investimentoMovimentacaoController } from "../controllers/investimentoMovimentacaoController";
import { investimentoDashboardController } from "../controllers/investimentoDashboardController";

const router = Router();

router.get("/dashboard/anos", investimentoDashboardController.getAvailableYears);
router.get("/dashboard", investimentoDashboardController.getDashboard);

router.get("/ativos/anos", investimentoAtivoController.getAvailableYears);
router.get("/ativos", investimentoAtivoController.getAll);
router.get("/ativos/:id", investimentoAtivoController.getById);
router.post(
  "/ativos",
  validate(createInvestimentoAtivoSchema),
  investimentoAtivoController.create,
);
router.put(
  "/ativos/:id",
  validate(updateInvestimentoAtivoSchema),
  investimentoAtivoController.update,
);
router.delete("/ativos/:id", investimentoAtivoController.delete);

router.get("/movimentacoes", investimentoMovimentacaoController.getAll);
router.get("/movimentacoes/:id", investimentoMovimentacaoController.getById);
router.post(
  "/movimentacoes",
  validate(createInvestimentoMovimentacaoSchema),
  investimentoMovimentacaoController.create,
);
router.put(
  "/movimentacoes/:id",
  validate(updateInvestimentoMovimentacaoSchema),
  investimentoMovimentacaoController.update,
);
router.delete(
  "/movimentacoes/:id",
  investimentoMovimentacaoController.delete,
);

export default router;
