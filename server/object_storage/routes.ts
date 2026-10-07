import type { Express } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

export function registerObjectStorageRoutes(app: Express): void {
  // Prefer a persistent disk (set via UPLOAD_DIR in production); fall back to the legacy repo directory.
  const uploadDir = process.env.UPLOAD_DIR
    ? path.resolve(process.env.UPLOAD_DIR)
    : path.join(process.cwd(), "attached_assets", "uploads");
  const legacyDir = path.join(process.cwd(), "attached_assets", "uploads");
  for (const dir of [uploadDir, legacyDir]) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const safe = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
      cb(null, safe);
    },
  });

  const upload = multer({ storage });

  // Endpoint: upload a file via multipart/form-data (field name: file)
  app.post("/api/uploads", upload.single("file"), (req: any, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const objectPath = `/objects/uploads/${req.file.filename}`;
    res.json({ objectPath, url: objectPath });
  });

  // Endpoint: request a presigned URL for direct PUT uploads
  app.post("/api/uploads/request-url", (req: any, res) => {
    try {
      const { name } = req.body || {};
      if (!name) return res.status(400).json({ error: "Missing file name" });

      const safeName = `${Date.now()}-${String(name).replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
      const objectPath = `/objects/uploads/${safeName}`;
      // Use a same-origin path that the browser can PUT to
      const uploadURL = `/api/uploads/presigned/${safeName}`;
      res.json({ uploadURL, objectPath, metadata: { name } });
    } catch (err) {
      console.error("Error creating presigned URL:", err);
      res.status(500).json({ error: "Failed to create upload URL" });
    }
  });

  // Endpoint: accept a raw PUT to save the uploaded object (mimics presigned PUT)
  app.put("/api/uploads/presigned/:filename", (req: any, res) => {
    try {
      const filename = req.params.filename as string;
      // Only allow filenames that match the safe pattern we generate above
      if (!/^[0-9\-a-zA-Z._]+$/.test(filename)) return res.status(400).json({ error: "Invalid filename" });

      const destPath = path.join(uploadDir, filename);
      const tempPath = destPath + ".tmp";

      const writeStream = fs.createWriteStream(tempPath, { flags: "w" });
      req.pipe(writeStream);

      writeStream.on("finish", () => {
        try {
          fs.renameSync(tempPath, destPath);
          const objectPath = `/objects/uploads/${filename}`;
          res.status(200).json({ objectPath, url: objectPath });
        } catch (err) {
          console.error("Error finalizing uploaded file:", err);
          res.status(500).json({ error: "Failed to save uploaded file" });
        }
      });

      writeStream.on("error", (err) => {
        console.error("Write stream error:", err);
        try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch (e) {}
        res.status(500).json({ error: "Failed to write file" });
      });
    } catch (err) {
      console.error("Presigned PUT error:", err);
      res.status(500).json({ error: "Upload failed" });
    }
  });

  // Serve uploaded objects
  app.get("/objects/:objectPath(*)", (req, res) => {
    try {
      const raw = req.params.objectPath as string; // e.g. uploads/filename
      // Files are stored flat inside each store dir; drop the leading "uploads/" segment.
      const relative = raw.startsWith("uploads/") || raw.startsWith("uploads\\") ? raw.slice("uploads/".length) : raw;
      // Serve from the persistent disk first, then the legacy committed dir (seed images).
      for (const dir of [uploadDir, legacyDir]) {
        const filePath = path.join(dir, relative);
        if (!filePath.startsWith(dir + path.sep)) {
          // Prevent serving files outside allowed dirs
          return res.status(403).json({ error: "Forbidden" });
        }
        if (fs.existsSync(filePath)) return res.sendFile(filePath);
      }
      return res.status(404).json({ error: "Not found" });
    } catch (err) {
      console.error("Error serving object:", err);
      return res.status(500).json({ error: "Failed to serve object" });
    }
  });
}
