const TokenMonitor = require('./tokenMonitor');
require('dotenv').config()


const httpEndpoint = process.env.HTTP_ENDPOINT;
const wsEndpoint = process.env.WS_ENDPOINT;
const lepeTokenAddress = '9B31sgN9D1j1n53rkWF523Nkp4oBaktonUX7rUuyDRaP';
const originalSupplyAmount = 100000000;

const lepeMonitor = new TokenMonitor(httpEndpoint, wsEndpoint, lepeTokenAddress, originalSupplyAmount);


lepeMonitor.initializeCurrentSupply();
lepeMonitor.fetchTotalBurned();
lepeMonitor.startPolling();
