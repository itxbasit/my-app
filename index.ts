    // server.ts
    import express from "express";
    import axios from "axios";
    import dotenv from "dotenv";
    import cors from "cors";

    dotenv.config();

    const app = express();
    const PORT = process.env.PORT || 4000;
    const API_KEY = process.env.FREECURRENCY_API_KEY || "YOUR_API_KEY";
    const FREECURRENCY_BASE = "https://api.freecurrencyapi.com/v1";

    app.use(cors());
    app.use(express.json());

    // Store conversion history in memory
    interface Conversion {
    base: string;
    target: string;
    amount: number;
    rate: number;
    result: number;
    date: string;
    }
    const history: Conversion[] = [];

    // Get supported codes (currencies)
    app.get("/api/codes", async (_, res) => {
    try {
        const r = await axios.get(`${FREECURRENCY_BASE}/latest`, {
        params: { apikey: API_KEY, base_currency: "USD" },
        });
        res.json({ codes: Object.keys(r.data.data).sort() });
    } catch(error) {
        console.log(error);
        
        res.status(500).json({ error: "Failed to fetch codes" });
    }
    });

    // Convert amount from base to target currency
 app.get("/api/convert", async (req, res) => {
  const { base = "USD", target = "EUR", amount = "1" } = req.query;

  try {
    const r = await axios.get(`${FREECURRENCY_BASE}/latest`, {
      params: { apikey: API_KEY, base_currency: base },
    });

    const rate = r.data.data[target as string];
    if (!rate) return res.status(400).json({ error: "Unsupported target currency" });

    const amt = Number(amount);
    const result = amt * rate;

    const record: Conversion = {
      base: base as string,
      target: target as string,
      amount: amt,
      rate,
      result,
      date: new Date().toISOString(),
    };
    history.push(record);

    res.json(record);
  } catch (error: any) {
    // Detailed logging
    if (axios.isAxiosError(error)) {
      console.error("Axios error:");
      console.error("Message:", error.message);
      console.error("Status:", error.response?.status);
      console.error("Response data:", error.response?.data);
    } else {
      console.error("Unexpected error:", error);
    }

    res.status(500).json({ error: "Conversion failed", details: error.message });
  }
});
;

    // Get past conversion history
    app.get("/api/history", (_, res) => {
    res.json({ history });
    });

    // Start server
    app.listen(PORT, () => {
    console.log(`Currency API server running at http://localhost:${PORT}`);
    });
