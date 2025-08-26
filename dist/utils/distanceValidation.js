"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.distanceValidation = void 0;
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Radius bumi dalam meter
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Jarak dalam meter
};
const distanceValidation = async (req, res, next) => {
    const { latitude, longitude } = req.body;
    const officeLocation = { latitude: -6.915196237927959, longitude: 106.8742431897525 };
    try {
        if (!latitude || !longitude) {
            return res.status(400).json({ message: 'Koordinat salah!' });
        }
        const distance = calculateDistance(officeLocation.latitude, officeLocation.longitude, latitude, longitude);
        console.log(distance);
        if (distance <= 30) {
            next();
        }
        else {
            // return res.status(400).json({ message: 'Jarak anda lebih dari 30 meter' })
            return res.status(400).json({ message: `Jarak anda ${distance}` });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
};
exports.distanceValidation = distanceValidation;
