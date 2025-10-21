import express from "express";
import cors from "cors";
import chatRouter from "./routes/chat";
import productsRouter from "./routes/products";
import ordersRouter from "./routes/orders";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api", chatRouter);
app.use("/api", productsRouter);
app.use("/api", ordersRouter);
app.use(express.static("public"));

export default app;


