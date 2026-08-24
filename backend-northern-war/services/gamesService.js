import { ObjectId } from "mongodb";
import { createGame,
    getGame,
    updateGame
 } from "../repositories/gamesRepository.js";
import { attackUtils,
    computerTurn
 } from "../../utils.js"

export async function startGame(name) {
    const { playerName } = name;

    if(!playerName || !playerName.trim()){
        const error = new Error("Player Name required");
        error.status = 400;
        throw error;
    }

    const game = await createGame(name);

    return {
        id: game._id,
        ...game
    };
}

export async function loadGame(id) {
    if(!(new ObjectId(id))){
        const error = new Error("Game id required");
        error.status = 400;
        throw error;
    }

    const game = await getGame(id);

    if(!game){
        const error = new Error("Game Not Found");
        error.status = 404;
        throw error;
    }
    return {
        ...game
    };
}

export async function reinforce(id, data) {
    if(!(new ObjectId(id))){
        const error = new Error("Game id required");
        error.status = 400;
        throw error;
    }

    let game = await getGame(id);

    if(!game){
        const error = new Error("Game Not Found");
        error.status = 404;
        throw error;
    }
    
    if(game.phase !== "reinforce"){
        const error = new Error("Game Not in reinforce phase");
        error.status = 400;
        throw error;
    }

    if(game.status === "finished"){
        const error = new Error("Game is finished");
        error.status = 409;
        throw error;
    }

    const {territoryId} = data;
    
    if(game.territories[territoryId-1].owner === "computer"){
        const error = new Error("Can not reinforce enemy territory");
        error.status = 400;
        throw error;
    }

    game.territories[territoryId-1].soldiers += 3;
    game.phase = "attack";
    const playerEvent = {"type" : "reinforce", "territoryId" : territoryId, "soldiersAdded" : 3 }
    const computerEvents = []
    await updateGame(game);
    
    game = await getGame(id);

    return {
        ...game,
        playerEvent,
        computerEvents
    };
}


export async function attack(id, data) {
    if(!(new ObjectId(id))){
        const error = new Error("Game id required");
        error.status = 400;
        throw error;
    }

    let game = await getGame(id);

    if(!game){
        const error = new Error("Game Not Found");
        error.status = 404;
        throw error;
    }
    
    if(game.phase !== "attack"){
        const error = new Error("Game Not in attack phase");
        error.status = 400;
        throw error;
    }

    if(game.status === "finished"){
        const error = new Error("Game is finished");
        error.status = 409;
        throw error;
    }
    const {skip} = data
    if(skip){
        game.phase = "move";
        const playerEvent = null;
        const computerEvents = []
        await updateGame(game);
        
        game = await getGame(id);

        return {
            ...game,
            playerEvent,
            computerEvents
        };
    }

    const {fromId, toId, soldiers} = data;
    
    if(game.territories[fromId-1].owner !== "player" || game.territories[toId-1].owner !== "computer"){
        const error = new Error("Player have to attack computer");
        error.status = 400;
        throw error;
    }

    if(!game.territories[fromId-1].neighbors.includes(game.territories[toId-1].id)){
        const error = new Error("Have to attack only neighbors");
        error.status = 400;
        throw error;
    }

    if("number" !== typeof (soldiers) || soldiers < 1){
        const error = new Error("Number of soldiers must be int and positive");
        error.status = 400;
        throw error;
    }

    if(game.territories[fromId-1].soldiers <= soldiers){
        const error = new Error("At least 1 soldier must stay in territory");
        error.status = 400;
        throw error;
    }

    const newEvent = await attackUtils(game, fromId, toId, soldiers)
    
    const {updatedGame, event} = newEvent;
    
    await updateGame(updatedGame);
    
    game = await getGame(id);

    
    const playerEvent = event;
    const computerEvents = []
    
    return {
        ...game,
        playerEvent,
        computerEvents
    };
}

export async function move(id, data) {
    if(!(new ObjectId(id))){
        const error = new Error("Game id required");
        error.status = 400;
        throw error;
    }

    let game = await getGame(id);

    if(!game){
        const error = new Error("Game Not Found");
        error.status = 404;
        throw error;
    }
    
    if(game.phase !== "move"){
        const error = new Error("Game Not in move phase");
        error.status = 400;
        throw error;
    }

    if(game.status === "finished"){
        const error = new Error("Game is finished");
        error.status = 409;
        throw error;
    }

    const {fromId, toId, soldiers} = data;
    
    if(game.territories[fromId-1].owner !== "player" || game.territories[toId-1].owner !== "player"){
        const error = new Error("Both territories must by owned by player");
        error.status = 400;
        throw error;
    }

    if(!game.territories[fromId-1].neighbors.includes(game.territories[toId-1].id)){
        const error = new Error("Both territories must by neighbors");
        error.status = 400;
        throw error;
    }

    if("number" !== typeof (soldiers) || soldiers < 1){
        const error = new Error("Number of soldiers must be int and positive");
        error.status = 400;
        throw error;
    }

    if(game.territories[fromId-1].soldiers <= soldiers){
        const error = new Error("At least 1 soldier must stay in origin territory");
        error.status = 400;
        throw error;
    }

    game.territories[fromId-1].soldiers -= soldiers
    game.territories[toId-1].soldiers += soldiers
    
    const playerEvent = {"type" : "move", "fromTerritoryId" : fromId, "toTerritoryId" : toId, "soldiersMoved" : soldiers };
    
    const newEvent = await computerTurn(game);
    
    const {updatedGame, event} = newEvent;
    
    await updateGame(updatedGame);
    game = await getGame(id);
    
    return {
        ...game,
        playerEvent,
        computerEvents
    };
}


export async function endTurn(id) {
    if(!(new ObjectId(id))){
        const error = new Error("Game id required");
        error.status = 400;
        throw error;
    }

    let game = await getGame(id);

    if(!game){
        const error = new Error("Game Not Found");
        error.status = 404;
        throw error;
    }
    
    if(game.phase !== "move"){
        const error = new Error("Game Not in move phase");
        error.status = 400;
        throw error;
    }

    if(game.status === "finished"){
        const error = new Error("Game is finished");
        error.status = 409;
        throw error;
    }

    const playerEvent = null;
    
    const newEvent = await computerTurn(game);
    
    const {updatedGame, event} = newEvent;
    
    await updateGame(updatedGame);
    game = await getGame(id);
    
    return {
        ...game,
        playerEvent,
        computerEvents
    };
}