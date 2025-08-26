"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeAttendance = void 0;
const db_1 = __importDefault(require("../config/db"));
const moment_1 = __importDefault(require("moment"));
const TimeAttendance = async (req, res) => {
    const { nik } = req.body;
    try {
        //console.log("time attendance")
        const date = (0, moment_1.default)().format('YYYY-MM-DD');
        const [absen] = await db_1.default.query(`SELECT jam_msk, jam_is_klr, jam_is_msk, jam_klr, tlt, tlt_is, alpa
            FROM absen_harian 
            WHERE nik = ? 
            AND tanggal = ?`, [nik, date]);
        const checkAbsen = absen;
        const dtAbsen = checkAbsen[0];
        const jamMasuk = dtAbsen.jam_msk;
        const jamIstKeluar = dtAbsen.jam_is_klr;
        const jamIstMasuk = dtAbsen.jam_is_msk;
        const jamKeluar = dtAbsen.jam_klr;
        const telat = dtAbsen.tlt;
        const telatIst = dtAbsen.tlt_is;
        const alpa = dtAbsen.alpa;
        res.status(200).json({
            data: {
                masuk: jamMasuk,
                istKeluar: jamIstKeluar,
                istMasuk: jamIstMasuk,
                keluar: jamKeluar,
                telat: telat,
                telatIst: telatIst,
                alpa: alpa
            }
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
};
exports.TimeAttendance = TimeAttendance;
