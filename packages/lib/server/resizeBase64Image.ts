import jimp from "jimp";

export function isBase64Image(value: string): boolean {
  return /^data:image\/(png|jpe?g);base64,/i.test(value);
}

export async function resizeBase64Image(
  base64OrUrl: string,
  opts?: {
    maxSize?: number;
  }
) {
  if (!base64OrUrl.startsWith("data:")) {
    // might be a `https://` or something
    return base64OrUrl;
  }
  const mimeMatch = base64OrUrl.match(/^data:(\w+\/\w+);/);
  const mimetype = mimeMatch?.[1];
  if (!mimetype) {
    throw new Error(`Could not distinguish mimetype`);
  }
  // Reject base64 inputs larger than ~10MB to prevent memory exhaustion
  const MAX_BASE64_LENGTH = 13_333_333; // ~10MB when decoded
  const base64Data = base64OrUrl.replace(/^data:image\/\w+;base64,/, "");
  if (base64Data.length > MAX_BASE64_LENGTH) {
    throw new Error("Base64 image input exceeds maximum allowed size (10MB)");
  }
  const buffer = Buffer.from(base64Data, "base64");

  const {
    // 96px is the height of the image on https://cal.com/peer
    maxSize = 96 * 4,
  } = opts ?? {};
  const image = await jimp.read(buffer);
  const currentSize = Math.max(image.getWidth(), image.getHeight());
  if (currentSize > maxSize) {
    image.resize(jimp.AUTO, maxSize);
  }
  const newBuffer = await image.getBufferAsync(mimetype);

  return `data:${mimetype};base64,${newBuffer.toString("base64")}`;
}
