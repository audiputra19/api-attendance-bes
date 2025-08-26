import express from 'express'
import { LeaveAttendance, ReportLeave } from '../controllers/leaveController';

const leaveRouter = express.Router();

leaveRouter.post('/leave', LeaveAttendance);
leaveRouter.post('/report-leave', ReportLeave);

export default leaveRouter;