import { consversationAssignSchema, loginSchema, signupSchema } from "./schema/zodSchema";
import type { Request, Response } from "express";
import bcrypt from "bcrypt";

import { Prisma, PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { success } from "zod";
import { authMiddleware, type CustomRequest } from "./validation/authMiddleware";
import jwt from "jsonwebtoken";
import { id } from "zod/v4/locales";
const JWT_SECRET = process.env.JWT_SECRET!;

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
    const result = signupSchema.safeParse(req.body);

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

      if (role !== "agent" && supervisorId) {
        return res.status(400).json({
          success: false,
          message: "Only agents can have supervisors"
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
        message: "Email already exists",
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
    });
  }
});

app.post("/auth/login", async (req: Request, res: Response) => {

  try {
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "error logging in"
      })
    }

    const { email, password } = result.data;

    const user = await prisma.user.findFirst({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found, sign up first",
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user.id, name : user.name, email : user.email, role : user.role, supervisorId : user.supervisorId}, JWT_SECRET);

    return res.status(200).json({
      success: true,
      data: {
        token: token
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }

})

app.get("/auth/me", authMiddleware, async (req: CustomRequest, res: Response) => {

  return res.status(200).json({
    success: true,
    data : {
      id : req.userId,
      name : req.name,
      email : req.email,
      role : req.role,
      supervisorId : req.supervisorId
    }
  })
})

app.post(
  "/conversations",
  authMiddleware,
  async (req: CustomRequest, res: Response) => {
    try {
      if (req.role !== "candidate") {
        return res.status(403).json({
          success: false,
          message: "Only candidates can create conversations",
        });
      }

      const { supervisorId } = req.body;

      if (!supervisorId) {
        return res.status(400).json({
          success: false,
          message: "supervisorId is required",
        });
      }

      const supervisor = await prisma.user.findUnique({
        where: {
          id: supervisorId,
        },
      });

      if (!supervisor || supervisor.role !== "supervisor") {
        return res.status(404).json({
          success: false,
          message: "Supervisor not found",
        });
      }

      const existingConversation = await prisma.conversation.findFirst({
        where: {
          candidateId: req.userId,
          status: {
            in: ["open", "assigned"],
          },
        },
      });

      if (existingConversation) {
        return res.status(409).json({
          success: false,
          message: "You already have an active conversation",
        });
      }

      const conversation = await prisma.conversation.create({
        data: {
          candidateId: req.userId,
          supervisorId,
          status: "open",
        },
      });

      return res.status(201).json({
        success: true,
        data: {
          id: conversation.id,
          status: conversation.status,
          supervisorId: conversation.supervisorId,
        },
      });
    } catch (err) {

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

app.post("/conversations/:id/assign", authMiddleware, async (req: CustomRequest, res: Response) => {
  const result = consversationAssignSchema.safeParse(req.body);

  if(!result.success){
    return res.status(400).json({
      success : false,
      message: "agent Id needed"
    })
  }

  const agentId = result.data?.agentId

  if (req.role !== "supervisor") {
    return res.status(403).json({
        success: false,
        message: "Only supervisors can assign conversations"
    });
}

  const conversation = await prisma.conversation.findUnique({
    where: {
        id: 
    }
});

if (!conversation) {
    return res.status(404).json({
        success: false,
        message: "Conversation not found"
    });
}

  if(!conversation){
    return res.status(400).json({
      success : false,
      message : "no conversation with this agent Id found"
    })
  }


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


