const data = {
    useTrezorAccounts: true,
    activeAccount: 1,
    accounts: [ 
        { name: 'Account #1', 
            id: 0,
            available: 300000,
            unspents: [1],
            transactionSuccess: { hashHex: '1924a52b1f97797dc1c072895d6441b96f28b8b4637bd0130eab3d32ef2be17e' } 
        },
        { name: 'Account #2', 
            id: 1,
            available: 300000,
            unspents: [1],
            //transactionSuccess: { hashHex: '1924a52b1f97797dc1c072895d6441b96f28b8b4637bd0130eab3d32ef2be17e' } 
        },
    ],
    trezorAccounts: [
        { address: '1JEcxcVQ7vFfCmLnms1Cf9G1NaNbGnHPhTa', name: 'Account #1'},
        { address: '1JEcxcVQ7vFfCmLnms1Cf9G1NaNbGnHPhT1', name: 'Account #2'},
        { address: '1JEcxcVQ7vFfCmLnms1Cf9G1NaNbGnHPhT2', name: 'Account #3'},
        { address: '1JEcxcVQ7vFfCmLnms1Cf9G1NaNbGnHPh3', name: 'Account #3'},
        { address: '1JEcxcVQ7vFfCmLnms1Cf9G1NaNbGnHPh4', name: 'Account #3'},
        { address: '1JEcxcVQ7vFfCmLnms1Cf9G1NaNbGnHPh5', name: 'Account #3'},
        { address: '1JEcxcVQ7vFfCmLnms1Cf9G1NaNbGnHPh6', name: 'Account #3'},
        { address: '1JEcxcVQ7vFfCmLnms1Cf9G1NaNbGnHPhT', name: 'Account #3'},
    ],
    fees: [
        { name: "High", maxFee: 20000 },
        { name: "Normal", maxFee: 10000 },
        { name: "Low", maxFee: 100 },
    ],

    originAccount: { id: "btc1", name: "Bitcoin Legacy", short: "BTC", txType: "Bitcoin", bip44: [44, 0], addressVersion: 0, bitcore: ['https://btc-bitcore1.trezor.io/', 'https://btc-bitcore3.trezor.io/'] },
    destinationAccount: { id: "ltc3", name: "Litecoin Segwit", short: "LTC", txType: "Litecoin", bip44: [49, 2], addressVersion: 50, bitcore: ['https://ltc-bitcore1.trezor.io/', 'https://ltc-bitcore3.trezor.io/'] },
};

export default data;