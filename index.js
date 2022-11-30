import axios from "axios";
import fs from 'fs';
import { config } from './config.js'
import crypto from 'node:crypto';
import _ from "lodash"

let txStatuses = { 0: "Email Sent", 1: "Cancelled", 2: "Awaiting Approval", 3: "Rejected", 4: "Processing", 5: "Failure", 6: "Completed" };
const timeout = ms => new Promise(res => setTimeout(res, ms));
const sign = query_string => crypto.createHmac('sha256', config.secret).update(query_string).digest('hex');


function parseFile(file) {
    let data = fs.readFileSync(file, "utf8");
    let array = data.split('\r\n');
    let wallets = [];

    array.forEach(wallet => {
        if (wallet.length > 3) {
            wallets.push(wallet)
        }
    })

    return wallets
}


function validateWallets(array, regexp) {
    let invalidWallets = [];

    array.forEach(wallet => {
        !wallet.match(regexp) && invalidWallets.push(wallet)
    })

    if (invalidWallets.length > 0) {
        console.log(`Invalid wallets: ${invalidWallets.join("\n")}`);
    } else return true
}


async function getCoinInformation(coin) {
    let query = `timestamp=${Date.now()}`;
    let signature = sign(query);

    let res = await axios(`https://api.binance.com/sapi/v1/capital/config/getall?${query}&signature=${signature}`, {
        method: "GET",
        headers: { 'X-MBX-APIKEY': config.apikey }
    }).catch(err => console.error(err.response.data.msg))

    return res.data.find(query => query.coin === coin)
}


async function getTransactionInfo(coin, txid) {
    let query = `coin=${coin}&timestamp=${Date.now()}`
    let signature = sign(query);

    let res = await axios(`https://api.binance.com/sapi/v1/capital/withdraw/history?${query}&signature=${signature}`, {
        method: "GET",
        headers: { 'X-MBX-APIKEY': config.apikey }
    }).catch(err => console.error(err.response.data.msg))

    let tx = res.data.find(query => query.id === txid)
    console.log(`Sent ${tx.amount} ${tx.coin}, fee: ${tx.transactionFee} ${tx.coin}, status: ${txStatuses[tx.status]}`);

    return res.data
}


async function withdraw(coin, address, amount, network) {
    let query = `coin=${coin}&address=${address}&amount=${amount}&network=${network}&timestamp=${Date.now()}`;
    let signature = sign(query);

    let res = await axios(`https://api.binance.com/sapi/v1/capital/withdraw/apply?${query}&signature=${signature}`, {
        method: "POST",
        headers: { 'X-MBX-APIKEY': config.apikey }
    }).catch(err => console.error(err.response.data.msg))

    if (res?.data) {
        await timeout(_.random(config.delay.min, config.delay.max) * 1000)
        await getTransactionInfo(coin, res.data.id)

        return res
    }
}



(async () => {
    let coinData = await getCoinInformation(config.token.toUpperCase())
    let networks = coinData.networkList.map(item => item.network);
    console.log(`Balance: ${coinData.free} ${coinData.coin}`);

    if (networks.includes(config.network.toUpperCase())) {
        let networkData = coinData.networkList.find(item => item.network == config.network.toUpperCase());
        let wallets = parseFile("wallets.txt");
        let validWallets = validateWallets(wallets, networkData.addressRegex);
        let amount = typeof (config.amount) == 'string' ? config.amount.replace('.', ',') : config.amount;

        if (validWallets) {
            if (coinData.free >= wallets.length * amount) {
                for (let i = 0; i < wallets.length; i++) {
                    let decimals = networkData.withdrawIntegerMultiple.length > 1 ? networkData.withdrawIntegerMultiple.split('.')[1].length : 0;
                    let finalAmount = config.randomizeAmount ? (amount * (_.random(1 - (config.spread / 100), 1))).toFixed(decimals) : amount;

                    if (+finalAmount >= +networkData.withdrawMin) {
                        await withdraw(config.token.toUpperCase(), wallets[i], finalAmount, config.network.toUpperCase())
                    } else console.log(`Minimal amount is: ${networkData.withdrawMin} ${networkData.coin}`);
                }
            } else console.log('Insufficient funds')
        } else console.log('Please, remove invalid wallets')
    } else console.log(`Invalid network, available networks: ${networks.join(', ')}`);
})()