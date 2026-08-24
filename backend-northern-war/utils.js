
import fs from "fs";
import {createTeritory, isMapTableExist} from "./repositories/createMap.js"
 
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



export async function computerTurn(game) {
    let computerEvents = []
    let reinforceEvent = {"type" : "reinforce", "territoryId" : 0, "soldiersAdded" : 3 }
    
    const playersTerritories = game.territories.filter((item)=>{
        return item.owner === "player" 
    })
    const computerTerritories = game.territories.filter((item)=>{
        return item.owner === "computer" 
    })

    let closestPlayerTerritory = playersTerritories[0];

    for(const territory of playersTerritories){
        if (territory.distanceFromComputerHQ < closestPlayerTerritory.distanceFromComputerHQ){
            closestPlayerTerritory = territory;
        }
    }

    if(closestPlayerTerritory.distanceFromComputerHQ <= 2){
        let closestComputerTerritory = computerTerritories[0]
        for(const territory of computerTerritories){
            if (territory.distanceFromComputerHQ < closestComputerTerritory.distanceFromComputerHQ){
                closestComputerTerritory = territory;
            }
        }
        const closeTerritories = computerTerritories.filter((item) =>{
            return item.distanceFromComputerHQ === closestComputerTerritory.distanceFromComputerHQ;
        })
        if (closeTerritories.length > 1){
            let smallTerritory = closeTerritories[0];
            for(const territory of closeTerritories){
                if (territory.soldiers < smallTerritory.soldiers){
                    smallTerritory = territory;
                }}
            const smallTerritories = closeTerritories.filter((item) =>{
                return item.soldiers === smallTerritory.soldiers;
            })
            if (smallTerritories.length > 1){
                let lowIdTerritory = smallTerritories[0];
                game.territories[(lowIdTerritory.id)-1].soldiers += 3;
                reinforceEvent.territoryId = lowIdTerritory;
            }
            else{
                game.territories[(smallTerritory.id)-1].soldiers += 3;
                reinforceEvent.territoryId = smallTerritory;
            }
        }
        else{
            game.territories[(closestComputerTerritory.id)-1].soldiers += 3;
            reinforceEvent.territoryId = closestComputerTerritory;
        }}
        else{
            let furthestComputerTerritory = computerTerritories[0]
            for(const territory of computerTerritories){
                if (territory.distanceFromPlayerHQ < furthestComputerTerritory.distanceFromPlayerHQ){
                    furthestComputerTerritory = territory;
                }
            }
            const farTerritories = computerTerritories.filter((item) =>{
                return item.distanceFromPlayerHQ === furthestComputerTerritory.distanceFromPlayerHQ;
            })
            if(farTerritories.length > 1){
                let bigTerritory = farTerritories[0];
                for(const territory of farTerritories){
                    if (territory.soldiers > bigTerritory.soldiers){
                        bigTerritory = territory;
                    }}
                const bigTerritories = farTerritories.filter((item) =>{
                    return item.soldiers === bigTerritory.soldiers;
                })
                if(bigTerritories.length > 1){
                    let lowIdTerritory = smallTerritories[0];
                    game.territories[(lowIdTerritory.id)-1].soldiers += 3;
                    reinforceEvent.territoryId = lowIdTerritory;
                }
                else{
                    game.territories[(bigTerritory.id)-1].soldiers += 3;
                    reinforceEvent.territoryId = bigTerritory;
                }}
            else{
                game.territories[(furthestComputerTerritory.id)-1].soldiers += 3;
                reinforceEvent.territoryId = furthestComputerTerritory;
                }}
    computerEvents.push(reinforceEvent);
    

}