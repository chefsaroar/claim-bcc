import { h, Component } from 'preact';
import HeaderComponent from './HeaderComponent';
import Home from './HomeComponent';
import Send from './SendComponent';

import { getBitcoinCashPathFromIndex, getSplitBlock } from '../utils/utils';

const TREZOR_FIRMWARE = '1.5.1';

export default class App extends Component {

    constructor(props) {
        super(props);

        this.state = {
            block: 0,
            activeAccount: 0,
            // accounts: [ 
            //     { name: 'Account #1', 
            //       id: 0,
            //       balance: 10000,
            //       availableBCH: 30000,
            //       unspents: [1],
            //       bitcoinCashAddress: '1JEcxcVQ7vFfCmLnms1Cf9G1NaNbGnHPhT',
            //       //transactionSuccess: { hashHex: '1924a52b1f97797dc1c072895d6441b96f28b8b4637bd0130eab3d32ef2be17e' } 
            //     },
            //     { name: 'Account #2',
            //       id: 1,
            //       balance: 10000000000,
            //       availableBCH: 50000000,
            //       unspents: [1,2],
            //       bitcoinCashAddress: '1JEcxcVQ7vFfCmLnms1Cf9G1NaNbGnHPhZ'
            //     },
            //     { name: 'Account #3',
            //       id: 1,
            //       balance: 10000000000,
            //       availableBCH: 50000000,
            //       unspents: [1,2],
            //       bitcoinCashAddress: '1JEcxcVQ7vFfCmLnms1Cf9G1NaNbGnHPhZ'
            //     } 
            // ],
            // bchAccounts: [
            //     { address: '1', path: '1'},
            //     { address: '2', path: '2'},
            //     { address: '3', path: '3'},
            // ],
            // fees: [
            //     { name: "High", maxFee: 20000 },
            //     { name: "Normal", maxFee: 10000 },
            //     { name: "Low", maxFee: 100 },
            // ],
            //error: "some error"
        };

        getSplitBlock().then(json => {
            this.setState({
                block: json.block
            });
        })
    }

    getAccounts() {
        TrezorConnect.claimBitcoinCashAccountsInfo(response => {
            if(response.success){
                let accounts = [];
                
                let accountsLen = response.accounts.length - 1;
                for(let [index, account] of response.accounts.entries()){
                    
                    // ignore last empty account
                    if(index > 0 && index === accountsLen && account.addressId === 0 && account.balance === 0 ) {
                        continue;
                    }

                    account.name = `Account #${(account.id + 1)}`;
                    account.availableBCH = 0;
                    
                    // filter available unspents
                    let availableUnspents = [];
                    for(let unspent of account.unspents){
                        if(unspent.height <= this.state.block){
                            // TODO: check unspent in explorer
                            account.availableBCH += unspent.value;
                            availableUnspents.push(unspent);
                        }
                    }
                    account.unspents = availableUnspents;

                    // find claimed transaction in local storage
                    let hashHex = window.localStorage.getItem(account.bitcoinCashAddress);
                    if(hashHex){
                        account.transactionSuccess = {
                            hashHex: hashHex
                        }
                    }
                    accounts.push(account);
                }

                // TODO: lookup if BCH account has no transactions
                let bchAccounts = [];
                accounts.reduce(
                    (promise, a) => {
                        return promise.then(() => {
                            return fetch('https://bch-bitcore2.trezor.io/api/addr/' + a.bitcoinCashAddress ).then(response => {
                            //fetch('https://bch-bitcore2.trezor.io/api/addr/1762dxy6MGPepeMj21QRgf6btDzpQTYsPy' ).then(response => {
                                return response.json().then(json => {
                                    console.log("VAL", json.transactions.length);
                                    if(json.transactions.length === 0){
                                        bchAccounts.push({
                                            address: a.bitcoinCashAddress,
                                            path: a.bitcoinCashPath
                                        });
                                    }
                                    return bchAccounts;
                                });
                            });
                        });
                    },
                    Promise.resolve()
                ).then(acc => {
                    this.setState({ 
                        accounts: accounts,
                        bchAccounts: bchAccounts,
                        fees: response.fees,
                        error: null
                    });
                }).catch(error => {
                    window.scrollTo(0, 0);
                    console.error(error);
                    this.setState({
                        error: error
                    });
                });
                


                // this.setState({ 
                //     accounts: accounts,
                //     bchAccounts: bchAccounts,
                //     fees: response.fees,
                //     error: null
                // });
            }else{
                window.scrollTo(0, 0);
                console.error(response.error);
                this.setState({
                    error: response.error
                });
            }
        }, TREZOR_FIRMWARE);
    }

    selectAccount(index: number): void {
        this.setState({
            activeAccount: index,
            error: null
        })
    }

    hideError():void {
        this.setState({
            error: null
        });
    }

    signTX(account: Object, bchPath: number, amount: number): void {

        let inputs = [];
        for(let input of account.unspents){
            inputs.push({
                address_n: input.addressPath,
                prev_index: input.vout,
                prev_hash: input.txId,
                amount: input.value
            });
        }

        let outputs = [
            {
                //address_n: account.bitcoinCashPath,
                address_n: bchPath,
                amount: amount,
                script_type: 'PAYTOADDRESS'
            }
        ];

        TrezorConnect.signTx(inputs, outputs, response => {
            console.log("SingTx", response)
            if(response.success){
                TrezorConnect.pushTransaction(response.serialized_tx, pushResult => {
                    console.log("pushTransaction", pushResult)
                    if (pushResult.success) {
                        // update cached values for account
                        let hashHex = pushResult.txid;
                        let index = this.state.activeAccount;
                        let newAccounts = [ ...this.state.accounts ];
                        newAccounts[index].availableBCH = 0;
                        newAccounts[index].transactionSuccess = {
                            hashHex: hashHex
                        }
                        // store tx in local storage
                        window.localStorage.setItem(account.bitcoinCashAddress, hashHex);

                        // update view
                        this.setState({
                            accounts: newAccounts,
                            error: null
                        });
                    } else {
                        window.scrollTo(0, 0);
                        console.error(pushResult.error);
                        this.setState({
                            error: pushResult.error.message
                        });
                    }
                });
                
            }else{
                window.scrollTo(0, 0);
                console.error(response.error);
                this.setState({
                    error: response.error
                });
            }
        }, TREZOR_FIRMWARE, 'Bcash');




        // TODO sing and push TX
        // simulate error
        // this.setState({
        //     error: "Cancelled by user"
        // });
        // return;

        //simulate success: update account
        // let hashHex = '1234abcd';
        // let index = this.state.activeAccount;
        // let newAccounts = [ ...this.state.accounts ];
        // newAccounts[index].availableBCH = 0;
        // newAccounts[index].transactionSuccess = {
        //     url: 'google.com',
        //     hashHex: hashHex
        // }

        // let newBccAccounts = [ ...this.state.bchAccounts ];
        // newBccAccounts.splice(0, 1);

        // window.localStorage.setItem(account.bitcoinCashAddress, hashHex);

        // this.setState({
        //     accounts: newAccounts,
        //     bchAccounts: newBccAccounts,
        //     error: null
        // });
        // return;


        
    }

    render(props) {

        let view;
        if (this.state.accounts === undefined) {
            view = <Home 
                        click={ this.getAccounts.bind(this) }
                        block={ this.state.block }
                        error={ this.state.error }
                        hideError={ this.hideError.bind(this) }
                         /> 
        } else {
            const { accounts, bchAccounts, fees, activeAccount, success, error } = this.state;
            view = <Send 
                        // callbacks
                        send={ this.signTX.bind(this) } 
                        selectAccount={ this.selectAccount.bind(this) }
                        hideError={ this.hideError.bind(this) }
                        // data
                        accounts={ accounts }
                        bchAccounts={ bchAccounts }
                        fees={ fees }
                        account={ accounts[activeAccount] }
                        success={ accounts[activeAccount].transactionSuccess }
                        error={ error } />;
        }

        return (
            <div className="container">
                <HeaderComponent />
                <main>
                    { view }
                </main>
                <footer>
                    <span>© 2017</span> <a href="">SatoshiLabs</a>
                </footer>
            </div>
        );
    }
}