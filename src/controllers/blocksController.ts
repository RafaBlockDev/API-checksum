import { Request, Response } from 'express';
import { getAllBlocks } from '../services/blocksService';

export const getBlocks = async (req: Request, res: Response) => {
    try {
        const limit1 = req.query.limit1;
        const limit2 = req.query.limit2;

        const parsedLimit1 = typeof limit1 === 'string' ? parseInt(limit1) : 0;
        const parsedLimit2 = typeof limit2 === 'string' ? parseInt(limit2) : 10;

        const blocks = await getAllBlocks(parsedLimit1, parsedLimit2);

        res.json(blocks);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
