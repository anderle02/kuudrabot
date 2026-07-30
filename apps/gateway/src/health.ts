import http from "node:http";
import { env } from "@kuudrabot/shared";

export function startHealthServer() {
  http
    .createServer((req, res) => {
      if (req.url === "/health") {
        res.writeHead(200).end("ok");
      } else {
        res.writeHead(404).end();
      }
    })
    .listen(env.HEALTHCHECK_PORT);
}
