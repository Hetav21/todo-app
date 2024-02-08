import { Router, Request, Response } from "express";
import { user, user as userType } from "../CustomTypes/userType";
import { PrismaClient } from "@prisma/client";
import userSchema from "../InputValidation/user";
import z from "zod";
import "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import userMiddleware from "../Middleware/user";
import userAuth from "../Authentication/user";

const prisma = new PrismaClient();

const router = Router();

// async function hashPassword(password: string): Promise<string> {
//   const res = await bcrypt.hashSync(password, 10);

//   return res.hash;
// }

// console.log(hashPassword("password"));

router.post("/signup", async (req: Request, res: Response) => {
  const user: userType = req.body.user;

  const parse = userSchema.safeParse(user);

  if (!parse.success) {
    res.status(411).json({
      userCreated: false,
      inputError: true,
    });
  }

  const findUser = await prisma.user.findMany({
    where: {
      OR: [
        {
          username: user["username"],
        },
        {
          email: user["email"],
        },
      ],
    },
  });

  if (findUser.length != 0) {
    res.status(411).json({
      userCreated: false,
      inputError: true,
    });

    return;
  }

  const newUser = await prisma.user.create({
    data: {
      name: user["name"],
      email: user["email"],
      username: user["username"],
      // username: hashPassword(user["username"]),
      password: user["password"],
    },
  });

  res.status(411).json({
    userCreated: true,
    inputError: false,
  });

  return;
});

router.get("/signin", async (req: Request, res: Response) => {
  const username: userType["username"] = req.headers
    .username as userType["username"];
  const password: userType["password"] = req.headers
    .password as userType["password"];

  const passwordSchema = z.string().min(8);
  const usernameSchema = z.string();

  if (
    !passwordSchema.safeParse(password).success &&
    !usernameSchema.safeParse(userSchema).success
  ) {
    res.status(411).json({
      userExists: false,
      inputError: true,
    });

    return;
  }

  const status = await prisma.user.findFirst({
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
      userExists: false,
      inputError: true,
    });
  }

  const idToken: String = jwt.sign(status!, process.env.JWT_SECRET!);

  res.status(200).json({
    invalidLogin: false,
    userExists: true,
    inputError: false,
    user: status,
    idToken: "Bearer " + idToken,
  });

  return;
});

router.put("/update-profile", userMiddleware, userAuth, async (req: Request, res: Response) => {
  const user: userType = req.body.user as userType;

  const updatedUser: userType = req.body.updatedUser as userType;

  const password = req.body.password as userType["password"];

  user["password"] = password;

  const parseOld = userSchema.safeParse(user);

  const parse = userSchema.safeParse(updatedUser);

  if (!parse.success || !parseOld.success) {
    res.status(411).json({
      userUpdated: false,
      inputError: true,
    });

    return;
  }

  const findUser = await prisma.user.findFirst({
    where: {
      name: user["name"],
      email: user["email"],
      username: user["username"],
      password: user["password"],
    },
  });

  if (findUser == null) {
    res.status(411).json({
      userExists: false,
      userUpdated: false,
      inputError: true,
    });

    return;
  }

  const updateUser = await prisma.user.update({
    where: {
      username: user["username"],
      email: user["email"],
      password: user["password"],
      name: user["name"],
    },
    data: {
      name: updatedUser["name"],
      email: updatedUser["email"],
      username: updatedUser["username"],
      password: updatedUser["password"],
    },
  });

  res.status(200).json({
    userUpdated: true,
    userExists: true,
    inputError: false,
  });

  return;
});

export = router;