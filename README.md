# Binance-multiwallet-withdrawal
This script allows you to withdraw coins from the binance balance to multiple wallets. The bot supports all binance coins and all networks. Will be useful for participating in retrodrops and other types of abuse. This bot able to send random amounts to avoid linking wallets, check for invalid wallets, send with random delay.

## Before Start
<i>This script has many checks for invalid input and other errors. However, use at your own risk. The author is not responsible for any loss of funds.</i>

## Get Binance API key

1) Binance -> Settings -> API Management -> Create API.
2) Copy API key and Secret key to `config.js` file.
3) Edit restrictions -> Restrict access to trusted IPs only -> Input your IP address.
4) Сheck the box next to the <b>Enable Withdrawals</b>.

## Setup bot

1) Download ZIP and extract it to a folder
2) Install node.js: `https://nodejs.org/en/` (LTS)
3) Setup your settings in `config.js`
4) Paste your wallets to `wallets.txt` file, each wallet on a new line
5) Open folder with the bot in `cmd`
```bash
cd <path to folder with script>
```
6) Install dependencies
```bash
npm install
```
7) Start
```bash
node index
```
