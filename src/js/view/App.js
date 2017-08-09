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
            // trezorAccounts: [
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
                bitcoreApiUrl: 'https://btc-bitcore1.trezor.io/'
            });
        })
    }

    getAccounts(): void {

        TrezorConnect.setAccountDiscoveryLimit(30);
        TrezorConnect.setAccountDiscoveryGapLength(100);
        TrezorConnect.setAccountDiscoveryBip44CoinType(145);

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
                    let hashHex = window.localStorage.getItem(account.bitcoinAddress);
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
                    .then(({ trezorAccounts, usedTrezorAccounts }) => {
                        this.setState({ 
                            accounts: accounts,
                            trezorAccounts: trezorAccounts,
                            usedTrezorAccounts: usedTrezorAccounts,
                            fees: response.fees,
                            error: null
                        });
                    }).catch(error => {
                        this.setState({ 
                            accounts: accounts,
                            trezorAccounts: [],
                            usedTrezorAccounts: [],
                            fees: response.fees,
                            error: null
                        });
                    });
                }else{
                    this.setState({ 
                        accounts: accounts,
                        trezorAccounts: [],
                        usedTrezorAccounts: [],
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
        let trezorAccounts = [];
        let usedTrezorAccounts = [];

        for(let account of accounts){
            trezorAccounts.push({
                address: account.bitcoinAddress,
                path: account.bitcoinAddressPath
            });
        }
        return { trezorAccounts: trezorAccounts, usedTrezorAccounts: usedTrezorAccounts }
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

    signTX(account: Object, btcAddress: number, amount: number): void {

        

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
                address: btcAddress,
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
                        newAccounts[index].balance = 0;
                        newAccounts[index].availableBCH = 0;
                        newAccounts[index].transactionSuccess = {
                            url: `${this.state.bitcoreApiUrl}tx/${hashHex}`,
                            hashHex: hashHex
                        }
                        let newTrezorAccounts = [ ...this.state.trezorAccounts ];
                        newTrezorAccounts.splice(0, 1);
                        let usedTrezorAccounts = [ ...this.state.usedTrezorAccounts ];
                        usedTrezorAccounts.push(this.state.trezorAccounts[0]);

                        // store tx in local storage
                        window.localStorage.setItem(account.bitcoinAddress, hashHex);

                        // update view
                        this.setState({
                            accounts: newAccounts,
                            trezorAccounts: newTrezorAccounts,
                            usedTrezorAccounts: usedTrezorAccounts,
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
        }, TREZOR_FIRMWARE);


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

        // let newTrezorAccounts = [ ...this.state.trezorAccounts ];
        // let usedTrezorAccounts = [ ...this.state.usedTrezorAccounts ];
        // usedTrezorAccounts.push(this.state.trezorAccounts[0]);
        // newTrezorAccounts.splice(0, 1);

        // window.localStorage.setItem(account.bitcoinAddress, hashHex);

        // this.setState({
        //     accounts: newAccounts,
        //     trezorAccounts: newTrezorAccounts,
        //     usedTrezorAccounts: usedTrezorAccounts,
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
            const { accounts, trezorAccounts, usedTrezorAccounts, fees, activeAccount, success, error } = this.state;
            view = <Send 
                        // callbacks
                        send={ this.signTX.bind(this) } 
                        selectAccount={ this.selectAccount.bind(this) }
                        hideError={ this.hideError.bind(this) }
                        // data
                        useTrezorAccounts={ this.state.useTrezorAccounts && trezorAccounts.length > 0 }
                        accounts={ accounts }
                        trezorAccounts={ trezorAccounts }
                        usedTrezorAccounts={ usedTrezorAccounts }
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
