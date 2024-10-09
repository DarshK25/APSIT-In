import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/auth.route.js";
import {connectDB} from "./lib/db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;



app.use(express.json()); //middleware, which means we can access req.body which is JSON data

app.use("/api/v1/auth", authRoutes); //endpoint

app.listen(PORT, ()=>{
    console.log(`Server running on port ${PORT}`);
    connectDB();
});


