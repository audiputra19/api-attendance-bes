import { Request, Response } from "express";
import jwt from 'jsonwebtoken';
import connection from "../config/db";
import { RowDataPacket } from "mysql2";
import { TemporaryUser } from "../interfaces/verfication";
import bcrypt from 'bcryptjs';

export const verficationRegistration = async (req: Request, res: Response) => {
    const { token } = req.body;

    try {
        const secret = process.env.JWT_SECRET!;
        const decoded = jwt.verify(token, secret);

        const [rows] = await connection.query<RowDataPacket[]>('SELECT * FROM user_temporary WHERE token = ?', [token]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Token tidak valid atau sudah kedaluwarsa' });
        }

        const tempUser = rows[0] as TemporaryUser;

        const salt = await bcrypt.genSalt(10);
        const hashedPass = await bcrypt.hash(tempUser.pass, salt);

        await connection.query('INSERT INTO user_auth (nik, email, pass) VALUES (?, ?, ?)', [tempUser.nik, tempUser.email, hashedPass]);
        await connection.query('DELETE FROM user_temporary WHERE token = ?', [token]);

        return res.status(200).json({ message: 'Registrasi berhasil, silakan login' });

    } catch (error) {
        console.error('Verification Error:', error);
        if (!res.headersSent) {
            return res.status(500).json({ message: 'Token tidak valid atau sudah kedaluwarsa' });
        }
    }
}