import "./load-env.js";
import cors from "cors";
import express from "express";
import { requireConfig } from "./middleware.js";
import { api } from "./routes.js";

const app = express();
const port = Number(process.env.PORT) || 4000;
const origin = process.env.CLIENT_ORIGIN || "http://localhost:5173";

app.use(cors({ origin, allowedHeaders: ["Content-Type", "Authorization"] }));
app.use(express.json({ limit: "1mb" }));

app.use("/api", (req, res, next) => {
  if (req.path === "/health") return next();
  return requireConfig(req, res, next);
});

app.use("/api", api);

app.use((error, _req, res, _next) => {
  const status = error.status || 500;
  if (status >= 500) {
    console.error(error);
  }
  res.status(status).json({ error: status === 500 ? "Something went wrong." : error.message });
});

app.listen(port, () => {
  console.log(`Aegis API listening on http://localhost:${port}`);
});
