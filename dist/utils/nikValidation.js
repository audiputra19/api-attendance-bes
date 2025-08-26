"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../config/db"));
const nikValidation = async (req, res, next) => {
    //console.log('Body Request:', req.body);
    const { nik } = req.body;
    if (!nik) {
        return res.status(400).json({ message: 'Parameter nik harus disertakan dalam body permintaan.' });
    }
    try {
        const [data] = await db_1.default.query('SELECT ID_KAR as nik, NM_LKP as nama FROM dt_karyawan WHERE ID_KAR = ?', [nik]);
        if (data.length === 0) {
            return res.status(404).json({ message: 'ID tidak dikenal!' });
        }
        req.body.employee = data[0];
        next();
    }
    catch (error) {
        console.error('Kesalahan SQL:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
};
exports.default = nikValidation;
