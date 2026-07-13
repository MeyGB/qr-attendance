const crypto = require("crypto");
const pool = require("../config/db");
const { log } = require("console");
require("dotenv").config();

const ROTATION_SECONDS = Number(process.env.QR_ROTATION_SECONDS || 45);
const TOKEN_LIFETIME_SECONDS = Number(
  process.env.QR_TOKEN_LIFETIME_SECONDS || 60,
);

async function generateNewToken() {
  const token = crypto.randomBytes(16).toString("hex");
  console.log(token);

  try {
    // Deactivate old tokens, then insert the fresh one
    await pool.query(
      "UPDATE qr_tokens SET is_active = FALSE WHERE is_active = TRUE",
    );
    await pool.query(
      `INSERT INTO qr_tokens (token, valid_from, valid_until, is_active)
       VALUES (?, NOW(), DATE_ADD(NOW(), INTERVAL ? SECOND), TRUE)`,
      [token, TOKEN_LIFETIME_SECONDS],
    );
    console.log(`[qr-rotation] New token generated: ${token}`);
  } catch (err) {
    console.error("[qr-rotation] Failed to generate token:", err.message);
  }
}

function startQrRotation() {
  generateNewToken(); // generate one immediately on startup
  setInterval(generateNewToken, ROTATION_SECONDS * 1000);
  console.log(
    `[qr-rotation] Rotating every ${ROTATION_SECONDS}s, each token valid ${TOKEN_LIFETIME_SECONDS}s`,
  );
}

module.exports = { startQrRotation };
