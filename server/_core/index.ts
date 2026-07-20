import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const isDev = process.env.NODE_ENV === "development";

async function startServer() {
  if (isDev) {
    // In development, use Vite's dev server as middleware
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve the built static files
    const publicDir = path.resolve(__dirname, "../public");
    app.use(express.static(publicDir));
    // SPA fallback
    app.get("/{*path}", (_req, res) => {
      res.sendFile(path.join(publicDir, "index.html"));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
