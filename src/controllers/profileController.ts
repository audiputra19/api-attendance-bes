import { RowDataPacket } from "mysql2";
import connection from "../config/db";
import { Request, Response } from "express";
import { Profile } from "../interfaces/profile";

export const ProfileAttendance = async (req: Request, res: Response) => {
    const { nik } = req.body;
    try {
        const [row] = await connection.query<RowDataPacket[]>(
            `SELECT 
                nik,
                nama,
                alamat,
                telp as nohp,
                tgl_lahir,
                tgl_masuk,
                sta_kerja as st_kerja,
                jab_id as jabatan,
                sta_pendidikan as pendidikan,
                sta_marital as status,
                dept_id as divisi,
                norek as no_rek
            FROM karyawan 
            WHERE nik = ?`, [nik]
        );
        const data = row[0] as Profile;

        const [rowEmail] = await connection.query<RowDataPacket[]>(
            `SELECT email
            FROM user_auth
            WHERE nik = ?`, [nik]
        );
        const email = rowEmail[0].email as string;

        return res.status(200).json({ 
            data: {
                ...data,
                email
            } 
        });
        
    } catch (error) {
        return res.status(500).json({ message: 'Terjadi kesalahan pada server' })
    }
}