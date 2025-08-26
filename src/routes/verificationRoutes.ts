import { Router } from "express";
import { verficationRegistration } from "../controllers/verificationController";

const verficationRouter = Router();

verficationRouter.post('/verification', verficationRegistration);

export default verficationRouter;