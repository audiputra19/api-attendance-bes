import { query, Request, Response } from "express";
import connection from "../config/db";
import { RowDataPacket } from "mysql2";
import { ForgotPass } from "../interfaces/forgotPass";
import { generateTokenForgotPass } from "../utils/generateTokenForgotPass";
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET;

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    // logger: true,
    // debug: true,
    pool: true,    // Menjaga koneksi tetap terbuka
    maxConnections: 1,
    maxMessages: 3,
    rateLimit: 1,
});

const BASE_URL = "https://project-attendance-bes.vercel.app";
// const BASE_URL = "http://localhost:3000";

export const forgotPass = async (req: Request, res: Response) => {
    const { email } = req.body;

    try {
        if(email.length === 0){
            return res.status(404).json({ message: 'Form harus diisi' });
        }
        
        const [rows] = await connection.query<RowDataPacket[]>(
            `SELECT user_auth.nik, karyawan.nama FROM user_auth
            INNER JOIN karyawan ON karyawan.nik = user_auth.nik
            WHERE user_auth.email = ?`, [email]
        );

        if(rows.length === 0){
            return res.status(404).json({ message: 'Email belum terdaftar' });
        }

        const user = rows[0] as ForgotPass;
        const resetToken = generateTokenForgotPass(user.nik);
        const resetUrl = `${BASE_URL}/auth/reset-pass/${resetToken}`;

        const mailOptions = {
            from: '"Admin IT" <curhatfilm19@gmail.com>',
            to: email,
            subject: 'Reset Password Anda',
            text: `Halo ${user.nama},\n\nKlik tautan berikut untuk mengatur ulang password Anda: ${resetUrl}\nJangan bagikan link ini kesiapapun, tautan ini akan kedaluwarsa dalam 1 jam.`,
        };  
        
        // transporter.sendMail(mailOptions, (error, info) => {
        //     if (error) {
        //         console.log('Error:', error);
        //         return;
        //     }
        //     console.log('Email sent:', info.response);
        // });

        try {
            await transporter.sendMail(mailOptions);
            console.log('Email sent successfully');
        } catch (error) {
            console.error('Error while sending email:', error);
            return res.status(500).json({ message: 'Gagal mengirim email' });
        }

        await connection.query('UPDATE user_auth SET reset_token = ? WHERE email = ?', [resetToken, email]);

        res.status(200).json({ message: 'Email reset password telah dikirim' });
    } catch (error) {
        return res.status(500).json({ message: 'Terjadi kesalahan pada server', error });
    }
}

export const resetPass = async (req: Request, res: Response) => {
    const { token, newPassword, confirmPassword } = req.body;

    try {
        if(newPassword.length === 0 || confirmPassword.length === 0){
            return res.status(404).json({ message: 'Form harus diisi' })
        }

        const passwordRegex = /^.{6,}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(404).json({ message: 'Password minimal 6 karakter' });
        }

        if(newPassword !== confirmPassword){
            return res.status(404).json({ message: 'Isi konfirmasi password dengan benar' })
        }

        jwt.verify(token, JWT_SECRET as string);
        
        const salt = await bcrypt.genSalt(10);
        const hashedPass = await bcrypt.hash(newPassword, salt);

        const [result] = await connection.query('UPDATE user_auth SET pass = ? WHERE reset_token = ?', [hashedPass, token])
        console.log('Update Result:', result);
        res.status(200).json({ message: 'Password berhasil diganti' });
    } catch (error) {
        res.status(400).json({ message: 'Token tidak valid atau telah kedaluwarsa' });
    }
} 