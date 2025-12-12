import crypto from "crypto";

export function decryptSecret(
  encrypted: string,
  keyHex: string,
  ivHex: string
): string {
  const key = Buffer.from(keyHex, "hex");
  const iv = Buffer.from(ivHex, "hex");
  const encryptedText = Buffer.from(encrypted, "hex");

  // Coerce Buffer types to satisfy TS crypto signatures
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    key as unknown as crypto.CipherKey,
    iv as unknown as crypto.BinaryLike
  );
  const firstChunk: Buffer = decipher.update(encryptedText as any) as any;
  const finalBuf: Buffer = Buffer.concat([firstChunk, decipher.final() as any]);

  return finalBuf.toString();
}

export function decodeBase64Secret(base64Secret: string): string {
  return Buffer.from(base64Secret, "base64").toString("ascii");
}
