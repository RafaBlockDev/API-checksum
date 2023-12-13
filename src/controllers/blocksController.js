"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBlocks = void 0;
const blocksService_1 = require("../services/blocksService");
const getBlocks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const limit1 = req.query.limit1;
        const limit2 = req.query.limit2;
        const parsedLimit1 = typeof limit1 === 'string' ? parseInt(limit1) : 0;
        const parsedLimit2 = typeof limit2 === 'string' ? parseInt(limit2) : 10;
        const blocks = yield (0, blocksService_1.getAllBlocks)(parsedLimit1, parsedLimit2);
        res.json(blocks);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getBlocks = getBlocks;
