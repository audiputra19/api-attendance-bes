import { Request, Response } from "express";
import connection from "../config/db";
import { RowDataPacket } from "mysql2";
import moment from "moment-timezone";
import { Leave, LeaveReport } from "../interfaces/leave";

const year = moment().tz('Asia/Jakarta').year();
const lastYear = moment().tz('Asia/Jakarta').subtract(1, 'year').year();
const date = moment().tz('Asia/Jakarta').format('YYYY-MM-DD');
const firstDateInYear = moment().tz('Asia/Jakarta').set({ 'month': 0, 'date': 1 }).format('YYYY-MM-DD');
const leaveDate = moment().tz('Asia/Jakarta').set({ 'month': 2, 'date': 1 }).format('YYYY-MM-DD');
const lastLeaveDate = moment().tz('Asia/Jakarta').subtract(1, 'year').set({ 'month': 2, 'date': 1 }).format('YYYY-MM-DD');

export const LeaveAttendance = async (req: Request, res: Response) => {
    const { nik } = req.body;

    try {
        const [rowLeave] = await connection.query<RowDataPacket[]>(
            `SELECT SUM(cuti) as cuti
            FROM libur
            WHERE YEAR(tanggal) = ?
            AND cuti = '1'
            ORDER BY tanggal`, [lastYear]
        );

        const leave = rowLeave[0] as Leave;
        const leaveNow = 12 - leave.cuti;

        const [rowCheckLastLeave] = await connection.query<RowDataPacket[]>(
            `SELECT SUM(cuti) as cuti
            FROM absen_harian
            WHERE DATE(tanggal) BETWEEN ? AND ?
            AND nik = ?
            AND cuti = '1'
            ORDER BY tanggal`, [lastLeaveDate, firstDateInYear, nik]
        );

        const checkLastLeave = rowCheckLastLeave[0] as Leave;
        const lastLeaveCuti = checkLastLeave ? checkLastLeave.cuti : 0;

        let lastLeave = leaveNow - lastLeaveCuti;

        if (lastLeave < 0 || date > leaveDate) {
            lastLeave = 0;
        }

        const [rowCheckLeaveNow] = await connection.query<RowDataPacket[]>(
            `SELECT SUM(cuti) as cuti
            FROM absen_harian
            WHERE DATE(tanggal) BETWEEN ? AND ?
            AND nik = ?
            AND cuti = '1'
            ORDER BY tanggal`, [firstDateInYear, date, nik]
        )

        const checkLeaveNow = rowCheckLeaveNow[0] as Leave;
        const leaveNowCuti = checkLeaveNow ? checkLeaveNow.cuti : 0;

        const myLeave = (leaveNow + lastLeave) - leaveNowCuti;

        return res.status(200).json({
            data: {
                massLeave: leave.cuti,
                annualLeave: leaveNow,
                lastLeave: lastLeave,
                myLeave: myLeave,
            }
        });
        
    } catch (error) {
        return res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
}

export const ReportLeave = async (req: Request, res: Response) => {
    const { nik } = req.body;

    try {

        const [rowReportLeave] = await connection.query<RowDataPacket[]>(
            `SELECT tanggal, keterangan 
            FROM absen_harian
            WHERE (YEAR(tanggal) = ? OR YEAR(tanggal) = ?)
            AND nik = ?
            AND cuti = '1'
            ORDER BY tanggal`, [lastYear,year, nik]
        );

        const reportWithSisa = rowReportLeave.map((leaveEntry: any) => {

            return {
                ...leaveEntry
            };
        });  

        return res.status(200).json({ data: reportWithSisa });

    } catch (error) {
        console.error("Error in ReportLeave:", error);
        return res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
}