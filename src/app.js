import express from "express";
import cors from "cors";
import chatRouter from "./routes/chat.route.js";

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
  })
);

app.use("/api/v1/chat", chatRouter);
app.use("/temp", (req, res, next) => {
  console.log("hello");
});

export { app };
