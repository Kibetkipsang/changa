import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import chamaRoutes from "./routes/chamaRoutes.ts";
import authRoutes from "./routes/authRoutes.ts";
import contributionRoutes from "./routes/contributionRoutes.ts";
import loanRoutes from "./routes/loanRoutes.ts";
import meetingRoutes from "./routes/meetingRoutes.ts";

dotenv.config();
const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());
app.use(cookieParser());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  message: "Too many requests, please try again later.",
});
app.use(limiter);

// register routes
app.use("/changa/chamas", chamaRoutes);
app.use("/changa/auth", authRoutes);
app.use("/changa/contribution", contributionRoutes);
app.use("/changa/loans", loanRoutes);
app.use("/changa/meeting", meetingRoutes);

// health check
app.get("/", (req, res) => {
  res.send("Changa.com is running....");
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error(err.stack);
    res.status(500).json({ error: "Something went wrong!" });
  },
);

const PORT = process.env.port || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}...`);
});
