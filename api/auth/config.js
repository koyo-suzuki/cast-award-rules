import { sendJson } from "../_auth.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.statusCode = 405;
    res.end("Method Not Allowed");
    return;
  }

  sendJson(res, 200, {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
  });
}
