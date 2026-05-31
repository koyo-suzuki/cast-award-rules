import crypto from "node:crypto";

const DEFAULT_SPREADSHEET_ID = "1p5UgsepNsDkB8Z_V-pEw7nmleHQHKSMaUE7bDT8nFgY";
const DEFAULT_USERS_RANGE = "config_users!A:F";
const SESSION_COOKIE = "cast_award_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

let sheetsTokenCache = null;
let serviceAccountCache = null;

function base64url(input) {
  return Buffer.from(input).toString("base64url");
}

function jsonResponse(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function parseCookies(req) {
  return Object.fromEntries(
    String(req.headers.cookie || "")
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");
        return [decodeURIComponent(part.slice(0, index)), decodeURIComponent(part.slice(index + 1))];
      }),
  );
}

function isHttps(req) {
  return req.headers["x-forwarded-proto"] === "https" || String(req.headers.host || "").endsWith(".vercel.app");
}

function cookie(name, value, req, options = {}) {
  const parts = [
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
  ];

  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
  if (isHttps(req)) parts.push("Secure");
  return parts.join("; ");
}

export function clearCookie(name, req) {
  return cookie(name, "", req, { maxAge: 0 });
}

export function sessionCookie(payload, req) {
  const token = signSession(payload);
  return cookie(SESSION_COOKIE, token, req, { maxAge: SESSION_TTL_SECONDS });
}

export function readSession(req) {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (!token) return null;
  return verifySession(token);
}

function sessionSecret() {
  const secret = process.env.SESSION_SECRET || process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!secret) throw new Error("Session signing secret is not set");
  return secret;
}

function signSession(user) {
  const payload = {
    email: user.email,
    role: user.role,
    name: user.name,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const encodedPayload = base64url(JSON.stringify(payload));
  const signature = crypto.createHmac("sha256", sessionSecret()).update(encodedPayload).digest("base64url");
  return `${encodedPayload}.${signature}`;
}

function verifySession(token) {
  const [encodedPayload, signature] = String(token).split(".");
  if (!encodedPayload || !signature) return null;

  const expected = crypto.createHmac("sha256", sessionSecret()).update(encodedPayload).digest("base64url");
  if (signature.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;

  let payload;
  try {
    payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

export async function verifyGoogleIdToken(idToken) {
  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
  if (!response.ok) throw new Error("Invalid Google ID token");

  const token = await response.json();
  if (token.aud !== requiredEnv("GOOGLE_CLIENT_ID")) throw new Error("Google ID token audience mismatch");
  if (token.email_verified !== "true" && token.email_verified !== true) throw new Error("Google email is not verified");

  return {
    email: String(token.email || "").toLowerCase(),
    name: token.name || token.email,
  };
}

export async function findAllowedUser(email) {
  const rows = await readUsersSheet();
  const [headers, ...records] = rows;
  const indexes = Object.fromEntries(headers.map((header, index) => [String(header).trim(), index]));
  const normalizedEmail = String(email).toLowerCase();
  const allowedRoles = String(process.env.AUTH_ALLOWED_ROLES || "")
    .split(",")
    .map((role) => role.trim())
    .filter(Boolean);

  for (const row of records) {
    const rowEmail = String(row[indexes.email] || "").toLowerCase();
    if (rowEmail !== normalizedEmail) continue;

    const role = String(row[indexes.role] || "");
    if (allowedRoles.length > 0 && !allowedRoles.includes(role)) return null;

    const expiryDate = String(row[indexes.expiry_date] || "").trim();
    if (expiryDate && new Date(`${expiryDate}T23:59:59+09:00`).getTime() < Date.now()) return null;

    return {
      email: rowEmail,
      role,
      name: row[indexes.cast_name] || normalizedEmail,
    };
  }

  return null;
}

async function readUsersSheet() {
  const spreadsheetId = process.env.CONFIG_SPREADSHEET_ID || process.env.AUTH_SPREADSHEET_ID || DEFAULT_SPREADSHEET_ID;
  const range = process.env.AUTH_USERS_RANGE || DEFAULT_USERS_RANGE;
  const params = new URLSearchParams({ majorDimension: "ROWS" });
  const encodedRange = encodeURIComponent(range);
  const headers = {
    Authorization: `Bearer ${await serviceAccountAccessToken()}`,
  };

  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}?${params}`, {
    headers,
  });

  if (!response.ok) throw new Error(`Google Sheets read failed: ${response.status}`);
  const data = await response.json();
  return data.values || [];
}

async function serviceAccountAccessToken() {
  if (sheetsTokenCache && sheetsTokenCache.expiresAt > Date.now() + 60_000) return sheetsTokenCache.token;

  const now = Math.floor(Date.now() / 1000);
  const assertionHeader = { alg: "RS256", typ: "JWT" };
  const serviceAccount = getServiceAccount();
  const assertionPayload = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets.readonly",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };
  const unsigned = `${base64url(JSON.stringify(assertionHeader))}.${base64url(JSON.stringify(assertionPayload))}`;
  const privateKey = serviceAccount.private_key.replace(/\\n/g, "\n");
  const signature = crypto.createSign("RSA-SHA256").update(unsigned).sign(privateKey, "base64url");
  const assertion = `${unsigned}.${signature}`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!response.ok) throw new Error(`Google service account token failed: ${response.status}`);
  const data = await response.json();
  sheetsTokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
  };
  return sheetsTokenCache.token;
}

function getServiceAccount() {
  if (serviceAccountCache) return serviceAccountCache;

  const raw = requiredEnv("GOOGLE_SERVICE_ACCOUNT_KEY");
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY must be a JSON service account key");
  }

  if (!parsed.client_email || !parsed.private_key) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY is missing client_email or private_key");
  }

  serviceAccountCache = parsed;
  return serviceAccountCache;
}

export function redirect(res, location, headers = {}) {
  res.statusCode = 302;
  res.setHeader("Location", location);
  for (const [key, value] of Object.entries(headers)) {
    res.setHeader(key, value);
  }
  res.end();
}

export function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

export function sendJson(res, status, body) {
  jsonResponse(res, status, body);
}

export { SESSION_COOKIE };
