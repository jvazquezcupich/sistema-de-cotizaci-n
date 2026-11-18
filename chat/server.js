import "dotenv/config";
import express from "express";
import { Mistral } from "@mistralai/mistralai";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

const apiKey = process.env.MISTRAL_API_KEY;
if (!apiKey) {
  console.error("Error: falta la variable de entorno MISTRAL_API_KEY.");
  console.error("Copia .env.example a .env y añade tu clave, o expórtala antes de arrancar.");
  process.exit(1);
}

const client = new Mistral({ apiKey });
const history = [];

const app = express();
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

app.post("/api/chat", async (req, res) => {
  const { message } = req.body ?? {};
  if (typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "El campo 'message' es obligatorio." });
  }

  history.push({ role: "user", content: message });

  try {
    const response = await client.chat.complete({
      model: "mistral-small-latest",
      messages: history,
    });
    const reply = response.choices?.[0]?.message?.content ?? "";
    history.push({ role: "assistant", content: reply });
    return res.json({ reply });
  } catch (err) {
    console.error("Error al llamar a la API de Mistral:", err?.message ?? err);
    return res.status(502).json({ error: "No se pudo obtener respuesta del modelo." });
  }
});

app.listen(PORT, () => {
  console.log(`Chat de Mistral escuchando en http://localhost:${PORT}`);
});
