const { getLatestBlocksInfo, getAllTransactions, verifyTransaction, getTransactionDetails } = require('../services/polkadotApi');

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const blocksController_1 = require("../controllers/blocksController");
const router = express_1.default.Router();
router.get('/', blocksController_1.getBlocks);


// Route to get the latest blocks information
router.get('/latest-blocks', async (req, res) => {
    try {
        // You can also use query params to customize the number of blocks, e.g., req.query.numBlocks
        const blocksInfo = await getLatestBlocksInfo(5); // or req.query.numBlocks
        res.json(blocksInfo);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/latest-transactions/:address', async (req, res) => {
    try {
        const userAddress = req.params.address;
        const transactions = await getAllTransactions(userAddress);
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


router.post('/verify-transaction', async (req, res) => {
    const { transactionHash, senderAddress, receiverAddress } = req.body;

    // Input validation (simple example, you should enhance this)
    if (!transactionHash || !senderAddress || !receiverAddress) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const result = await verifyTransaction(transactionHash, senderAddress, receiverAddress);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/transaction-details/:transactionHash/:senderAddress', async (req, res) => {
    try {
        const { senderAddress, transactionHash } = req.params;
        const details = await getTransactionDetails(senderAddress, transactionHash);
        
        if (details) {
            res.json(details);
        } else {
            res.status(404).json({ message: 'Transaction not found or does not match sender address' });
        }
    } catch (error) {
        console.error('Error fetching transaction details:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;