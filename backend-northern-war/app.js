import "dotenv/config";
import express from "express";
import cors from "cors";
import { errorHandler } from "./middleware/errorHandler.js";
import { loadMapToDb } from "../utils.js"
import gamesRouter from "./routes/gamesRouter.js";
import { log } from "console";


const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
loadMapToDb();
app.use(gamesRouter);
app.use(errorHandler);

app.listen(PORT, () => {
    console.log("Server is running on http://localhost:3001");
});