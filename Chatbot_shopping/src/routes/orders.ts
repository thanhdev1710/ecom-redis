import { Router } from "express";

const router = Router();

// Proxy to external orders API (configure via ENV)
router.get("/orders", async (_req, res) => {
  try {
    const endpoint = process.env.EXTERNAL_ORDERS_API || "";
    if (!endpoint) return res.status(500).json({ ok: false, error: "EXTERNAL_ORDERS_API not configured" });
    const r = await fetch(endpoint);
    if (!r.ok) throw new Error(`Upstream ${r.status}`);
    const data = await r.json();
    res.json({ ok: true, data });
  } catch (e: any) {
    res.status(502).json({ ok: false, error: e?.message || "orders fetch failed" });
  }
});

// GET one order by id: proxies to `${EXTERNAL_ORDERS_API_BASE}/${id}` or template `${EXTERNAL_ORDERS_API}` with {id}
router.get("/orders/:id", async (req, res) => {
  try {
    const id = encodeURIComponent(req.params.id || "");
    const tpl = process.env.EXTERNAL_ORDERS_API || "";
    const base = process.env.EXTERNAL_ORDERS_API_BASE || "";
    if (!tpl && !base) return res.status(500).json({ ok: false, error: "EXTERNAL_ORDERS_API or _BASE not configured" });
    const url = tpl && tpl.includes("{id}") ? tpl.replace("{id}", id) : `${base.replace(/\/$/, "")}/${id}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Upstream ${r.status}`);
    const data = await r.json();
    res.json({ ok: true, data });
  } catch (e: any) {
    res.status(502).json({ ok: false, error: e?.message || "order fetch failed" });
  }
});

export default router;


