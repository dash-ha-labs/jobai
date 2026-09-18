import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";

function apiDevMiddleware() {
  return {
    name: "jobai-api-dev-middleware",
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (!req.url?.startsWith("/api/")) {
          return next();
        }

        try {
          const { handleApiRequest } = await import("./src/server/api.ts");
          const protocol = req.headers["x-forwarded-proto"] || "http";
          const host = req.headers.host || "127.0.0.1:3000";
          const fullUrl = `${protocol}://${host}${req.url}`;

          const chunks: Buffer[] = [];
          for await (const chunk of req) {
            chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
          }
          const bodyBuffer = chunks.length > 0 ? Buffer.concat(chunks) : undefined;

          const webRequest = new Request(fullUrl, {
            method: req.method,
            headers: req.headers as any,
            body: bodyBuffer && ["POST", "PUT", "PATCH"].includes(req.method) ? bodyBuffer : undefined,
            // @ts-ignore
            duplex: "half",
          });

          const webResponse = await handleApiRequest(webRequest);

          res.statusCode = webResponse.status;
          webResponse.headers.forEach((val: string, key: string) => {
            res.setHeader(key, val);
          });

          const arrayBuffer = await webResponse.arrayBuffer();
          res.end(Buffer.from(arrayBuffer));
        } catch (err: any) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "DEV_SERVER_ERROR", message: err?.message || String(err) }));
        }
      });
    },
  };
}

export default defineConfig({
  server: {
    port: 3000,
    host: "127.0.0.1",
  },
  plugins: [
    apiDevMiddleware(),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    nitro(),
  ],
  environments: {
    ssr: {
      build: {
        rollupOptions: {
          input: "./src/server.ts",
        },
      },
    },
  },
});
