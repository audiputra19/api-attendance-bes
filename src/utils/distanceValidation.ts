import { error } from "console";
import { NextFunction, Request, Response } from "express";

const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
) => {
    const R = 6371e3; // Radius bumi dalam meter
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Jarak dalam meter
}

export const distanceValidation = async (req: Request, res: Response, next: NextFunction) => {
    const {latitude, longitude} = req.body;
    const officeLocation = { latitude: -6.915196237927959, longitude: 106.8742431897525 };

    try {
        if(!latitude || !longitude){
            return res.status(400).json({ message: 'Koordinat salah!' })
        }

        const distance = calculateDistance(
            officeLocation.latitude,
            officeLocation.longitude,
            latitude,
            longitude
        )
        
        const sayDistance = Math.round(distance);

        if(distance > 30){
            return res.status(400).json({ message: `Jarak anda ${sayDistance} meter` })
        } 

        next();
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
}