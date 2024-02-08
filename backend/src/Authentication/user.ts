import { NextFunction, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import "dotenv";

const prisma = new PrismaClient();

async function userAuth(req: Request, res: Response, next: NextFunction){
    const user = req.body.user;

    const search = await prisma.user.findUnique({
        where: {
            username: user["username"],
            email: user["email"],
            name: user["name"],
        }
    });

    if(search != null){
        next();
    }
    
    else{
        res.status(403).json({
            userExists: false,
            authenticationError: true
        })
    }
}

export = userAuth;