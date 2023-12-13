"use strict";
require('dotenv').config();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const blocks_1 = __importDefault(require("./routes/blocks"));
const digitalOceanRoute = require('./routes/cloudRoutes');


const app = (0, express_1.default)();
app.use(cors_1.default());
app.use(express_1.default.json());
const PORT = 3000;
app.get('/ping', (_req, res) => {
    res.send('pong');
});
app.use('/api/blocks', blocks_1.default);
app.use('/cloud', digitalOceanRoute);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

