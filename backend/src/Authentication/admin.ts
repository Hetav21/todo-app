import { NextFunction, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import "dotenv";

const prisma = new PrismaClient();

async function adminAuth(req: Request, res: Response, next: NextFunction){
    const admin = req.body.admin;

    const search = await prisma.admin.findUnique({
        where: {
            username: admin["username"],
            email: admin["email"],
            name: admin["name"],
        }
    });

    if(search != null){
        next();
    }
    
    else{
        res.status(403).json({
            adminExists: false,
            authenticationError: true
        })
    }
}

export = adminAuth;