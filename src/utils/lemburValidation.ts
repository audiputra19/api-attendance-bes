import { NextFunction, Request, Response } from "express";
import connection from '../config/db'
import { RowDataPacket } from "mysql2";
import { Employees, Lembur, Libur } from "../interfaces/attendance";
import moment from 'moment'

export const lemburValidation = async (req: Request, res: Response, next: NextFunction) => {
    const employee = req.body.employee as Employees;

    try {
        const day = moment().day();
        const date = moment().tz('Asia/Jakarta').format('YYYY-MM-DD');
        const time = moment().tz('Asia/Jakarta').format('HH:mm:ss');
        const nik = employee.nik

        const [libur] = await connection.query<RowDataPacket[]>(
            `SELECT keterangan, halfd FROM libur WHERE tanggal = ?`, [date]
        );
        const checkLibur = libur;
        const dtLibur = checkLibur[0] as Libur;

        let hariKerja = '' as string | number;

        if(day === 5){
            hariKerja = 'Jumat';
        } else if(day === 7 || day === 6 || checkLibur.length > 0){
            hariKerja = 0;
            const [lembur] = await connection.query<RowDataPacket[]>(
                `SELECT lembur.no_spl, lembur.real_in, lembur.real_ov
                FROM lembur
                WHERE lembur.tanggal = ? AND lembur.nik = ?`, [date, nik]
            )
            const checkLembur = lembur;
            const dtLembur = checkLembur[0] as Lembur;

            if(checkLembur.length > 0){
                const noSpl = dtLembur.no_spl;
                const realIn = dtLembur.real_in;

                if(realIn === 0){
                    await connection.query<RowDataPacket[]>(
                        `UPDATE lembur SET real_in = ? WHERE no_spl = ?`, [time, noSpl]
                    );
                    res.status(200).json({ message: 'Selamat bekerja lembur' })
                } else {
                    const dateTime1 = moment(`${date} ${realIn}`, 'YYYY-MM-DD HH:mm:ss');
                    const dateTime2 = moment(`${date} ${time}`, 'YYYY-MM-DD HH:mm:ss');
                    const interval = moment.duration(dateTime2.diff(dateTime1)).asMinutes();
                    let realOv = Math.round(interval);

                    if(realOv < 60){
                        res.status(200).json({ message: 'Lembur anda dibawah 1 jam' })
                    } else {
                        if(day === 6){
                            realOv = realOv;
                        } else if (day === 7 || checkLibur.length > 0){
                            if(realOv >= 300){
                                realOv -= 60;
                            } else {
                                realOv = realOv;
                            }
                        } else {
                            if(realOv >= 180){
                                realOv -= 60;
                            } else {
                                realOv = realOv;
                            }
                        }
                    }

                    await connection.query<RowDataPacket[]>(
                        `UPDATE lembur SET real_out = ?, real_ov = ? WHERE no_spl = ?`, [time, realOv, noSpl]
                    );
                    res.status(200).json({ message: 'Terima kasih telah lembur, Jaga kesehatan' });
                }
            } else {
                if(checkLibur.length > 0){
                    res.status(200).json({ message: `Ini hari libur, memperingati ${dtLibur.keterangan}` });
                } else {
                    res.status(200).json({ message: 'ini hari libur weekend' }); 
                }
            }
        } else {
            hariKerja = 'Normal';
        }

        const attendaceData = {
            employee: employee,
            hariKerja: hariKerja
        }
        
        console.log(hariKerja)

        req.body.dataReqAttendance = attendaceData;
        next();
    } catch (error) {
        res.status(500).json({ message: 'Error fetching employee', error });
    }
}