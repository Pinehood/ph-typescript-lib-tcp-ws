import crypto from "crypto";

export class Encryption {
  constructor(
    private readonly key: Buffer,
    private readonly iv: Buffer,
    private readonly algorithm = "aes-256-cbc"
  ) {}

  encrypt(data: Buffer): Buffer {
    const cipher = crypto.createCipheriv(this.algorithm, this.key, this.iv);
    return Buffer.concat([this.iv, cipher.update(data), cipher.final()]);
  }

  decrypt(data: Buffer): Buffer {
    const iv = data.subarray(0, 16);
    const encrypted = data.subarray(16);
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]);
  }
}
