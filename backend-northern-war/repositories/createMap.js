import { getDb } from "../config/mongo.js";


export async function createTeritory(Teritory) {
    const newTeritory = await getDb().collection("map").insertOne(Teritory);

    return newTeritory;
}

export async function isMapTableExist() {
    const territory = await getDb().collection("map").findOne({});
   
    
    return territory;
}