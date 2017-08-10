import { h, Component } from 'preact';
import HeaderComponent from './HeaderComponent';
import Home from './HomeComponent';
import Send from './SendComponent';
import Log from './LogComponent';

import { getBitcoinCashPathFromIndex, getSplitBlock } from '../utils/utils';

const TREZOR_FIRMWARE = '1.5.1';

export default class App extends Component {

    constructor(props) {
        super(props);

        this.state = {
            log: false,
            block: null,
            activeAccount: 0,
            // useTrezorAccounts: false,
            // accounts: [ 
            //     { name: 'Account #1', 
            //       id: 0,
            //       balance: 300000,
            //       availableBCH: 300000,
            //       unspents: [1],
            //       bitcoinCashAddress: '1JEcxcVQ7vFfCmLnms1Cf9G1NaNbGnHPhT',
            //       transactionSuccess: { hashHex: '1924a52b1f97797dc1c072895d6441b96f28b8b4637bd0130eab3d32ef2be17e' } 
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
            //     // { address: '1JEcxcVQ7vFfCmLnms1Cf9G1NaNbGnHPhTa', path: '1'},
            //     // { address: '1JEcxcVQ7vFfCmLnms1Cf9G1NaNbGnHPhT', path: '2'},
            //     // { address: '1JEcxcVQ7vFfCmLnms1Cf9G1NaNbGnHPhT', path: '3'},
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
                block: json.block,
                useTrezorAccounts: json.useBchAccounts,
                bitcoreApiUrl: 'https://bch-bitcore2.trezor.io/'
            });
        })
    }

    getAccounts(): void {

        TrezorConnect.setAccountDiscoveryLimit(30);
        TrezorConnect.setBitcoreURLS(this.state.bitcoreApiUrl);

        TrezorConnect.claimBitcoinCashAccountsInfo(response => {
            if(response.success){
                console.log("Accounts", response);
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
                        //if(unspent.height <= this.state.block){
                            account.availableBCH += unspent.value;
                            availableUnspents.push(unspent);
                        //}
                    }
                    account.unspents = availableUnspents;

                    // find claimed transaction in local storage
                    let hashHex = window.localStorage.getItem(account.bitcoinCashAddress);
                    if(hashHex){
                        account.transactionSuccess = {
                            url: `${this.state.bitcoreApiUrl}tx/${hashHex}`,
                            hashHex: hashHex
                        }
                    }
                    accounts.push(account);
                }

                if(this.state.useTrezorAccounts){

                    // filter trezor accounts without transactions with fallback

                    this.getEmptyAccounts(accounts)
                    .then(({ bchAccounts, usedBchAccounts }) => {
                        this.setState({ 
                            accounts: accounts,
                            bchAccounts: bchAccounts,
                            usedBchAccounts: usedBchAccounts,
                            fees: response.fees,
                            error: null
                        });
                    }).catch(error => {
                        this.setState({ 
                            accounts: accounts,
                            bchAccounts: [],
                            usedBchAccounts: [],
                            fees: response.fees,
                            error: null
                        });
                    });
                }else{
                    this.setState({ 
                        accounts: accounts,
                        bchAccounts: [],
                        usedBchAccounts: [],
                        fees: response.fees,
                        error: null
                    });
                }

            }else{
                window.scrollTo(0, 0);
                console.error(response.error);
                this.setState({
                    error: response.error
                });
            }
        }, TREZOR_FIRMWARE);
    }

    async getEmptyAccounts(accounts): Array<Object> {
        let bchAccounts = [];
        let usedBchAccounts = [];
        return await accounts.reduce(
            (promise, a) => {
                return promise.then(() => {
                    return fetch(`${this.state.bitcoreApiUrl}api/addr/${a.bitcoinCashAddress}` ).then(response => {
                        return response.json().then(json => {
                            if(json.transactions.length === 0){
                                bchAccounts.push({
                                    address: a.bitcoinCashAddress,
                                    path: a.bitcoinCashPath
                                });
                            }else{
                                usedBchAccounts.push(
                                    {
                                        address: a.bitcoinCashAddress,
                                        path: a.bitcoinCashPath
                                    }
                                );
                            }
                            return { bchAccounts: bchAccounts, usedBchAccounts: usedBchAccounts };
                        });
                    });
                });
            },
            Promise.resolve()
        );
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

    showLog():void {
        setTimeout(() => {
            window.scrollTo(0, document.body.scrollHeight);
        }, 100);
        
        this.setState({
            log: !this.state.log
        });
    }

    hideLog(): void {
        this.setState({
            log: false
        });
    }

    signTX(account: Object, bchAddress: number, amount: number): void {

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
                address: bchAddress,
                amount: amount,
                script_type: 'PAYTOADDRESS'
            }
        ];

        console.log("SignTx params", inputs, outputs);
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
                        newAccounts[index].balance = 0;
                        newAccounts[index].availableBCH = 0;
                        newAccounts[index].transactionSuccess = {
                            url: `${this.state.bitcoreApiUrl}tx/${hashHex}`,
                            hashHex: hashHex
                        }
                        let newBccAccounts = [ ...this.state.bchAccounts ];
                        newBccAccounts.splice(0, 1);
                        let usedBchAccounts = [ ...this.state.usedBchAccounts ];
                        usedBchAccounts.push(this.state.bchAccounts[0]);

                        // store tx in local storage
                        window.localStorage.setItem(account.bitcoinCashAddress, hashHex);

                        // update view
                        this.setState({
                            accounts: newAccounts,
                            bchAccounts: newBccAccounts,
                            usedBchAccounts: usedBchAccounts,
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


        // simulate error
        // this.setState({
        //     error: "Cancelled by user"
        // });
        // return;

        // simulate success: update account
        // let hashHex = '1234abcd';
        // let index = this.state.activeAccount;
        // let newAccounts = [ ...this.state.accounts ];
        // newAccounts[index].availableBCH = 0;
        // newAccounts[index].transactionSuccess = {
        //     url: `${this.state.bitcoreApiUrl}tx/${hashHex}`,
        //     hashHex: hashHex
        // }

        // let newBccAccounts = [ ...this.state.bchAccounts ];
        // let usedBchAccounts = [ ...this.state.usedBchAccounts ];
        // usedBchAccounts.push(this.state.bchAccounts[0]);
        // newBccAccounts.splice(0, 1);

        // window.localStorage.setItem(account.bitcoinCashAddress, hashHex);

        // this.setState({
        //     accounts: newAccounts,
        //     bchAccounts: newBccAccounts,
        //     usedBchAccounts: usedBchAccounts,
        //     error: null
        // });
        // return;

    }

    render(props): void {

        let view;
        if (this.state.accounts === undefined) {
            view = <Home 
                        click={ this.getAccounts.bind(this) }
                        block={ this.state.block }
                        error={ this.state.error }
                        hideError={ this.hideError.bind(this) }
                         /> 
        } else {
            const { accounts, bchAccounts, usedBchAccounts, fees, activeAccount, success, error } = this.state;
            view = <Send 
                        // callbacks
                        send={ this.signTX.bind(this) } 
                        selectAccount={ this.selectAccount.bind(this) }
                        hideError={ this.hideError.bind(this) }
                        // data
                        useTrezorAccounts={ this.state.useTrezorAccounts && bchAccounts.length > 0 }
                        accounts={ accounts }
                        bchAccounts={ bchAccounts }
                        usedBchAccounts={ usedBchAccounts }
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
                    <Log displayed={ this.state.log } hideLog={ this.hideLog.bind(this) } />
                </main>
                <footer>
                    <span>© 2017</span> <a href="http://satoshilabs.com">SatoshiLabs</a> | <a onClick={ this.showLog.bind(this) }>Show log</a>
                </footer>
            </div>
        );
    }
}
