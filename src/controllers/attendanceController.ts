import { Request, Response } from "express";
import connection from '../config/db'
import { RowDataPacket } from "mysql2";
import { Absen, DataReqAttendance, Employees, HariKerja, Lembur, Libur, Puasa } from "../interfaces/attendance";
import moment from 'moment-timezone';

export const attendanceUser = async (req: Request, res: Response) => {
    const dataReqAttendance = req.body.dataReqAttendance as DataReqAttendance;

    try {
        // console.log(dataReqAttendance)
        
        const year = moment().tz('Asia/Jakarta').year();
        const date = moment().tz('Asia/Jakarta').format('YYYY-MM-DD');
        const time = moment().tz('Asia/Jakarta').format('HH:mm:ss');
        const employee = dataReqAttendance.employee;
        const nik = employee.nik;
        let message = '';

        const [puasa] = await connection.query<RowDataPacket[]>(
            `SELECT tanggal, tanggal_2 FROM jadwal_puasa WHERE tahun = ?`, [year]
        );
        const dtPuasa = puasa[0] as Puasa;

        let jamKerja = date >= dtPuasa.tanggal && date <= dtPuasa.tanggal_2 
        ? 'jam_kerja_puasa' 
        : 'jam_kerja';
        
        const [qryHariKerja] = await connection.query<RowDataPacket[]>(
            `SELECT jam_msk, ist_klr, ist_msk, jam_klr 
            FROM ${jamKerja}
            WHERE hr_krj = ?`, [dataReqAttendance.hariKerja]
        );
        
        const dtHariKerja = qryHariKerja[0] as HariKerja;
        
        const masuk = moment(dtHariKerja.jam_msk, 'HH:mm:ss').add(1, 'minutes').format('HH:mm:ss');
        const istKeluar = dtHariKerja.ist_klr;
        const istMasuk = dtHariKerja.ist_msk;
        const keluar = dtHariKerja.jam_klr;
        const batasAbsen = moment(masuk, 'HH:mm:ss').subtract(1, 'hours').format('HH:mm:ss');
        const batasToleransi = moment(masuk, 'HH:mm:ss').add(30, 'minutes').format('HH:mm:ss');
        const batasMasuk = moment(masuk, 'HH:mm:ss').add(1, 'hours').format('HH:mm:ss');
        const batasIstMasuk = moment(istKeluar, 'HH:mm:ss').add(30, 'minutes').format('HH:mm:ss');
        const batasKeluar = moment(keluar, 'HH:mm:ss').add(1, 'hours').format('HH:mm:ss');
        //console.log(istMasuk)
        
        const [absen] = await connection.query<RowDataPacket[]>(
            `SELECT jam_msk, jam_is_klr, jam_is_msk, jam_klr, tlt, tlt_is, alpa
			FROM absen_harian 
            WHERE nik = ? 
            AND tanggal = ?`, [nik, date]
        );

        const checkAbsen = absen;
        const dtAbsen = checkAbsen[0] as Absen;
        
        if(checkAbsen.length === 0){
            if(time < batasAbsen){
                message = 'Belum waktunya mengabsen';
            } else if(time >= batasAbsen && time <= masuk){
                await connection.query<RowDataPacket[]>(
                    `INSERT INTO absen_harian
                    (tanggal, nik, jam_msk, jam_is_klr, jam_is_msk, jam_klr, 
                    tlt_is, tlt, hadir, ijin, sakit, 
                    cuti, alpa, dinas, adjust, lembur, 
                    shift, half_day, libnas, surat_dr)
                    VALUES 
                    (?, ?, ?, null,null,null,
                    '0','0','1','0','0',
                    '0','0','0','0','0',
                    '0','0','0','0')`, [date, nik, time]
                );
                message = 'Selamat bekerja';
            } else if(time > masuk && time <= batasMasuk){
                await connection.query<RowDataPacket[]>(
                    `INSERT INTO absen_harian 
                    (tanggal, nik, jam_msk, jam_is_klr, jam_is_msk, jam_klr, 
                    tlt_is, tlt, hadir, ijin, sakit, 
                    cuti, alpa, dinas, adjust, lembur, 
                    shift, half_day, libnas, surat_dr)
                    VALUES 
                    (?, ?, ?, null,null,null,
                    '0','1','1','0','0',
                    '0','0','0','0','0',
                    '0','0','0','0')`, [date, nik, time]
                );
                if(time < batasToleransi){
                    const lateMinutes = moment(time, 'HH:mm:ss').diff(moment(masuk, 'HH:mm:ss'), 'minutes');
                    message = `Anda terlambat ${lateMinutes} menit`;
                } else {
                    message = 'Silahkan hubungi bagian HRD'
                }
            } else if(time > batasMasuk){
                await connection.query<RowDataPacket[]>(
                    `INSERT INTO absen_harian 
                    (tanggal, nik, jam_msk, jam_is_klr, jam_is_msk, jam_klr, 
                        tlt_is, tlt, hadir, ijin, sakit, 
                        cuti, alpa, dinas, adjust, lembur, 
                        shift, half_day, libnas, surat_dr)
                    VALUES 
                    (?, ?, ?, null,null,null,
                    '0','1','1','0','0',
                    '0','0','0','0','0',
                    '0','0','0','0')`, [date, nik, time]
                );
                message = 'Silahkan hubungi bagian HRD'
            }
           
            res.status(200).json({
                message: message
            });

        } else {
            const jamMasuk = dtAbsen.jam_msk;
            const jamIstKeluar = dtAbsen.jam_is_klr;
            const jamIstMasuk = dtAbsen.jam_is_msk;
            const jamKeluar = dtAbsen.jam_klr;
            const telat = dtAbsen.tlt;
            const telatIst = dtAbsen.tlt_is;
            const alpa = dtAbsen.alpa;
            console.log(batasIstMasuk);

            if(time < istKeluar){
                message = 'Belum waktunya istirahat';
            } else if(time >= istKeluar && time <= batasIstMasuk){
                if(keluar === '16:10:00' || keluar === '16:05:00'){ //absen bulan puasa
                    if(jamIstKeluar === '00:00:00'){
                        await connection.query<RowDataPacket[]>(
                            `UPDATE absen_harian 
                            SET jam_is_klr = ? 
							WHERE nik = ? AND tanggal = ?`, [time, nik, date]
                        );
                        message = 'Gunakan waktu istirahat anda';
                    } else if(jamIstMasuk === '00:00:00'){
                        await connection.query<RowDataPacket[]>(
                            `UPDATE absen_harian 
                            SET jam_is_msk = ? 
							WHERE nik = ? AND tanggal = ?`, [time, nik, date]
                        );
                        message = 'Selamat bekerja kembali'; 
                    } else {
                        message = 'Belum waktunya pulang'; 
                    }
                } else { //absen normal
                    if(jamIstKeluar === '00:00:00'){
                        await connection.query<RowDataPacket[]>(
                            `UPDATE absen_harian 
                            SET jam_is_klr = ? 
							WHERE nik = ? AND tanggal = ?`, [time, nik, date]
                        );
                        message = 'Selamat istirahat'; 
                    } else {
                        message = 'Belum waktunya masuk lagi'; 
                    }
                }
            } else if(time > batasIstMasuk && time <= istMasuk){
                if(jamIstKeluar === '00:00:00'){
                    await connection.query<RowDataPacket[]>(
                        `UPDATE absen_harian 
                        SET jam_is_klr = ? 
                        WHERE nik = ? AND tanggal = ?`, [time, nik, date]
                    );
                    message = 'Gunakan waktu istirahat anda';
                } else if(jamIstMasuk === '00:00:00'){
                    await connection.query<RowDataPacket[]>(
                        `UPDATE absen_harian 
                        SET jam_is_msk = ? 
                        WHERE nik = ? AND tanggal = ?`, [time, nik, date]
                    );
                    message = 'Selamat bekerja kembali';
                } else {
                    message = 'Belum waktunya pulang';
                }
            } else if(time > batasMasuk && time < keluar){
                if(jamIstKeluar === '00:00:00'){
                    await connection.query<RowDataPacket[]>(
                        `UPDATE absen_harian 
                        SET jam_is_klr = ?, tlt_is='1' 
                        WHERE nik = ? AND tanggal = ?`, [time, nik, date]
                    );
                    message = 'Terlambat menggunakan waktu istirahat';
                } else if(jamIstMasuk === '00:00:00'){
                    await connection.query<RowDataPacket[]>(
                        `UPDATE absen_harian 
                        SET jam_is_msk = ?, tlt_is='1' 
                        WHERE nik = ? AND tanggal = ?`, [time, nik, date]
                    );
                    message = 'Anda terlambat masuk istirahat';
                } else {
                    message = 'Belum waktunya pulang';
                }
            } else if(time >= keluar && time <= batasKeluar){
                //cek lembur
                const [lembur] = await connection.query<RowDataPacket[]>(
                    `SELECT
                    lembur.no_spl,
                    lembur.real_in,
                    lembur.real_ov
                    FROM
                    lembur
                    WHERE 
                    lembur.tanggal = ? 
                    AND lembur.nik = ?`, [date, nik]
                );
                const checkLembur = lembur;
                if(checkLembur.length > 0){
                    await connection.query<RowDataPacket[]>(
                        `UPDATE absen_harian 
                        SET jam_klr = ? 
                        WHERE nik = ? AND tanggal = ?`, [time, nik, date]
                    );
                    message = 'Ada jadwal lembur untuk anda';
                } else {
                    if(jamKeluar === '00:00:00'){
                        await connection.query<RowDataPacket[]>(
                            `UPDATE absen_harian 
                            SET jam_klr = ? 
                            WHERE nik = ? AND tanggal = ?`, [time, nik, date]
                        );
                        message = 'Terima kasih selamat istirahat';
                    } else {
                        message = 'Anda sudah mengabsen pulang';
                    }
                }
            } else if(time > batasKeluar){
                const [lembur] = await connection.query<RowDataPacket[]>(
                    `SELECT
                    lembur.no_spl
                    FROM
                    lembur
                    WHERE 
                    lembur.tanggal = ? 
                    AND lembur.nik = ?`, [date, nik]
                );
                const checkLembur = lembur;
                if(checkLembur.length > 0){
                    const dtLembur = checkLembur[0];
                    const spl = dtLembur.no_spl;

                    const dateTime1 = moment(`${date} ${keluar}`, 'YYYY-MM-DD HH:mm:ss');
                    const dateTime2 = moment(`${date} ${time}`, 'YYYY-MM-DD HH:mm:ss');
                    const interval = moment.duration(dateTime2.diff(dateTime1)).asMinutes();
                    const realOv = Math.round(interval / 60);

                    await connection.query<RowDataPacket[]>(
                        `UPDATE absen_harian 
                        SET jam_klr = ? 
                        WHERE nik = ? AND tanggal = ?`, [time, nik, date]
                    );

                    await connection.query<RowDataPacket[]>(
                        `UPDATE lembur 
                        SET real_in = ?, real_out = ?, real_ov = ? 
                        WHERE no_spl = ?`, [keluar, time, realOv, spl]
                    );

                    message = 'Terima kasih atas lemburnya';
                } else {
                    if(jamKeluar === '00:00:00'){
                        await connection.query<RowDataPacket[]>(
                            `UPDATE absen_harian 
                            SET jam_klr = ? 
                            WHERE nik = ? AND tanggal = ?`, [time, nik, date]
                        );

                        const kodeBln = moment(date, 'MM');
                        const kodeThn = moment(date, 'YY');

                        const [lembur] = await connection.query<RowDataPacket[]>(
                            `SELECT no_spl 
                            FROM lembur
                            WHERE MONTH(tanggal) = ? 
                            AND YEAR(tanggal) = ? 
                            ORDER BY no_spl DESC LIMIT 1`, [kodeBln, year]
                        );
                        const result = lembur;
                        let str_nomor;

                        if (result.length === 1) {
                            const split_str = result[0].no_spl.split("/");
                            str_nomor = parseInt(split_str[0], 10) + 1;
                        } else {
                            str_nomor = 1;
                        }

                        str_nomor = str_nomor.toString().padStart(3, '0');

                        const dateTime1 = moment(`${date} ${keluar}`, 'YYYY-MM-DD HH:mm:ss');
                        const dateTime2 = moment(`${date} ${time}`, 'YYYY-MM-DD HH:mm:ss');
                        const interval = moment.duration(dateTime2.diff(dateTime1)).asMinutes();
                        const ov = Math.round(interval);
                        const job = 'Absen lebih dari 1 jam dari jam pulang';
                        const nomor = `${str_nomor}/SKN-SPL/${kodeBln}/${kodeThn}`;

                        await connection.query<RowDataPacket[]>(
                            `INSERT INTO lembur 
                            (no_spl,tanggal,nik,jam_in,jam_out,overtime,uraian,real_in,real_out,real_ov)
                            VALUES
                            (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [nomor, date, nik, keluar, time, ov, job, keluar, time, ov]
                        );
                        message = 'Apakah anda lembur?';
                    } else {
                        message = 'Anda sudah mengabsen pulang';
                    }
                }
            }

            res.status(200).json({
                message: message
            });
        }

    } catch (error) {
        res.status(500).json({ message: 'Error fetching employee', error });
    }
}