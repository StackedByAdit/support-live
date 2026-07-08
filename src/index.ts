import { userSchema } from "./schema/zodSchema";
import type { Request, Response } from "express";
import bcrypt from "bcrypt";

import { Prisma, PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

const express = require("express");
const app = express();

app.use(express.json());

app.post("/auth/signup", async (req: Request, res: Response) => {
  try {
    const result = userSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid request schema",
      });
    }

    const { name, email, password, role, supervisorId } = result.data;

    if (role === "agent") {
      if (!supervisorId) {
        return res.status(400).json({
          success: false,
          message: "supervisorId required for agent role",
        });
      }

      const supervisor = await prisma.user.findUnique({
        where: {
          id: supervisorId,
        },
      });

      if (!supervisor) {
        return res.status(404).json({
          success: false,
          message: "Supervisor not found",
        });
      }

      if (supervisor.role !== "supervisor") {
        return res.status(400).json({
          success: false,
          message: "User is not a supervisor",
        });
      }
    }

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        error: "Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        supervisorId,
      },
    });

    return res.status(201).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err,
    });
  }
});

app.post("/auth/login", async (req: Request, res: Response) => {

})

app.get("/auth/me", async (req: Request, res: Response) => {

})

app.post("/conversations", async (req: Request, res: Response) => {

})

app.post("/conversations/:id/assign", async (req: Request, res: Response) => {

})

app.post("/conversations/:id", async (req: Request, res: Response) => {

})

app.post("/conversations/:id/close", async (req: Request, res: Response) => {

})

app.get("/admin/analytics", async (req: Request, res: Response) => {

})

app.listen(3000, () => {
  console.log("running on port 3000")
});


