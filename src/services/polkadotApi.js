require('dotenv').config();
const { ApiPromise, WsProvider } = require('@polkadot/api');

console.warn = function () {};

let api;

async function createApi() {
    if (!api || !api.isConnected) {
        const wsProvider = new WsProvider(process.env.SAS_SUBSTRATE_URL);
        api = await ApiPromise.create({ provider: wsProvider });
    }
    return api;
}


async function getLatestBlocksInfo(numberOfBlocks = 5) {
    await createApi();
    const latestBlockNumber = (await api.rpc.chain.getHeader()).number.toNumber();

    let blocksInfo = [];
    for (let i = 0; i < numberOfBlocks; i++) {
        const blockNumber = latestBlockNumber - i;
        const blockHash = await api.rpc.chain.getBlockHash(blockNumber);
        const blockHeader = await api.rpc.chain.getHeader(blockHash);

        const blockInfo = {
            block: blockNumber,
            timestamp: (await api.query.timestamp.now.at(blockHash)).toNumber(),
            header: blockHeader.hash.toString(),
            size: blockHeader.encodedLength
        };

        blocksInfo.push(blockInfo);
    }
    return blocksInfo;
}

async function fetchBlockHeaders() {
    await createApi();
    const latestBlockNumber = (await api.rpc.chain.getHeader()).number.toNumber();
    const numberOfBlocks = process.env.NUMBER_BLOCK_HEADER ? parseInt(process.env.NUMBER_BLOCK_HEADER, 10) : 100;

    let blockHeaders = [];
    for (let i = 0; i < numberOfBlocks; i++) {
        const blockNumber = latestBlockNumber - i;
        if (blockNumber < 0) {
            break;
        }
        const blockHash = await api.rpc.chain.getBlockHash(blockNumber);
        const blockHeader = await api.rpc.chain.getHeader(blockHash);
        blockHeaders.push(blockHeader);
    }
    return blockHeaders;
}

async function getAllTransactions(userAddress) {
    await createApi();
    const latestBlockNumber = (await api.rpc.chain.getHeader()).number.toNumber();

    let allTransactions = [];

    for (let i = latestBlockNumber; i >= 0; i--) {
        const blockHash = await api.rpc.chain.getBlockHash(i);
        const signedBlock = await api.rpc.chain.getBlock(blockHash);
        const blockTime = (await api.query.timestamp.now.at(blockHash)).toNumber();
        const currentTime = Date.now();

        for (const extrinsic of signedBlock.block.extrinsics) {
            if (extrinsic.isSigned && extrinsic.signer.toString() === userAddress) {
                const transactionHash = extrinsic.hash.toHex();
                let toAddress = '';

                // Extract toAddress based on method and section
                // Add more conditions if needed for different extrinsic types
                if (extrinsic.method.section === 'balances' && extrinsic.method.method === 'transfer') {
                    toAddress = extrinsic.method.args[0].toString();
                }

                allTransactions.push({
                    TransactionHash: transactionHash,
                    Timestamp: new Date(blockTime).toISOString(),
                    BlockNumber: i,
                    From: userAddress,
                    To: toAddress
                });
            }
        }

        // Optimization: break the loop if the number of transactions is sufficient
        if (allTransactions.length >= 10) { // Example: limit to the last 10 transactions
            break;
        }
    }

    return allTransactions;
}



async function verifyTransaction(transactionHash, senderAddress, receiverAddress) {
    await createApi();
    try {
        const transactionDetails = await findTransaction(transactionHash);
        if (transactionDetails) {
            const { extrinsic, blockNumber, timestamp } = transactionDetails;
            const { method: { args, method, section }, signer } = extrinsic;

            if (section === 'balances' && ['transfer', 'transferKeepAlive', 'transferAllowDeath'].includes(method)) {
                const actualSender = signer.toString();
                const actualReceiver = args[0].toString();

                if (actualSender === senderAddress && actualReceiver === receiverAddress) {
                    return { valid: true, timestamp, blockNumber };
                }
            }
        }

        return { valid: false };
    } catch (error) {
        console.error('Error verifying transaction:', error);
        return { valid: false, error: error.message };
    }
}

async function findTransaction(transactionHash, startBlock = null) {
    await createApi();

    const latestBlockNumber = (await api.rpc.chain.getHeader()).number.toNumber();
    const startBlockNumber = startBlock ? startBlock : latestBlockNumber;

    for (let i = startBlockNumber; i >= 0; i--) {
        const blockHash = await api.rpc.chain.getBlockHash(i);
        const signedBlock = await api.rpc.chain.getBlock(blockHash);

        for (const extrinsic of signedBlock.block.extrinsics) {
            if (extrinsic.hash.toHex() === transactionHash) {
                return {
                    blockNumber: i,
                    extrinsic: extrinsic,
                    timestamp: (await api.query.timestamp.now.at(blockHash)).toNumber()
                };
            }
        }
    }

    return null; // Transaction not found
}

async function getTransactionDetails(senderAddress, transactionHash) {
    await createApi();
    const latestBlockNumber = (await api.rpc.chain.getHeader()).number.toNumber();

    for (let i = latestBlockNumber; i >= 0; i--) {
        const blockHash = await api.rpc.chain.getBlockHash(i);
        const signedBlock = await api.rpc.chain.getBlock(blockHash);

        for (const extrinsic of signedBlock.block.extrinsics) {
            if (extrinsic.isSigned && extrinsic.hash.toHex() === transactionHash && extrinsic.signer.toString() === senderAddress) {
                let receiverAddress = '';

                if (extrinsic.method.section === 'balances' && extrinsic.method.method === 'transfer') {
                    receiverAddress = extrinsic.method.args[0].toString();
                }

                return {
                    ReceiverAddress: receiverAddress,
                    TransactionHash: transactionHash,
                    BlockNumber: i,
                    Time: new Date((await api.query.timestamp.now.at(blockHash)).toNumber()).toISOString()
                };
            }
        }
    }

    return null; // Transaction not found or doesn't match sender address
}

module.exports = {
    getLatestBlocksInfo,
    getAllTransactions,
    verifyTransaction,
    getTransactionDetails
};


