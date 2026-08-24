import { ObjectId } from "bson";
import { getDb } from "../config/mongo.js";

export async function createGame(name) {
    const {playerName} = name;
    const map = await getDb().collection("map").find().toArray()
    
    let territories = []

    for(const territory of map){
        territories.push({...territory, owner: territory.startOwner, soldiers: 4})
    }
    const game = {
        "playerName": playerName,
        "round" : 1,
        "phase": "reinforce",
        "status": "playing",
        "winner": null,
        "territories": territories
    }
    await getDb().collection("games").insertOne(game);

    return {
        
        ...game
    };
}


export async function getGame(id) {
    
    const game = await getDb().collection("games").findOne({_id: new ObjectId(id)});

    return game
}


export async function updateGame(game) {
    await getDb()
    .collection("games")
    .updateOne(
    {_id: new ObjectId(game._id)},
    {$set : game});
}