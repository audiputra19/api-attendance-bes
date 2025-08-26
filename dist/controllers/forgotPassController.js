"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPass = exports.forgotPass = void 0;
const db_1 = __importDefault(require("../config/db"));
const generateTokenForgotPass_1 = require("../utils/generateTokenForgotPass");
const nodemailer_1 = __importDefault(require("nodemailer"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const JWT_SECRET = process.env.JWT_SECRET;
const transporter = nodemailer_1.default.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});
const forgotPass = async (req, res) => {
    const { email } = req.body;
    try {
        if (email.length === 0) {
            return res.status(404).json({ message: 'Form harus diisi' });
        }
        const [rows] = await db_1.default.query(`SELECT user_auth.nik, dt_karyawan.NM_LKP AS nama FROM user_auth
            INNER JOIN dt_karyawan ON dt_karyawan.ID_KAR = user_auth.nik
            WHERE user_auth.email = ?`, [email]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Email belum terdaftar' });
        }
        const user = rows[0];
        const resetToken = (0, generateTokenForgotPass_1.generateTokenForgotPass)(user.nik);
        const resetUrl = `https://project-absensi.vercel.app/auth/reset-pass/${resetToken}`;
        const mailOptions = {
            from: '"Admin IT" <curhatfilm19@gmail.com>',
            to: email,
            subject: 'Reset Password Anda',
            text: `Halo ${user.nama},\n\nKlik tautan berikut untuk mengatur ulang password Anda: ${resetUrl}\nJangan bagikan link ini kesiapapun, tautan ini akan kedaluwarsa dalam 1 jam.`,
        };
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log('Error:', error);
                return;
            }
            console.log('Email sent:', info.response);
        });
        await db_1.default.query('UPDATE user_auth SET reset_token = ? WHERE email = ?', [resetToken, email]);
        res.status(200).json({ message: 'Email reset password telah dikirim' });
    }
    catch (error) {
        return res.status(500).json({ message: 'Terjadi kesalahan pada server', error });
    }
};
exports.forgotPass = forgotPass;
const resetPass = async (req, res) => {
    const { token, newPassword, confirmPassword } = req.body;
    try {
        if (newPassword.length === 0 || confirmPassword.length === 0) {
            return res.status(404).json({ message: 'Form harus diisi' });
        }
        const passwordRegex = /^.{6,}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(404).json({ message: 'Password minimal 6 karakter' });
        }
        if (newPassword !== confirmPassword) {
            return res.status(404).json({ message: 'Isi konfirmasi password dengan benar' });
        }
        jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPass = await bcryptjs_1.default.hash(newPassword, salt);
        await db_1.default.query('UPDATE user_auth SET pass = ? WHERE reset_token = ?', [hashedPass, token]);
        res.status(200).json({ message: 'Password berhasil diganti' });
    }
    catch (error) {
        res.status(400).json({ message: 'Token tidak valid atau telah kedaluwarsa' });
    }
};
exports.resetPass = resetPass;
