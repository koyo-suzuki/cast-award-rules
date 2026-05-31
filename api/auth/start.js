import { createStateCookie, getRedirectUri, redirect, requiredEnv } from "../_auth.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.statusCode = 405;
    res.end("Method Not Allowed");
    return;
  }

  try {
    const { state, header } = createStateCookie(req);
    const params = new URLSearchParams({
      client_id: requiredEnv("GOOGLE_CLIENT_ID"),
      redirect_uri: getRedirectUri(req),
      response_type: "code",
      scope: "openid email profile",
      state,
      prompt: "select_account",
    });

    redirect(res, `https://accounts.google.com/o/oauth2/v2/auth?${params}`, {
      "Set-Cookie": header,
    });
  } catch (error) {
    res.statusCode = 500;
    res.end(error.message);
  }
}
