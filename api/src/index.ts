import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import { cart } from "./routes/cart";
import { orders } from "./routes/orders";
import { products } from "./routes/products";
import { categories } from "./routes/categories";
import { users } from "./routes/users";
import { admin } from "./routes/admin";

if (process.env.NODE_ENV !== "production") {
  import("dotenv").then((dotenv) => dotenv.config());
}

const app = express();
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(morgan("dev"));
app.use(express.json());

app.use("/api/categories", categories);
app.use("/api/products", products);
app.use("/api/cart", cart);
app.use("/api/orders", orders);
app.use("/api/users", users);
app.use("/api/admin", admin);

const port = Number(process.env.PORT || 4000);

app.listen(port, () => console.log("API listening on " + port));
