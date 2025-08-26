"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.lemburValidation = void 0;
const db_1 = __importDefault(require("../config/db"));
const moment_1 = __importDefault(require("moment"));
const lemburValidation = async (req, res, next) => {
    const employee = req.body.employee;
    try {
        const day = (0, moment_1.default)().day();
        const date = (0, moment_1.default)().tz('Asia/Jakarta').format('YYYY-MM-DD');
        const time = (0, moment_1.default)().tz('Asia/Jakarta').format('HH:mm:ss');
        const nik = employee.nik;
        const [libur] = await db_1.default.query(`SELECT keterangan, halfd FROM libur WHERE tanggal = ?`, [date]);
        const checkLibur = libur;
        const dtLibur = checkLibur[0];
        let hariKerja = '';
        if (day === 5) {
            hariKerja = 'Jumat';
        }
        else if (day === 7 || day === 6 || checkLibur.length > 0) {
            hariKerja = 0;
            const [lembur] = await db_1.default.query(`SELECT lembur.no_spl, lembur.real_in, lembur.real_ov
                FROM lembur
                WHERE lembur.tanggal = ? AND lembur.nik = ?`, [date, nik]);
            const checkLembur = lembur;
            const dtLembur = checkLembur[0];
            if (checkLembur.length > 0) {
                const noSpl = dtLembur.no_spl;
                const realIn = dtLembur.real_in;
                if (realIn === 0) {
                    await db_1.default.query(`UPDATE lembur SET real_in = ? WHERE no_spl = ?`, [time, noSpl]);
                    res.status(200).json({ message: 'Selamat bekerja lembur' });
                }
                else {
                    const dateTime1 = (0, moment_1.default)(`${date} ${realIn}`, 'YYYY-MM-DD HH:mm:ss');
                    const dateTime2 = (0, moment_1.default)(`${date} ${time}`, 'YYYY-MM-DD HH:mm:ss');
                    const interval = moment_1.default.duration(dateTime2.diff(dateTime1)).asMinutes();
                    let realOv = Math.round(interval);
                    if (realOv < 60) {
                        res.status(200).json({ message: 'Lembur anda dibawah 1 jam' });
                    }
                    else {
                        if (day === 6) {
                            realOv = realOv;
                        }
                        else if (day === 7 || checkLibur.length > 0) {
                            if (realOv >= 300) {
                                realOv -= 60;
                            }
                            else {
                                realOv = realOv;
                            }
                        }
                        else {
                            if (realOv >= 180) {
                                realOv -= 60;
                            }
                            else {
                                realOv = realOv;
                            }
                        }
                    }
                    await db_1.default.query(`UPDATE lembur SET real_out = ?, real_ov = ? WHERE no_spl = ?`, [time, realOv, noSpl]);
                    res.status(200).json({ message: 'Terima kasih telah lembur, Jaga kesehatan' });
                }
            }
            else {
                if (checkLibur.length > 0) {
                    res.status(200).json({ message: `Ini hari libur, memperingati ${dtLibur.keterangan}` });
                }
                else {
                    res.status(200).json({ message: 'ini hari libur weekend' });
                }
            }
        }
        else {
            hariKerja = 'Normal';
        }
        const attendaceData = {
            employee: employee,
            hariKerja: hariKerja
        };
        console.log(hariKerja);
        req.body.dataReqAttendance = attendaceData;
        next();
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching employee', error });
    }
};
exports.lemburValidation = lemburValidation;
