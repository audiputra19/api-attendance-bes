import { User } from "../interfaces/user";
import jwt from 'jsonwebtoken'

export const generateTokenAuth = (id: User) => {
    const secret = process.env.JWT_SECRET as string;

    return jwt.sign({id}, secret, {
        expiresIn: '1h'
    })
}