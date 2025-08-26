import { Request, Response } from "express";
import connection from "../config/db";
import { RowDataPacket } from "mysql2";
import { Report } from "../interfaces/report";
import moment from "moment-timezone";

export const ReportAttendance = async (req: Request, res: Response) => {
    const {startDate, endDate, nik} = req.body;
    const start = moment(startDate).tz('Asia/Jakarta').format('YYYY-MM-DD');
    const end = moment(endDate).tz('Asia/Jakarta').format('YYYY-MM-DD');
    //console.log(`${start}, ${end}, ${nik}`);
    
    try {
        const [data] = await connection.query<RowDataPacket[]>(
            `SELECT SUM(hadir) as hadir, SUM(alpa) as alpa, SUM(tlt) as telat, SUM(sakit) as sakit, SUM(ijin) as izin, SUM(cuti) as cuti
            FROM absen_harian 
            WHERE DATE(tanggal) BETWEEN ? AND ? 
            AND nik = ? 
            ORDER BY tanggal DESC`, [start, end, nik]
        );

        const report = data[0] as Report;

        return res.status(200).json({
            data: {
                hadir: report.hadir,
                alpa: report.alpa,
                telat: report.telat,
                sakit: report.sakit,
                izin: report.izin,
                cuti: report.cuti
            }
        })
        
    } catch (error) {
        return res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
}

export const ReportList = async (req: Request, res: Response) => {
    const {startDate, endDate, nik} = req.body;
    const start = moment(startDate).tz('Asia/Jakarta').format('YYYY-MM-DD');
    const end = moment(endDate).tz('Asia/Jakarta').format('YYYY-MM-DD');
    console.log(`${start}, ${end}, ${nik}`)

    try {
        
        const [rowReportList] = await connection.query<RowDataPacket[]>(
            `SELECT tanggal, hadir, alpa, tlt as telat, sakit, ijin as izin, cuti, keterangan
            FROM absen_harian 
            WHERE DATE(tanggal) BETWEEN ? AND ? 
            AND nik = ? 
            ORDER BY tanggal`, [start, end, nik]
        );

        const reportList = rowReportList.map((reportEntry: any) => {
            return {
                ...reportEntry
            }
        });

        return res.status(200).json(reportList);

    } catch (error) {
        return res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
}