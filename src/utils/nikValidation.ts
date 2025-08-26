import { NextFunction, Request, Response } from "express";
import connection from "../config/db";
import { RowDataPacket } from "mysql2";

const nikValidation = async (req: Request, res: Response, next: NextFunction) => {
    //console.log('Body Request:', req.body);

    const { nik } = req.body;

    if (!nik) {
        return res.status(400).json({ message: 'Parameter nik harus disertakan dalam body permintaan.' });
    }

    try {
        const [data] = await connection.query<RowDataPacket[]>('SELECT nik, nama as nama FROM karyawan WHERE nik = ?', [nik]);

        if(data.length === 0){
            return res.status(404).json({ message: 'ID tidak dikenal!' })
        }
        
        req.body.employee = data[0];
        next();
    } catch (error) {
        console.error('Kesalahan SQL:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
}

export default nikValidation;