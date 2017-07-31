import { h, Component } from 'preact';
import HeaderComponent from './HeaderComponent';
import Home from './HomeComponent';
import Send from './SendComponent';

import { getBitcoinCashPathFromIndex, getSplitBlock } from '../utils/utils';

const TREZOR_FIRMWARE = '1.4.0';

export default class App extends Component {

    constructor(props) {
        super(props);

        this.state = {
            block: 0,
            activeAccount: 0,
            // accounts: [ 
            //     { name: 'Account #1', 
            //       id: 0,
            //       balance: 20000000,
            //       availableBCH: 30000,
            //       unspents: [1],
            //       bitcoinCashAddress: '1JEcxcVQ7vFfCmLnms1Cf9G1NaNbGnHPhT',
            //       transactionSuccess: { hashHex: '1924a52b1f97797dc1c072895d6441b96f28b8b4637bd0130eab3d32ef2be17e' } 
            //     },
            //     { name: 'Account #2', id: 1, balance: 0, unspents: [] } 
            // ],
            // fees: [
            //     { name: "High", maxFee: 200 },
            //     { name: "Normal", maxFee: 100 }
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
                    // filter empty accounts (except for first account)

                    
                    // ignore last empty account
                    if(index > 0 && index === accountsLen && account.addressId === 0 && account.balance === 0 ) {
                        continue;
                    }
                    
                    //if(accounts.length >  || (account.addressId > 0 && account.balance > 0)) {
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
                this.setState({ 
                    accounts: accounts,
                    fees: response.fees,
                    error: null
                });
            }else{
                window.scrollTo(0, 0);
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

    signTX(account: Object, amount: number): void {

        console.log("Acccout", account);
        let inputs = [];
        for(let input of account.unspents){
            console.log("input", input);
            inputs.push({
                address_n: input.addressPath,
                prev_index: input.vout,
                prev_hash: input.txId
            });
        }

        let outputs = [
            {
                address_n: account.bitcoinCashPath,
                amount: amount,
                script_type: 'PAYTOADDRESS'
            }
        ];

        TrezorConnect.signTx(inputs, outputs, response => {
            if(response.status){
                TrezorConnect.pushTransaction(response.serialized_tx, pushResult => {
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
                        this.setState({
                            error: pushResult.error
                        });
                    }
                });
                
            }else{
                window.scrollTo(0, 0);
                this.setState({
                    error: response.error
                });
            }
        }, TREZOR_FIRMWARE);




        // TODO sing and push TX
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
        //     url: 'google.com',
        //     hashHex: hashHex
        // }

        // window.localStorage.setItem(account.bitcoinCashAddress, hashHex);

        // this.setState({
        //     accounts: newAccounts,
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
            const { accounts, fees, activeAccount, success, error } = this.state;
            view = <Send 
                        // callbacks
                        send={ this.signTX.bind(this) } 
                        selectAccount={ this.selectAccount.bind(this) }
                        hideError={ this.hideError.bind(this) }
                        // data
                        accounts= { accounts }
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