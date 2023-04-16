import axios from "axios";
import fs from 'fs';
import { config } from './config.js';
import crypto from 'node:crypto';
import _ from "lodash";

const txStatuses = { 0: "Email Sent", 1: "Cancelled", 2: "Awaiting Approval", 3: "Rejected", 4: "Processing", 5: "Failure", 6: "Completed" };
const autoConvertableStables = ["USDP", "TUSD"];
const timeout = ms => new Promise(res => setTimeout(res, ms));
const sign = query_string => crypto.createHmac('sha256', config.secret).update(query_string).digest('hex');


function parseFile(file) {
    let addresses = fs.readFileSync(file).toString('UTF8').split('\n');
    addresses = addresses.map(addr => addr.trim());
    return addresses.filter(addr => addr != '');
}


function validateWallets(array, regexp) {
    let invalidWallets = [];

    array.forEach(wallet => {
        !wallet.match(regexp) && invalidWallets.push(wallet)
    })

    if (invalidWallets.length > 0) {
        console.log(`Invalid wallets: ${invalidWallets.join("\n")}`);
        return false;
    } else {
        return true;
    }
}


async function getCoinInformation(coin) {
    let query = `timestamp=${Date.now()}`;
    let signature = sign(query);

    let res = await axios(`https://api.binance.com/sapi/v1/capital/config/getall?${query}&signature=${signature}`, {
        method: "GET",
        headers: { 'X-MBX-APIKEY': config.apikey }
    }).catch(err => console.error(err.response.data.msg));

    return res.data.find(query => query.coin === coin);
}


async function getTransactionInfo(coin, txid) {
    let query = `coin=${coin}&timestamp=${Date.now()}`;
    let signature = sign(query);

    let res = await axios(`https://api.binance.com/sapi/v1/capital/withdraw/history?${query}&signature=${signature}`, {
        method: "GET",
        headers: { 'X-MBX-APIKEY': config.apikey }
    }).catch(err => console.error(err.response.data.msg));

    let tx = res.data.find(query => query.id === txid)
    console.log(`Sent ${tx.amount} ${tx.coin}, fee: ${tx.transactionFee} ${tx.coin}, status: ${txStatuses[tx.status]}`);

    return res.data;
}


async function withdraw(coin, address, amount, network) {
    let query = `coin=${coin}&address=${address}&amount=${amount}&network=${network}&timestamp=${Date.now()}`;
    let signature = sign(query);

    let res = await axios(`https://api.binance.com/sapi/v1/capital/withdraw/apply?${query}&signature=${signature}`, {
        method: "POST",
        headers: { 'X-MBX-APIKEY': config.apikey }
    }).catch(err => console.error(err.response.data.msg));

    if (res?.data) {
        await timeout(_.random(config.delay.min, config.delay.max) * 1000);
        await getTransactionInfo(coin, res.data.id);

        return res;
    }
}


(async () => {
    let coinData = await getCoinInformation(config.token.toUpperCase());
    let networks = coinData.networkList.map(item => item.network);
    let balance = autoConvertableStables.includes(config.token.toUpperCase()) ? (await getCoinInformation("BUSD")).free : coinData.free;
    console.log(`Balance: ${balance} ${coinData.coin}`);
   
    if (networks.includes(config.network.toUpperCase())) {
        let networkData = coinData.networkList.find(item => item.network == config.network.toUpperCase());
        
        let wallets = parseFile("wallets.txt");
        let validWallets = validateWallets(wallets, networkData.addressRegex);
        let amount = typeof (config.amount) == 'string' ? config.amount.replace('.', ',') : config.amount;
        autoConvertableStables.includes(config.token.toUpperCase()) && console.log(networkData?.specialTips);

        if (!validWallets) {
            console.log('Please, remove invalid wallets');
            return;
        }

        if (balance < wallets.length * amount) {
            console.log('Insufficient funds');
            return;
        }

        if (!networkData.withdrawEnable) {
            console.log(networkData.withdrawDesc);
            return;
        }
        
        for (let i = 0; i < wallets.length; i++) {
            let decimals = networkData.withdrawIntegerMultiple.length > 1 ? networkData.withdrawIntegerMultiple.split('.')[1].length : 0;
            let finalAmount = config.randomizeAmount ? (amount * (_.random(1 - (config.spread / 100), 1))).toFixed(decimals) : amount;

            if (+finalAmount >= +networkData.withdrawMin) {
                await withdraw(config.token.toUpperCase(), wallets[i], finalAmount, config.network.toUpperCase());
            } else console.log(`Minimal amount is: ${networkData.withdrawMin} ${networkData.coin}, current amount is: ${finalAmount} ${networkData.coin}`);
        }        
    } else {
        console.log(`Invalid network, available networks: ${networks.join(', ')}`);
    }
})()