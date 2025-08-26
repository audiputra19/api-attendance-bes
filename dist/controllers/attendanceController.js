"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.attendanceUser = void 0;
const db_1 = __importDefault(require("../config/db"));
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const attendanceUser = async (req, res) => {
    const dataReqAttendance = req.body.dataReqAttendance;
    try {
        // console.log(dataReqAttendance)
        const year = (0, moment_timezone_1.default)().tz('Asia/Jakarta').year();
        const date = (0, moment_timezone_1.default)().tz('Asia/Jakarta').format('YYYY-MM-DD');
        const time = (0, moment_timezone_1.default)().tz('Asia/Jakarta').format('HH:mm:ss');
        const employee = dataReqAttendance.employee;
        const nik = employee.nik;
        let message = '';
        const [puasa] = await db_1.default.query(`SELECT tanggal, tanggal_2 FROM jadwal_puasa WHERE tahun = ?`, [year]);
        const dtPuasa = puasa[0];
        let jamKerja = date >= dtPuasa.tanggal && date <= dtPuasa.tanggal_2
            ? 'jam_kerja_puasa'
            : 'jam_kerja';
        const [qryHariKerja] = await db_1.default.query(`SELECT jam_msk, ist_klr, ist_msk, jam_klr 
            FROM ${jamKerja}
            WHERE hr_krj = ?`, [dataReqAttendance.hariKerja]);
        const dtHariKerja = qryHariKerja[0];
        const masuk = (0, moment_timezone_1.default)(dtHariKerja.jam_msk, 'HH:mm:ss').add(1, 'minutes').format('HH:mm:ss');
        const istKeluar = dtHariKerja.ist_klr;
        const istMasuk = dtHariKerja.ist_msk;
        const keluar = dtHariKerja.jam_klr;
        const batasAbsen = (0, moment_timezone_1.default)(masuk, 'HH:mm:ss').subtract(1, 'hours').format('HH:mm:ss');
        const batasToleransi = (0, moment_timezone_1.default)(masuk, 'HH:mm:ss').add(30, 'minutes').format('HH:mm:ss');
        const batasMasuk = (0, moment_timezone_1.default)(masuk, 'HH:mm:ss').add(1, 'hours').format('HH:mm:ss');
        const batasIstMasuk = (0, moment_timezone_1.default)(istKeluar, 'HH:mm:ss').add(30, 'minutes').format('HH:mm:ss');
        const batasKeluar = (0, moment_timezone_1.default)(keluar, 'HH:mm:ss').add(1, 'hours').format('HH:mm:ss');
        //console.log(istMasuk)
        const [absen] = await db_1.default.query(`SELECT jam_msk, jam_is_klr, jam_is_msk, jam_klr, tlt, tlt_is, alpa
			FROM absen_harian 
            WHERE nik = ? 
            AND tanggal = ?`, [nik, date]);
        const checkAbsen = absen;
        const dtAbsen = checkAbsen[0];
        if (checkAbsen.length === 0) {
            if (time < batasAbsen) {
                message = 'Belum waktunya mengabsen';
            }
            else if (time >= batasAbsen && time <= masuk) {
                await db_1.default.query(`INSERT INTO absen_harian
                    (tanggal, nik, jam_msk, jam_is_klr, jam_is_msk, jam_klr, 
                    tlt_is, tlt, hadir, ijin, sakit, 
                    cuti, alpa, dinas, adjust, lembur, 
                    shift, half_day, libnas, surat_dr)
                    VALUES 
                    (?, ?, ?, null,null,null,
                    '0','0','1','0','0',
                    '0','0','0','0','0',
                    '0','0','0','0')`, [date, nik, time]);
                message = 'Selamat bekerja';
            }
            else if (time > masuk && time <= batasMasuk) {
                await db_1.default.query(`INSERT INTO absen_harian 
                    (tanggal, nik, jam_msk, jam_is_klr, jam_is_msk, jam_klr, 
                    tlt_is, tlt, hadir, ijin, sakit, 
                    cuti, alpa, dinas, adjust, lembur, 
                    shift, half_day, libnas, surat_dr)
                    VALUES 
                    (?, ?, ?, null,null,null,
                    '0','1','1','0','0',
                    '0','0','0','0','0',
                    '0','0','0','0')`, [date, nik, time]);
                if (time < batasToleransi) {
                    const lateMinutes = (0, moment_timezone_1.default)(time, 'HH:mm:ss').diff((0, moment_timezone_1.default)(masuk, 'HH:mm:ss'), 'minutes');
                    message = `Anda terlambat ${lateMinutes} menit`;
                }
                else {
                    message = 'Silahkan hubungi bagian HRD';
                }
            }
            else if (time > batasMasuk) {
                await db_1.default.query(`INSERT INTO absen_harian 
                    (tanggal, nik, jam_msk, jam_is_klr, jam_is_msk, jam_klr, 
                        tlt_is, tlt, hadir, ijin, sakit, 
                        cuti, alpa, dinas, adjust, lembur, 
                        shift, half_day, libnas, surat_dr)
                    VALUES 
                    (?, ?, ?, null,null,null,
                    '0','1','1','0','0',
                    '0','0','0','0','0',
                    '0','0','0','0')`, [date, nik, time]);
                message = 'Silahkan hubungi bagian HRD';
            }
            res.status(200).json({
                message: message
            });
        }
        else {
            const jamMasuk = dtAbsen.jam_msk;
            const jamIstKeluar = dtAbsen.jam_is_klr;
            const jamIstMasuk = dtAbsen.jam_is_msk;
            const jamKeluar = dtAbsen.jam_klr;
            const telat = dtAbsen.tlt;
            const telatIst = dtAbsen.tlt_is;
            const alpa = dtAbsen.alpa;
            console.log(batasIstMasuk);
            if (time < istKeluar) {
                message = 'Belum waktunya istirahat';
            }
            else if (time >= istKeluar && time <= batasIstMasuk) {
                if (keluar === '16:10:00' || keluar === '16:05:00') { //absen bulan puasa
                    if (jamIstKeluar === '00:00:00') {
                        await db_1.default.query(`UPDATE absen_harian 
                            SET jam_is_klr = ? 
							WHERE nik = ? AND tanggal = ?`, [time, nik, date]);
                        message = 'Gunakan waktu istirahat anda';
                    }
                    else if (jamIstMasuk === '00:00:00') {
                        await db_1.default.query(`UPDATE absen_harian 
                            SET jam_is_msk = ? 
							WHERE nik = ? AND tanggal = ?`, [time, nik, date]);
                        message = 'Selamat bekerja kembali';
                    }
                    else {
                        message = 'Belum waktunya pulang';
                    }
                }
                else { //absen normal
                    if (jamIstKeluar === '00:00:00') {
                        await db_1.default.query(`UPDATE absen_harian 
                            SET jam_is_klr = ? 
							WHERE nik = ? AND tanggal = ?`, [time, nik, date]);
                        message = 'Selamat istirahat';
                    }
                    else {
                        message = 'Belum waktunya masuk lagi';
                    }
                }
            }
            else if (time > batasIstMasuk && time <= istMasuk) {
                if (jamIstKeluar === '00:00:00') {
                    await db_1.default.query(`UPDATE absen_harian 
                        SET jam_is_klr = ? 
                        WHERE nik = ? AND tanggal = ?`, [time, nik, date]);
                    message = 'Gunakan waktu istirahat anda';
                }
                else if (jamIstMasuk === '00:00:00') {
                    await db_1.default.query(`UPDATE absen_harian 
                        SET jam_is_msk = ? 
                        WHERE nik = ? AND tanggal = ?`, [time, nik, date]);
                    message = 'Selamat bekerja kembali';
                }
                else {
                    message = 'Belum waktunya pulang';
                }
            }
            else if (time > batasMasuk && time < keluar) {
                if (jamIstKeluar === '00:00:00') {
                    await db_1.default.query(`UPDATE absen_harian 
                        SET jam_is_klr = ?, tlt_is='1' 
                        WHERE nik = ? AND tanggal = ?`, [time, nik, date]);
                    message = 'Terlambat menggunakan waktu istirahat';
                }
                else if (jamIstMasuk === '00:00:00') {
                    await db_1.default.query(`UPDATE absen_harian 
                        SET jam_is_msk = ?, tlt_is='1' 
                        WHERE nik = ? AND tanggal = ?`, [time, nik, date]);
                    message = 'Anda terlambat masuk istirahat';
                }
                else {
                    message = 'Belum waktunya pulang';
                }
            }
            else if (time >= keluar && time <= batasKeluar) {
                //cek lembur
                const [lembur] = await db_1.default.query(`SELECT
                    lembur.no_spl,
                    lembur.real_in,
                    lembur.real_ov
                    FROM
                    lembur
                    WHERE 
                    lembur.tanggal = ? 
                    AND lembur.nik = ?`, [date, nik]);
                const checkLembur = lembur;
                if (checkLembur.length > 0) {
                    await db_1.default.query(`UPDATE absen_harian 
                        SET jam_klr = ? 
                        WHERE nik = ? AND tanggal = ?`, [time, nik, date]);
                    message = 'Ada jadwal lembur untuk anda';
                }
                else {
                    if (jamKeluar === '00:00:00') {
                        await db_1.default.query(`UPDATE absen_harian 
                            SET jam_klr = ? 
                            WHERE nik = ? AND tanggal = ?`, [time, nik, date]);
                        message = 'Terima kasih selamat istirahat';
                    }
                    else {
                        message = 'Anda sudah mengabsen pulang';
                    }
                }
            }
            else if (time > batasKeluar) {
                const [lembur] = await db_1.default.query(`SELECT
                    lembur.no_spl
                    FROM
                    lembur
                    WHERE 
                    lembur.tanggal = ? 
                    AND lembur.nik = ?`, [date, nik]);
                const checkLembur = lembur;
                if (checkLembur.length > 0) {
                    const dtLembur = checkLembur[0];
                    const spl = dtLembur.no_spl;
                    const dateTime1 = (0, moment_timezone_1.default)(`${date} ${keluar}`, 'YYYY-MM-DD HH:mm:ss');
                    const dateTime2 = (0, moment_timezone_1.default)(`${date} ${time}`, 'YYYY-MM-DD HH:mm:ss');
                    const interval = moment_timezone_1.default.duration(dateTime2.diff(dateTime1)).asMinutes();
                    const realOv = Math.round(interval / 60);
                    await db_1.default.query(`UPDATE absen_harian 
                        SET jam_klr = ? 
                        WHERE nik = ? AND tanggal = ?`, [time, nik, date]);
                    await db_1.default.query(`UPDATE lembur 
                        SET real_in = ?, real_out = ?, real_ov = ? 
                        WHERE no_spl = ?`, [keluar, time, realOv, spl]);
                    message = 'Terima kasih atas lemburnya';
                }
                else {
                    if (jamKeluar === '00:00:00') {
                        await db_1.default.query(`UPDATE absen_harian 
                            SET jam_klr = ? 
                            WHERE nik = ? AND tanggal = ?`, [time, nik, date]);
                        const kodeBln = (0, moment_timezone_1.default)(date, 'MM');
                        const kodeThn = (0, moment_timezone_1.default)(date, 'YY');
                        const [lembur] = await db_1.default.query(`SELECT no_spl 
                            FROM lembur
                            WHERE MONTH(tanggal) = ? 
                            AND YEAR(tanggal) = ? 
                            ORDER BY no_spl DESC LIMIT 1`, [kodeBln, year]);
                        const result = lembur;
                        let str_nomor;
                        if (result.length === 1) {
                            const split_str = result[0].no_spl.split("/");
                            str_nomor = parseInt(split_str[0], 10) + 1;
                        }
                        else {
                            str_nomor = 1;
                        }
                        str_nomor = str_nomor.toString().padStart(3, '0');
                        const dateTime1 = (0, moment_timezone_1.default)(`${date} ${keluar}`, 'YYYY-MM-DD HH:mm:ss');
                        const dateTime2 = (0, moment_timezone_1.default)(`${date} ${time}`, 'YYYY-MM-DD HH:mm:ss');
                        const interval = moment_timezone_1.default.duration(dateTime2.diff(dateTime1)).asMinutes();
                        const ov = Math.round(interval);
                        const job = 'Absen lebih dari 1 jam dari jam pulang';
                        const nomor = `${str_nomor}/SKN-SPL/${kodeBln}/${kodeThn}`;
                        await db_1.default.query(`INSERT INTO lembur 
                            (no_spl,tanggal,nik,jam_in,jam_out,overtime,uraian,real_in,real_out,real_ov)
                            VALUES
                            (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [nomor, date, nik, keluar, time, ov, job, keluar, time, ov]);
                        message = 'Apakah anda lembur?';
                    }
                    else {
                        message = 'Anda sudah mengabsen pulang';
                    }
                }
            }
            res.status(200).json({
                message: message
            });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching employee', error });
    }
};
exports.attendanceUser = attendanceUser;
