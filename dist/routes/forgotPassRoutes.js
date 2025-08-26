"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const forgotPassController_1 = require("../controllers/forgotPassController");
const forgotPassRouter = express_1.default.Router();
forgotPassRouter.post('/forgot-pass', forgotPassController_1.forgotPass);
forgotPassRouter.post('/reset-pass', forgotPassController_1.resetPass);
exports.default = forgotPassRouter;
