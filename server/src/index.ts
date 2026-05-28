import express from 'express';
import cors from 'cors';
import cookieParser from "cookie-parser";
import dotenv from 'dotenv';

dotenv.config();
const app = express();

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
    res.send("Changa.com is running....")
})

const PORT = process.env.port || 5000

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}...`)
})