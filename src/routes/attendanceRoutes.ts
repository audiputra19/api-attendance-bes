import express from 'express';
import nikValidation from '../utils/nikValidation';
import { distanceValidation } from '../utils/distanceValidation';
import { attendanceUser } from '../controllers/attendanceController';
import { lemburValidation } from '../utils/lemburValidation';
import { TimeAttendance } from '../controllers/timeController';

const attendanceRoutes = express.Router();

attendanceRoutes.post('/attendance', distanceValidation, nikValidation, lemburValidation, attendanceUser);
attendanceRoutes.post('/time-attendance', TimeAttendance);

export default attendanceRoutes