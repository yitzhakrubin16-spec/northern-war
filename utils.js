
import fs from "fs";
import {createTeritory, isMapTableExist} from "./backend-northern-war/repositories/createMap.js"
import { log } from "console";
 
export async function loadFromJson(filePath) {
    if (!fs.existsSync(filePath)) {
        console.log("No saved data found");
        return;
    }


    const jsonData = fs.readFileSync(filePath, "utf-8");

    if (jsonData.trim() === "") {
        console.log("No saved data found");
        return;
    }

    try {
        const loadedData = JSON.parse(jsonData);

        if (!Array.isArray(loadedData)) {
            console.log("Load failed: invalid data");
            return;
        }

        return loadedData;
    } catch {
        console.log("Load failed: invalid JSON");
        return;
    }
}

export async function loadMapToDb() {
    if (await isMapTableExist() === null) {
        
        const map = await loadFromJson("map.json")
        
        for (const territory of map) {
            await createTeritory(territory);
        }
    }
}

export async function attackUtils(game, fromId, toId, soldiers) {
    const attackLuck = 0.6 + Math.random() * 0.4;
    const defenseLuck = 0.6 + Math.random() * 0.4;

    const attackPower = soldiers * attackLuck;
    const defensePower = game.territories[toId-1].soldiers * defenseLuck;

    game.territories[fromId-1].soldiers -= soldiers;
    
    let outcome = "";
    let survivors = 0;

    if(attackPower > defensePower){
        survivors = Math.max(
            1,
            Math.ceil(soldiers * (attackPower - defensePower) / attackPower));
        
        game.territories[toId-1].owner = "Player";
        game.territories[toId-1].soldiers = survivors;
        if(game.territories[toId-1].headquarters === "true"){
            game.status = "finished";
        }
        outcome = "win";
    }
    else{
        survivors = Math.max(
        1,
        Math.ceil(defendingSoldiers * (defensePower - attackPower) / defensePower)
        );
        game.territories[toId-1].soldiers = survivors;
        outcome = "lost";
    }

    
    if(game.status !== "finished"){
        game.phase = "move";
    }
    const updatedGame = game;
    const event = {fromId, toId, soldiers, outcome, survivors}
    return {updatedGame, event};
}