import crypto from "crypto";
import util from "util";
const pbkdf2 = util.promisify(crypto.pbkdf2);
const randomBytes = util.promisify(crypto.randomBytes);

/**
 *
 * @param options
 * @returns
 */
export async function hash({
  token,
  iterations = 10000,
  keylen = 64,
  digest = "RSA-SHA256",
  salt,
}: {
  token: string;
  iterations?: number;
  keylen?: number;
  digest?: string;
  salt?: string;
}): Promise<{
  computedHash: string;
  salt: string;
  iterations: number;
  keylen: number;
  digest: string;
}> {
  salt = salt !== undefined ? salt : (await randomBytes(16)).toString("base64");
  const computedHash = (
    await pbkdf2(token, salt, iterations, keylen, digest)
  ).toString("base64");
  return { computedHash, salt, iterations, keylen, digest };
}

/**
 * Function to verify a token hash against the original.
 * Needs the salt used to generate the token
 * @example
 * const { hash, salt } = await hashToken({ token: "123" });
 * const result = await compare({ provided: "123", stored: hash, salt });
 */
export async function compare({
  provided,
  stored,
  salt,
}: {
  provided: string;
  stored: string;
  salt: string;
}): Promise<boolean> {
  const { computedHash } = await hash({ token: provided, salt });
  if (computedHash === stored) {
    return true;
  }
  return false;
}
