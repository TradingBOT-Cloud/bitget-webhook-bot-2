const express = require("express");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(bodyParser.json());

const API_KEY = process.env.BITGET_API_KEY;
const API_SECRET = process.env.BITGET_API_SECRET;
const API_PASSPHRASE = process.env.BITGET_API_PASSPHRASE;
const BASE_URL = "https://api.bitget.com";

function getTimestamp() {
  return new Date().toISOString();
}

function signMessage(timestamp, method, path, body = "") {
  const prehash = timestamp + method + path + body;
  return crypto.createHmac("sha256", API_SECRET).update(prehash).digest("base64");
}

app.post("/webhook", async (req, res) => {
  const { symbol, side } = req.body;

  if (!symbol || !side) return res.status(400).send("Missing fields");

  try {
    const timestamp = getTimestamp();
    const method = "POST";
    const path = "/api/mix/v1/order/placeOrder";

    const body = {
      symbol: symbol,
      marginCoin: "USDT",
      size: "0.01",
      side: side.toLowerCase(),
      orderType: "market",
      timeInForceValue: "normal",
      price: ""
    };

    const sign = signMessage(timestamp, method, path, JSON.stringify(body));

    const response = await axios.post(`${BASE_URL}${path}`, body, {
      headers: {
        "ACCESS-KEY": API_KEY,
        "ACCESS-SIGN": sign,
        "ACCESS-TIMESTAMP": timestamp,
        "ACCESS-PASSPHRASE": API_PASSPHRASE,
        "Content-Type": "application/json"
      }
    });

    console.log(`✅ ${side.toUpperCase()} ${symbol} envoyé à Bitget`);
    res.status(200).send("Order placed");

  } catch (err) {
    console.error("❌ Erreur Bitget:", err.response?.data || err.message);
    res.status(500).send("Erreur API");
  }
});

app.listen(3000, () => console.log("🚀 Webhook bot en ligne (port 3000)"));
