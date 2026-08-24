import { startGame,
    loadGame,
    reinforce,
    attack,
    move,
    endTurn
 } from "../services/gamesService.js";

export async function startGameController(req, res) {
    const newGame = await startGame(req.body);
    return res.status(201).json(newGame);
}

export async function loadGameController(req, res) {
    const game = await loadGame(req.params.id);
    return res.json({game});
}

export async function reinforceController(req, res) {
    const game = await reinforce(req.params.id, req.body);
    return res.json({game});
}

export async function attackController(req, res) {
    const game = await attack(req.params.id, req.body);
    return res.json({game});
}

export async function moveController(req, res) {
    const game = await move(req.params.id, req.body);
    return res.json({game});
}

export async function endTurnController(req, res) {
    const game = await endTurn(req.params.id);
    return res.json({game});
}