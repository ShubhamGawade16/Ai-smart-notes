import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { storage } from "../storage";
import { z } from "zod";
import type { Request, Response } from "express";
import { authenticateToken, type AuthRequest } from "../auth";

const router = Router();

// JWT secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || "planify-secret-key-change-in-production";

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = loginSchema.extend({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

// Register endpoint
router.post("/register", async (req: Request, res: Response) => {
  try {
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid input", details: result.error.errors });
    }

    const { email, password, firstName, lastName } = result.data;

    // Check if user already exists
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await storage.createUser({
      email,
      passwordHash,
      firstName,
      lastName,
      tier: "free",
      onboardingCompleted: false,
    });

    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

    res.json({ 
      user: {
        ...user,
        passwordHash: undefined, // Don't send password hash to client
      }, 
      token 
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Failed to register user" });
  }
});

// Login endpoint
router.post("/login", async (req: Request, res: Response) => {
  try {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid input", details: result.error.errors });
    }

    const { email, password } = result.data;

    // Find user
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: "No user found with this email. Please check your credentials or sign up for a new account." });
    }
    
    if (!user.passwordHash) {
      return res.status(401).json({ error: "Invalid account setup. Please contact support." });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

    res.json({ 
      user: {
        ...user,
        passwordHash: undefined, // Don't send password hash to client
      }, 
      token 
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

// Logout endpoint
router.post("/logout", authenticateToken, (req: AuthRequest, res: Response) => {
  // Since we're using JWT, we don't need to do anything server-side
  // The client will remove the token
  res.json({ message: "Logged out successfully" });
});

// Get current user
router.get("/user", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "User ID not found in token" });
    }

    const user = await storage.getUser(req.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ 
      user: {
        ...user,
        passwordHash: undefined, // Don't send password hash to client
      }
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Failed to get user" });
  }
});

// Update user (for onboarding and profile updates)
router.patch("/user", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "User ID not found in token" });
    }

    const updates = req.body;
    
    // Don't allow updating certain fields
    delete updates.id;
    delete updates.email;
    delete updates.passwordHash;
    delete updates.tier;
    delete updates.createdAt;

    const user = await storage.updateUser(req.userId, updates);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ 
      user: {
        ...user,
        passwordHash: undefined,
      }
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});

export default router;