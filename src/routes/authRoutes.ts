import express from 'express'
import { loginUser, registerUser } from '../controllers/authController';
import { verficationRegistration } from '../controllers/verificationController';

const authRouter = express.Router();

authRouter.post('/register', registerUser, verficationRegistration);
authRouter.post('/login', loginUser);

export default authRouter;