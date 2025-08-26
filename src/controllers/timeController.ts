import { Request, Response } from "express";
import connection from "../config/db";
import { RowDataPacket } from "mysql2";
import { Absen } from "../interfaces/attendance";
import moment from "moment";

export const TimeAttendance = async (req: Request, res: Response) => {
    const { nik } = req.body;

    try {
        //console.log("time attendance")
        const date = moment().format('YYYY-MM-DD');

        const [absen] = await connection.query<RowDataPacket[]>(
            `SELECT jam_msk, jam_is_klr, jam_is_msk, jam_klr, tlt, tlt_is, alpa
            FROM absen_harian 
            WHERE nik = ? 
            AND tanggal = ?`, [nik, date]
        );

        const checkAbsen = absen;
        const dtAbsen = checkAbsen[0] as Absen;

        const jamMasuk = dtAbsen.jam_msk;
        const jamIstKeluar = dtAbsen.jam_is_klr;
        const jamIstMasuk = dtAbsen.jam_is_msk;
        const jamKeluar = dtAbsen.jam_klr;
        const telat = dtAbsen.tlt;
        const telatIst = dtAbsen.tlt_is;
        const alpa = dtAbsen.alpa;

        return res.status(200).json({
            data: {
                masuk: jamMasuk,
                istKeluar: jamIstKeluar,
                istMasuk: jamIstMasuk,
                keluar: jamKeluar,
                telat: telat,
                telatIst: telatIst,
                alpa: alpa
            }
        })
    } catch (error) {
        return res.status(500).json({ message: 'Terjadi kesalahan pada server' })
    }
}