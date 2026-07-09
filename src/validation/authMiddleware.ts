import type {Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken"
import { success } from "zod";

const JWT_SECRET = process.env.JWT_SECRET!;

interface CustomRequest extends Request{
    userId : string;
}



export function authMiddleware(req: CustomRequest, res : Response, next : NextFunction){

    const token = req.headers.authorization;

    if(!token){
        return res.status(400).json({

            success: false,
            message : "token missing"
        })
    }
    const verified = jwt.verify(token, JWT_SECRET) as JwtPayload;

    req.userId = verified.userId;


    next();
}
