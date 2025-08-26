"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const nikValidation_1 = __importDefault(require("../utils/nikValidation"));
const distanceValidation_1 = require("../utils/distanceValidation");
const attendanceController_1 = require("../controllers/attendanceController");
const lemburValidation_1 = require("../utils/lemburValidation");
const timeController_1 = require("../controllers/timeController");
const attendanceRoutes = express_1.default.Router();
attendanceRoutes.post('/attendance', distanceValidation_1.distanceValidation, nikValidation_1.default, lemburValidation_1.lemburValidation, attendanceController_1.attendanceUser);
attendanceRoutes.post('/time-attendance', timeController_1.TimeAttendance);
exports.default = attendanceRoutes;
