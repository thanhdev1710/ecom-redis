import { Router } from "express";
import { handleMessage } from "../services/dialog";

const router = Router();

/**
 * POST /api/chat
 * Body: { message: string, userId?: string }
 * Response: { ok: boolean, reply: BotResponse }
 */
router.post("/chat", async (req, res) => {
  const message = (req.body?.message || "").toString();
  const userId = req.body?.userId;
  
  if (!message) return res.status(400).json({ ok: false, error: "message required" });

  const reply = await handleMessage(message, userId);
  return res.json({ ok: true, reply });
});

export default router;


