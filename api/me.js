import { readSession, sendJson } from "./_auth.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.statusCode = 405;
    res.end("Method Not Allowed");
    return;
  }

  try {
    const user = readSession(req);
    if (!user) {
      sendJson(res, 401, { authenticated: false });
      return;
    }

    sendJson(res, 200, {
      authenticated: true,
      user: {
        email: user.email,
        role: user.role,
        name: user.name,
      },
    });
  } catch {
    sendJson(res, 401, { authenticated: false });
  }
}
