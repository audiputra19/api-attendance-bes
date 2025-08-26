"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenAuthValidation = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const tokenAuthValidation = (req, res, next) => {
    const validationReq = req;
    const { authorization } = validationReq.headers;
    console.log("Authorization Header: ", authorization);
    if (!authorization) {
        return res.status(401).json({
            message: 'Kamu butuh token untuk login'
        });
    }
    const token = authorization.split(' ')[1];
    console.log("Token di server: ", token);
    const secret = process.env.JWT_SECRET;
    try {
        const jwtDecode = jsonwebtoken_1.default.verify(token, secret);
        validationReq.userData = jwtDecode;
    }
    catch (error) {
        console.error("JWT Verification Error: ", error);
        return res.status(401).json({
            message: 'Unauthorized!', error: error
        });
    }
    next();
};
exports.tokenAuthValidation = tokenAuthValidation;
