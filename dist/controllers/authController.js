"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUser = exports.registerUser = void 0;
const db_1 = __importDefault(require("../config/db"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const generateTokenAuth_1 = require("../utils/generateTokenAuth");
const registerUser = async (req, res) => {
    const { nik, email, password, confirmPassword } = req.body;
    try {
        if (nik.length === 0 || email.length === 0 || password.length === 0 || confirmPassword.length === 0) {
            return res.status(401).json({ message: 'Form harus diisi' });
        }
        const passwordRegex = /^.{6,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(404).json({ message: 'Password minimal 6 karakter.' });
        }
        if (password !== confirmPassword) {
            return res.status(404).json({ message: 'Isi konfirmasi password dengan benar' });
        }
        const [rows] = await db_1.default.query('SELECT * FROM dt_karyawan WHERE dt_karyawan.ID_KAR = ?', [nik]);
        const user = rows;
        if (user.length === 0) {
            return res.status(404).json({ message: 'NIK tidak ditemukan' });
        }
        const [data] = await db_1.default.query('SELECT * FROM user_auth WHERE nik = ?', [nik]);
        const userAuth = data;
        if (userAuth.length !== 0) {
            return res.status(404).json({ message: 'NIK sudah pernah registrasi' });
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPass = await bcryptjs_1.default.hash(password, salt);
        await db_1.default.query('INSERT INTO user_auth (nik, pass, email) VALUE (?, ?, ?)', [nik, hashedPass, email]);
        return res.status(200).json({ message: 'Registrasi berhasil' });
    }
    catch (error) {
        return res.status(500).json({ message: 'Terjadi kesalahan pada server', error });
    }
};
exports.registerUser = registerUser;
const loginUser = async (req, res) => {
    const { nik, password } = req.body;
    try {
        if (nik.length === 0 || password.length === 0) {
            return res.status(401).json({ message: 'Form harus diisi' });
        }
        const [rows] = await db_1.default.query('SELECT * FROM user_auth WHERE nik = ?', [nik]);
        const data = rows;
        const user = data[0];
        if (user) {
            const isPasswordMatch = await bcryptjs_1.default.compare(password, user.pass);
            if (isPasswordMatch) {
                const userData = {
                    nik: user.nik,
                    email: user.email,
                    pass: user.pass
                };
                const token = (0, generateTokenAuth_1.generateTokenAuth)(userData);
                return res.status(200).json({
                    data: {
                        userData,
                        token,
                    },
                    message: 'Login berhasil',
                });
            }
            else {
                return res.status(401).json({ message: 'NIK atau password salah!' });
            }
        }
        else {
            return res.status(401).json({ message: 'NIK atau password salah!' });
        }
    }
    catch (error) {
        return res.status(500).json({ message: 'Terjadi kesalahan pada server', error });
    }
};
exports.loginUser = loginUser;
