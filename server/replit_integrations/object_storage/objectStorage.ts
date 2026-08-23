// Replit object storage implementation removed. Use server/object_storage/routes.ts for local uploads.

export class ObjectNotFoundError extends Error {}

export class ObjectStorageService {
  // Minimal stub for compatibility; prefer using ./object_storage/routes.ts
  async getObjectEntityUploadURL(): Promise<string> {
    throw new Error("Replit object storage removed. Use /api/uploads to upload files.");
  }
}

