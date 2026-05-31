import { clearCookie, redirect } from "./_auth.js";

export default async function handler(req, res) {
  redirect(res, "/", {
    "Set-Cookie": clearCookie("cast_award_session", req),
  });
}
