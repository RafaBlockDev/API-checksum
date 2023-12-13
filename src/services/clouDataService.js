const axios = require('axios');
const { PricingClient, GetProductsCommand } = require("@aws-sdk/client-pricing");
const { MongoClient } = require('mongodb');
require('dotenv').config();
const moment = require('moment');

const uri = process.env.MONGODB_URI;
const client_mongo = new MongoClient(uri);
const client = new PricingClient({ region: "us-east-1" });

async function getAwsVmPrices() {
    const command = new GetProductsCommand({
        ServiceCode: "AmazonEC2",
        Filters: [{ Type: "TERM_MATCH", Field: "productFamily", Value: "Compute Instance" }],
        FormatVersion: "aws_v1",
        MaxResults: 100
    });
    try {
        return await client.send(command);
    } catch (error) {
        console.error("Error fetching AWS VM prices:", error);
        throw error;
    }
}

async function getVmPrices() {
    try {
        const response = await axios.get('https://prices.azure.com/api/retail/prices', {
            params: { '$filter': "serviceName eq 'Virtual Machines' and priceType eq 'Consumption'" }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching Azure VM prices:', error);
        throw error;
    }
}

const getDropletSizes = async () => {
    try {
        const response = await axios.get('https://api.digitalocean.com/v2/sizes', {
            headers: { 'Authorization': `Bearer ${process.env.DIGITAL_OCEAN_TOKEN}` },
            params: { page: 1, per_page: 20 }
        });
        return response.data.sizes;
    } catch (error) {
        console.error('Error fetching Droplet sizes from DigitalOcean:', error);
        throw error;
    }
};

async function getAverageVmPricing() {
    try {
        const [awsData, azureData, digitalOceanData] = await Promise.all([getAwsVmPrices(), getVmPrices(), getDropletSizes()]);

        const awsStats = parseAwsData(awsData);
        const azureStats = parseAzureData(azureData);
        const digitalOceanStats = parseDigitalOceanData(digitalOceanData);
        
        const averagePricePerCore = calculateAverage([...awsStats, ...azureStats, ...digitalOceanStats.map(stat => ({ pricePerCore: stat.pricePerCore }))], 'pricePerCore');
        const averagePricePerRam = calculateAverage([...awsStats, ...azureStats, ...digitalOceanStats.map(stat => ({ pricePerRam: stat.pricePerRam }))], 'pricePerRam');
        const averagePricePerStorage = calculateAverage([...digitalOceanStats], 'pricePerStorage');

        return { averagePricePerCore, averagePricePerRam, averagePricePerStorage };
    } catch (error) {
        console.error('Error fetching VM pricing:', error);
        throw error;
    }
}

function calculateAverage(data, key) {
    const filteredData = data.filter(item => item && !isNaN(item[key]) && item[key] !== 0);
    const total = filteredData.reduce((sum, item) => sum + item[key], 0);
    return total / filteredData.length;
}

function parseAwsData(data) {
    return data.PriceList.map(priceInfo => {
        const priceData = JSON.parse(priceInfo);
        if (!priceData.product || !priceData.terms || !priceData.terms.OnDemand) {
            return null; // Skip if essential data is missing
        }

        const productDetails = priceData.product;
        const terms = priceData.terms.OnDemand;
        const sku = Object.keys(terms)[0];
        const pricingDetails = terms[sku] ? terms[sku].priceDimensions : null;

        if (!pricingDetails || !productDetails.attributes) {
            return null; // Skip if pricing details or product attributes are missing
        }

        const memoryInGB = parseFloat(productDetails.attributes.memory.split(" ")[0]);
        const vcpus = parseInt(productDetails.attributes.vcpu, 10);
        const pricePerHour = parseFloat(Object.values(pricingDetails)[0].pricePerUnit.USD);

        if (!vcpus || !memoryInGB || isNaN(pricePerHour)) {
            return null; // Skip entries with invalid values
        }

        return {
            pricePerCore: ( pricePerHour / vcpus ) * 24,
            pricePerRam: ( pricePerHour / memoryInGB ) *24
        };
    }).filter(Boolean); // Filter out null entries
}


function parseAzureData(data) {
    // Implement getVmDetails to map armSkuName to cores, RAM, and storage
    const vmDetails = getVmDetails();
    return data.Items.map(item => {
        const details = vmDetails[item.armSkuName];
        if (!details) return null;
        return { pricePerCore: ( item.unitPrice / details.cores) * 24 , pricePerRam: ( item.unitPrice / details.ram ) * 24 };
    }).filter(Boolean);
}

function parseDigitalOceanData(data) {
    return data.map(droplet => {
        const memoryInGB = droplet.memory / 1024; // Convert memory from MB to GB
        const vcpus = droplet.vcpus;
        const pricePerMonth = droplet.price_monthly;
        const dailyRate = pricePerMonth / 30; // Convert monthly rate to daily rate

        return {
            pricePerCore: dailyRate / vcpus,
            pricePerRam: dailyRate / memoryInGB,
            pricePerStorage: dailyRate / droplet.disk
        };
    }).filter(Boolean); // Filter out invalid entries
}
    
function getVmDetails() {
    // Map armSkuName to cores, RAM, and storage
    return {
        'Standard_D14': { cores: 4, ram: 16, storage: 100 },
        // Add other VM types
    };
}
async function calculateUserCosts() {
    const { averagePricePerCore, averagePricePerRam, averagePricePerStorage } = await getAverageVmPricing();
    
    try {
        const database = client_mongo.db('Splendor-blockchain-wallets');
        const usersCollection = database.collection('users');
        const rewardsCollection = database.collection('userRewards');
        const currentDate = moment().format("YYYY-MM-DD");

        const users = await usersCollection.find({}).toArray();

        const updatePromises = users.map(async (user) => {
            const cpuCores = user.data?.nodeResources?.savedCpuCores || 0;
            const ram = user.data?.nodeResources?.savedRam || 0;
            const storage = user.data?.nodeResources?.savedDiskSpace || 0;

            const rewardData = {
                date: currentDate,
                address: user.address,
                cpuReward: cpuCores * averagePricePerCore * 2,
                ramReward: ram * averagePricePerRam * 2,
                storageReward: storage * averagePricePerStorage * 2
            };

            // Update the userRewards collection, upserting the record
            await rewardsCollection.updateOne(
                { address: user.address, date: currentDate }, 
                { $set: rewardData },
                { upsert: true }
            );

            return rewardData;
        });

        return Promise.all(updatePromises);
    } catch (error) {
        console.error("Error in calculateUserCosts:", error);
        throw error;
    }
}

/* function to query if the data is corrected stored in mongoDB
async function queryUserRewards(address = null, date = null) {
    try {
        const database = client_mongo.db('Splendor-blockchain-wallets');
        const rewardsCollection = database.collection('userRewards');

        let query = {};
        if (address) {
            query.address = address;
        }
        if (date) {
            query.date = date;
        }

        const rewards = await rewardsCollection.find(query).toArray();
        return rewards;
    } catch (error) {
        console.error("Error in queryUserRewards:", error);
        throw error;
    }
}
*/

module.exports = { getAverageVmPricing, calculateAverage, calculateUserCosts };