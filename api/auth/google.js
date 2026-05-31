import { findAllowedUser, sendJson, sessionCookie, verifyGoogleIdToken } from "../_auth.js";

async function readJsonBody(req) {
  if (req.body) return typeof req.body === "string" ? JSON.parse(req.body) : req.body;

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end("Method Not Allowed");
    return;
  }

  try {
    const body = await readJsonBody(req);
    const credential = String(body.credential || "");
    if (!credential) {
      sendJson(res, 400, { authenticated: false, reason: "missing_credential" });
      return;
    }

    const googleUser = await verifyGoogleIdToken(credential);
    const allowedUser = await findAllowedUser(googleUser.email);

    if (!allowedUser) {
      sendJson(res, 403, { authenticated: false, reason: "denied" });
      return;
    }

    res.setHeader("Set-Cookie", sessionCookie({ ...allowedUser, name: allowedUser.name || googleUser.name }, req));
    sendJson(res, 200, {
      authenticated: true,
      user: {
        email: allowedUser.email,
        role: allowedUser.role,
        name: allowedUser.name || googleUser.name,
      },
    });
  } catch (error) {
    sendJson(res, 401, { authenticated: false, reason: "invalid", message: error.message });
  }
}
