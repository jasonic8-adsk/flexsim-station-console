import { SESSION_CODE_CHARS, SESSION_CODE_LENGTH } from "./constants.js";

export function generateSessionCode(): string {
  let code = "";
  for (let i = 0; i < SESSION_CODE_LENGTH; i++) {
    const index = Math.floor(Math.random() * SESSION_CODE_CHARS.length);
    code += SESSION_CODE_CHARS[index];
  }
  return code;
}
