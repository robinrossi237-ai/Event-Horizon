import type { Express } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

export function registerObjectStorageRoutes(app: Express): void {
  const uploadDir = path.join(process.cwd(), "attached_assets", "uploads");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

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
      const filePath = path.join(process.cwd(), "attached_assets", raw);
      if (!filePath.startsWith(uploadDir)) {
        // Prevent serving files outside the upload dir
        return res.status(403).json({ error: "Forbidden" });
      }
      if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Not found" });
      return res.sendFile(filePath);
    } catch (err) {
      console.error("Error serving object:", err);
      return res.status(500).json({ error: "Failed to serve object" });
    }
  });
}
