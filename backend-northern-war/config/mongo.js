import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGO_URI || "mongodb://mongodb:27017");
const db = client.db("northern-war");

export function getDb() {
  return db;
}
