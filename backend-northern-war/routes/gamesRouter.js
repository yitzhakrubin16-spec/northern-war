import express from "express";
import { startGameController,
    loadGameController,
    reinforceController,
    attackController
 } from "../controllers/gamesController.js";

const router = express.Router();

router.post("/games", startGameController);
router.get("/games/:id", loadGameController);
router.post("/games/:id/reinforce", reinforceController);
router.post("/games/:id/attack", attackController);

export default router;