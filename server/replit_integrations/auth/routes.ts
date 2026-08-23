import type { Express } from "express";
import { authStorage } from "./storage";
import { isAuthenticated } from "./replitAuth";

// Register auth-specific routes
export function registerAuthRoutes(app: Express): void {
  // Get current authenticated user
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      // Support both OIDC users (req.user.claims.sub) and local-session users (req.user.id)
      const userId = req.user?.claims?.sub ?? req.user?.id;
      const user = await authStorage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      // Never return password hash to client
      const { passwordHash, ...safe } = user as any;
      res.json(safe);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Local signup
  app.post("/api/signup", async (req: any, res) => {
    try {
      const { email, password, fullName } = req.body;
      if (!email || !password) return res.status(400).json({ message: "Missing email or password" });

      const existing = await authStorage.getUserByEmail(email);
      if (existing) return res.status(409).json({ message: "Email already in use" });

      const created = await (await import("./replitAuth")).createUser(email, password, fullName ?? undefined);
      const { passwordHash: _ph, ...safeUser } = created as any;
      req.login(created, (err: any) => {
        if (err) {
          console.error("Login after signup failed:", err);
          return res.status(500).json({ message: "Signup succeeded but login failed" });
        }
        return res.status(201).json(safeUser);
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Signup failed" });
    }
  });

  // Local login
  app.post("/api/local-login", async (req: any, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ message: "Missing email or password" });

      const user = await authStorage.getUserByEmail(email);
      if (!user || !user.passwordHash) return res.status(401).json({ message: "Invalid credentials" });

      const bcryptMod = await import("bcryptjs");
      const bcrypt = (bcryptMod as any).default ?? bcryptMod;
      const ok = bcrypt.compareSync ? bcrypt.compareSync(password, user.passwordHash as string) : await bcrypt.compare(password, user.passwordHash as string);
      if (!ok) return res.status(401).json({ message: "Invalid credentials" });

      // create session via passport
      req.login(user, (err: any) => {
        if (err) {
          console.error("Local login req.login error:", err);
          return res.status(500).json({ message: "Login failed" });
        }
        const { passwordHash, ...safe } = user as any;
        res.json(safe);
      });
    } catch (error) {
      console.error("Local login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });
}
