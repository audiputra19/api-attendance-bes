"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportAttendance = void 0;
const db_1 = __importDefault(require("../config/db"));
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const ReportAttendance = async (req, res) => {
    const { startDate, endDate, nik } = req.body;
    const start = (0, moment_timezone_1.default)(startDate).format('YYYY-MM-DD');
    const end = (0, moment_timezone_1.default)(endDate).format('YYYY-MM-DD');
    //console.log(`${start}, ${end}, ${nik}`);
    try {
        const [data] = await db_1.default.query(`SELECT SUM(hadir) as hadir, SUM(alpa) as alpa, SUM(tlt) as telat, SUM(ijin) as izin, SUM(cuti) as cuti
            FROM absen_harian 
            WHERE DATE(tanggal) BETWEEN ? AND ? 
            AND nik = ? 
            ORDER BY tanggal DESC`, [start, end, nik]);
        const report = data[0];
        res.status(200).json({
            data: {
                hadir: report.hadir,
                alpa: report.alpa,
                telat: report.telat,
                izin: report.izin,
                cuti: report.cuti
            }
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
};
exports.ReportAttendance = ReportAttendance;
