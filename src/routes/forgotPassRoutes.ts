import express from 'express'
import { forgotPass, resetPass } from '../controllers/forgotPassController';

const forgotPassRouter = express.Router();

forgotPassRouter.post('/forgot-pass', forgotPass);
forgotPassRouter.post('/reset-pass', resetPass);

export default forgotPassRouter;