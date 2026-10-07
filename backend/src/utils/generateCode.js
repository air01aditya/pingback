const crypto = require("crypto");

const ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateCode(length = 7) {
  const bytes = crypto.randomBytes(length);
  let code = "";
  for (const byte of bytes) {
    code += ALPHABET[byte % ALPHABET.length];
  }
  return code;
}

module.exports = generateCode;
