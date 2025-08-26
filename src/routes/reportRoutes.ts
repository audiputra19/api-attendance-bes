import express from 'express'
import { ReportAttendance, ReportList } from '../controllers/reportController';

const reportRouter = express.Router();

reportRouter.post('/main', ReportAttendance);
reportRouter.post('/list', ReportList);

export default reportRouter;