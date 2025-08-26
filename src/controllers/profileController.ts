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
                st_kerja.status_kerja as st_kerja,
                jabatan.jabatan,
                st_pendidikan.pendidikan,
                sta_marital as status,
                departemen.Departemen as divisi,
                norek as no_rek
            FROM karyawan 
            INNER JOIN departemen ON departemen.dept_id = karyawan.dept_id
            INNER JOIN st_kerja ON st_kerja.id_staker = karyawan.sta_kerja
            INNER JOIN jabatan ON jabatan.jab_id = karyawan.jab_id
            INNER JOIN st_pendidikan ON st_pendidikan.pendidikan_id = karyawan.sta_pendidikan
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