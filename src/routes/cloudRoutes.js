const express = require('express');
const router = express.Router();
const { getAverageVmPricing, calculateUserCosts } = require('../services/clouDataService');

router.get('/average-prices', async (req, res) => {
    try {
        const averages = await getAverageVmPricing();
        res.json(averages);
    } catch (error) {
        res.status(500).send('Error calculating average VM prices');
    }
});

// Endpoint to calculate user costs
router.get('/user-rewards', async (req, res) => {
    try {
        const userRewards = await calculateUserCosts();
        res.json(userRewards);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error calculating user costs');
    }
});

module.exports = router;
