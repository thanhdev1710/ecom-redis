import { Router } from "express";
import items from "../data/data.json";

const router = Router();

router.get("/products", (_req, res) => {
  res.json({ ok: true, items });
});

export default router;


