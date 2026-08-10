import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import chamaRoutes from "./routes/chamaRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import contributionRoutes from "./routes/contributionRoutes.js";
import loanRoutes from "./routes/loanRoutes.js";
import meetingRoutes from "./routes/meetingRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import memberRoutes from "./routes/memberRoutes.js";


const app = express();

app.use(
  cors({
    origin: "https://chama.keptwise.com",
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
app.use("/changa/analytics", analyticsRoutes)
app.use("/changa/settings", settingsRoutes)
app.use("/changa/members", memberRoutes)

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
