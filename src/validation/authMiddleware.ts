import type {Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken"
import type { UUID } from "node:crypto";
import { success } from "zod";

const JWT_SECRET = process.env.JWT_SECRET!;

export interface CustomRequest extends Request{
    userId : string;
    name : string;
    role : string;
    email : string
    supervisorId : UUID
}



export function authMiddleware(req: CustomRequest, res : Response, next : NextFunction){

    try {
        const token = req.headers.authorization;
    
        if(!token){
            return res.status(400).json({
    
                success: false,
                message : "token missing"
            })
        }
        const verified = jwt.verify(token, JWT_SECRET) as JwtPayload;

        console.log(verified);
    
        req.userId = verified.id;
        req.name = verified.name;

        next();

    } catch (e){

        return res.status(400).json({
            success : false,
            message : "error with token"
        })
    }
}
