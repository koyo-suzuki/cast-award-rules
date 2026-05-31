import {
  clearCookie,
  exchangeGoogleCode,
  findAllowedUser,
  redirect,
  sessionCookie,
  validateState,
  verifyGoogleIdToken,
} from "../_auth.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.statusCode = 405;
    res.end("Method Not Allowed");
    return;
  }

  const url = new URL(req.url, `https://${req.headers.host}`);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  try {
    if (!code || !validateState(req, state)) {
      redirect(res, "/?auth=invalid", { "Set-Cookie": clearCookie("cast_award_oauth_state", req) });
      return;
    }

    const token = await exchangeGoogleCode(req, code);
    const googleUser = await verifyGoogleIdToken(token.id_token);
    const allowedUser = await findAllowedUser(googleUser.email);

    if (!allowedUser) {
      redirect(res, "/?auth=denied", { "Set-Cookie": clearCookie("cast_award_oauth_state", req) });
      return;
    }

    redirect(res, "/", {
      "Set-Cookie": [
        clearCookie("cast_award_oauth_state", req),
        sessionCookie({ ...allowedUser, name: allowedUser.name || googleUser.name }, req),
      ],
    });
  } catch (error) {
    redirect(res, `/?auth=error&message=${encodeURIComponent(error.message)}`, {
      "Set-Cookie": clearCookie("cast_award_oauth_state", req),
    });
  }
}
