import { Router, Request, Response } from "express";
import { admin, admin as adminType } from "../CustomTypes/adminType";
import { PrismaClient } from "@prisma/client";
import adminSchema from "../InputValidation/admin";
import z from "zod";
import "dotenv";
import jwt from "jsonwebtoken";
import adminAuth from "../Middleware/admin";
import bcrypt from "bcrypt";
import adminMiddleware from "../Middleware/admin";

const prisma = new PrismaClient();

const router = Router();

// async function hashPassword(password: string): Promise<string> {
//   const res = await bcrypt.hashSync(password, 10);

//   return res.hash;
// }

// console.log(hashPassword("password"));

router.post("/signup", async (req: Request, res: Response) => {
  const admin: adminType = req.body.admin;

  const parse = adminSchema.safeParse(admin);

  if (!parse.success) {
    res.status(411).json({
      adminCreated: false,
      inputError: true,
    });
  }

  const findadmin = await prisma.admin.findMany({
    where: {
      OR: [
        {
          username: admin["username"],
        },
        {
          email: admin["email"],
        },
      ],
    },
  });

  if (findadmin.length != 0) {
    res.status(411).json({
      adminCreated: false,
      inputError: true,
    });

    return;
  }

  const newadmin = await prisma.admin.create({
    data: {
      name: admin["name"],
      email: admin["email"],
      username: admin["username"],
      // username: hashPassword(admin["username"]),
      password: admin["password"],
    },
  });

  res.status(411).json({
    adminCreated: true,
    inputError: false,
  });

  return;
});

router.get("/signin", async (req: Request, res: Response) => {
  const username: adminType["username"] = req.headers
    .username as adminType["username"];
  const password: adminType["password"] = req.headers
    .password as adminType["password"];

  const passwordSchema = z.string().min(8);
  const usernameSchema = z.string();

  if (
    !passwordSchema.safeParse(password).success &&
    !usernameSchema.safeParse(adminSchema).success
  ) {
    res.status(411).json({
      adminExists: false,
      inputError: true,
    });

    return;
  }

  const status = await prisma.admin.findFirst({
    where: {
      OR: [{ username: username }, { email: username }],
      password,
    },
    select: {
      name: true,
      email: true,
      username: true,
    },
  });

  if (status == null) {
    res.status(200).json({
      invalidLogin: true,
      adminExists: false,
      inputError: true,
    });
  }

  const idToken: String = jwt.sign(status!, process.env.JWT_SECRET!);

  res.status(200).json({
    invalidLogin: false,
    adminExists: true,
    inputError: false,
    admin: status,
    idToken: "Bearer " + idToken,
  });

  return;
});

router.put(
  "/update-profile",
  adminAuth,
  async (req: Request, res: Response) => {
    const admin: adminType = req.body.admin as adminType;

    const updatedadmin: adminType = req.body.updatedadmin as adminType;

    const password = req.body.password as adminType["password"];

    admin["password"] = password;

    const parseOld = adminSchema.safeParse(admin);

    const parse = adminSchema.safeParse(updatedadmin);

    if (!parse.success || !parseOld.success) {
      res.status(411).json({
        adminUpdated: false,
        inputError: true,
      });

      return;
    }

    const findadmin = await prisma.admin.findFirst({
      where: {
        name: admin["name"],
        email: admin["email"],
        username: admin["username"],
        password: admin["password"],
      },
    });

    if (findadmin == null) {
      res.status(411).json({
        adminExists: false,
        adminUpdated: false,
        inputError: true,
      });

      return;
    }

    const updateadmin = await prisma.admin.update({
      where: {
        username: admin["username"],
        email: admin["email"],
        password: admin["password"],
        name: admin["name"],
      },
      data: {
        name: updatedadmin["name"],
        email: updatedadmin["email"],
        username: updatedadmin["username"],
        password: updatedadmin["password"],
      },
    });

    res.status(200).json({
      adminUpdated: true,
      adminExists: true,
      inputError: false,
    });

    return;
  }
);

router.get(
  "/users",
  adminMiddleware,
  adminAuth,
  async (req: Request, res: Response) => {
    const users = await prisma.user.findMany();
    res.status(200).json({ users });
  }
);

router.put(
  "/user/:id",
  adminMiddleware,
  adminAuth,
  async (req: Request, res: Response) => {
    const userId = parseInt(req.params.id);

    if (userId == null || userId <= 0) {
      res.status(411).json({
        userDeleted: false,
        inputError: true,
      });
    }

    const deleteUser = await prisma.user.delete({
      where: {
        id: userId,
      },
    });

    console.log(deleteUser);

    res.status(200).json({
      userDeleted: true,
    });
  }
);

export = router;
