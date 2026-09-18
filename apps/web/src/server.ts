import handler, { createServerEntry } from "@tanstack/react-start/server-entry";
import { handleApiRequest } from "./server/api.js";

export default createServerEntry({
  async fetch(request: Request) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      return handleApiRequest(request);
    }
    return handler.fetch(request);
  },
});
