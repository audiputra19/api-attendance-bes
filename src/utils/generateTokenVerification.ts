import jwt from 'jsonwebtoken'

export const generateTokenVerification = (id: number) => {
    const secret = process.env.JWT_SECRET as string;

    return jwt.sign({id}, secret, {
        expiresIn: '1h'
    });
}