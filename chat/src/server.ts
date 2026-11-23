import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { Mistral } from "@mistralai/mistralai";

const PORT = Number(process.env.PORT ?? 3000);
const MODEL = "mistral-small-latest";
const MAX_MESSAGES = 50;
const MAX_MESSAGE_CHARS = 4000;
const MAX_BODY_BYTES = 256 * 1024;

const apiKey = process.env.MISTRAL_API_KEY;
const mistral = apiKey ? new Mistral({ apiKey }) : null;

const publicDir = fileURLToPath(new URL("../public", import.meta.url));

const mimeTypes: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

function sendJson(res: ServerResponse, status: number, data: unknown): void {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

async function serveStatic(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") pathname = "/index.html";
  const filePath = normalize(join(publicDir, pathname));
  if (!filePath.startsWith(publicDir)) {
    sendJson(res, 403, { error: "Prohibido" });
    return;
  }
  try {
    const content = await readFile(filePath);
    res.writeHead(200, {
      "Content-Type": mimeTypes[extname(filePath)] ?? "application/octet-stream",
    });
    res.end(content);
  } catch {
    sendJson(res, 404, { error: "No encontrado" });
  }
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error("Cuerpo demasiado grande"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

function parseMessages(raw: unknown): ChatMessage[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_MESSAGES) return null;
  const messages: ChatMessage[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) return null;
    const { role, content } = item as Record<string, unknown>;
    if (role !== "system" && role !== "user" && role !== "assistant") return null;
    if (
      typeof content !== "string" ||
      content.trim().length === 0 ||
      content.length > MAX_MESSAGE_CHARS
    ) {
      return null;
    }
    messages.push({ role, content });
  }
  return messages;
}

async function handleChat(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (!mistral) {
    sendJson(res, 500, {
      error: "MISTRAL_API_KEY no esta configurada en el servidor (revisa tu archivo .env).",
    });
    return;
  }
  let messages: ChatMessage[] | null = null;
  try {
    const body = await readBody(req);
    const parsed = JSON.parse(body) as { messages?: unknown };
    messages = parseMessages(parsed.messages);
  } catch {
    sendJson(res, 400, { error: "JSON invalido o cuerpo demasiado grande." });
    return;
  }
  if (!messages) {
    sendJson(res, 400, { error: "Formato de mensajes invalido." });
    return;
  }
  try {
    const completion = await mistral.chat.complete({ model: MODEL, messages });
    const reply = completion.choices?.[0]?.message?.content;
    sendJson(res, 200, { reply: typeof reply === "string" ? reply : "" });
  } catch (err) {
    console.error("Error llamando a la API de Mistral:", err);
    sendJson(res, 502, { error: "No se pudo obtener respuesta de la API de Mistral." });
  }
}

const server = createServer((req, res) => {
  void (async () => {
    if (req.method === "POST" && req.url === "/api/chat") {
      await handleChat(req, res);
      return;
    }
    if (req.method === "GET" || req.method === "HEAD") {
      await serveStatic(req, res);
      return;
    }
    sendJson(res, 405, { error: "Metodo no permitido" });
  })().catch((err: unknown) => {
    console.error(err);
    if (!res.headersSent) sendJson(res, 500, { error: "Error interno del servidor" });
  });
});

server.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT} (modelo: ${MODEL})`);
});
