import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import "dotenv";

function userMiddleware(req: Request, res: Response, next: NextFunction){
    const idToken: string = req.headers.authorization!;
    const jwtToken: string = idToken.split(" ")["1"];

    const verify:any = jwt.verify(jwtToken, process.env.JWT_SECRET!);

    if(verify == undefined){
        res.status(403).json({
            authenticationError: true
        })
    }

    else{
        req.headers.user = verify.user; 
        next();
    }
}

export = userMiddleware;