"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const attendanceRoutes_1 = __importDefault(require("./routes/attendanceRoutes"));
const cors_1 = __importDefault(require("cors"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const forgotPassRoutes_1 = __importDefault(require("./routes/forgotPassRoutes"));
const reportRoutes_1 = __importDefault(require("./routes/reportRoutes"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: 'https://project-absensi.vercel.app',
    // origin: 'http://localhost:3000',
}));
app.use(express_1.default.json());
//end point untuk menjalankan absensi
app.use('/', attendanceRoutes_1.default);
//end point untuk menjalankan authentication
app.use('/auth', authRoutes_1.default);
//end point untuk menjalankan lupa password
app.use('/auth', forgotPassRoutes_1.default);
//end point untuk report
app.use('/report', reportRoutes_1.default);
app.get('/', (req, res) => {
    res.send("welcome");
});
const port = process.env.PORT;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
