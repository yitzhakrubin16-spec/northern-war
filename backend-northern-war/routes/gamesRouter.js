import express from "express";
import { startGameController,
    loadGameController,
    reinforceController,
    attackController,
    moveController,
    endTurnController
 } from "../controllers/gamesController.js";

const router = express.Router();

router.post("/games", startGameController);
router.get("/games/:id", loadGameController);
router.post("/games/:id/reinforce", reinforceController);
router.post("/games/:id/attack", attackController);
router.post("/games/:id/move", moveController);
router.post("/games/:id/end-turn", endTurnController);

export default router;