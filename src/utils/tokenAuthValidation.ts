import { NextFunction, Request, Response } from "express";
import { User } from "../interfaces/user";
import jwt from 'jsonwebtoken'

interface validationReq extends Request {
    userData: User
}

export const tokenAuthValidation = (req: Request, res: Response, next: NextFunction) => {
    const validationReq = req as validationReq;
    const {authorization} = validationReq.headers

    console.log("Authorization Header: ", authorization);

    if(!authorization){
        return res.status(401).json({
            message: 'Kamu butuh token untuk login'
        })
    }

    const token = authorization.split(' ')[1];
    console.log("Token di server: ", token);
    const secret = process.env.JWT_SECRET!;

    try {
        const jwtDecode = jwt.verify(token, secret);
        validationReq.userData = jwtDecode as User;
    } catch (error) {
        console.error("JWT Verification Error: ", error); 
        return res.status(401).json({
            message: 'Unauthorized!', error: error
        });
    }

    next();
}