import { Router, type IRouter } from "express";
import fs from "node:fs";
import path from "node:path";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

router.post("/upload/image", requireAuth, async (req, res): Promise<void> => {
  try {
    const { image, name } = req.body || {};

    if (!image || typeof image !== "string") {
      res.status(400).json({ error: "No valid image data provided." });
      return;
    }

    let buffer: Buffer;
    let ext = "png";

    if (image.startsWith("data:")) {
      const matches = image.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        res.status(400).json({ error: "Invalid base64 image format." });
        return;
      }
      ext = matches[1] === "jpeg" ? "jpg" : matches[1];
      buffer = Buffer.from(matches[2], "base64");
    } else {
      buffer = Buffer.from(image, "base64");
    }

    // Restrict max size to 10MB
    if (buffer.length > 10 * 1024 * 1024) {
      res.status(400).json({ error: "Image file exceeds 10MB size limit." });
      return;
    }

    const filename = `img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const filePath = path.join(uploadsDir, filename);

    await fs.promises.writeFile(filePath, buffer);

    const publicUrl = `/uploads/${filename}`;
    res.json({
      ok: true,
      url: publicUrl,
      filename,
    });
  } catch (error: any) {
    console.error("[UPLOAD ERROR]", error);
    res.status(500).json({ error: "Failed to save uploaded image." });
  }
});

export default router;
