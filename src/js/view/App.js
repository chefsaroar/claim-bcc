import { h, Component } from 'preact';
import HeaderComponent from './HeaderComponent';
import Home from './HomeComponent';
import Send from './SendComponent';
import Log from './LogComponent';

import { getBitcoinCashPathFromIndex, getSplitBlock } from '../utils/utils';
import data from '../utils/data';


const TREZOR_FIRMWARE = '1.5.1';

export default class App extends Component {

    constructor(props) {
        super(props);

        this.state = {
            log: false,
            block: 1,
            useTrezorAccounts: true,
            activeAccount: 0,
            //...data
        };

        // getSplitBlock().then(json => {
        //     this.setState({
        //         block: json.block,
        //         useTrezorAccounts: json.useBchAccounts,
        //         bitcoreApiUrl: 'https://btc-bitcore1.trezor.io/'
        //     });
        // })
    }

    getAccounts(origin, destination): void {

        TrezorConnect.setAccountDiscoveryLimit(30);
        //TrezorConnect.setAccountDiscoveryGapLength(100);
        //TrezorConnect.setAccountDiscoveryBip44CoinType(145);
        // TrezorConnect.closeAfterSuccess(false);
        // TrezorConnect.closeAfterFailure(false);

        TrezorConnect.recoverCoins(origin, destination, response => {

            if(response.success){
                console.log("Accounts", response);
                let accounts = [];
                let activeAccount = -1;
                let accountsLen = response.originAccounts.length - 1;
                for(let [index, account] of response.originAccounts.entries()){
                    
                    // ignore last empty account
                    account.name = `Account #${(account.id + 1)}`;
                    account.available = 0;
                    
                    // filter available unspents
                    let availableUnspents = [];
                    for(let unspent of account.info.utxos){
                        account.available += unspent.value;
                        availableUnspents.push(unspent);
                    }
                    account.unspents = availableUnspents;

                    if (account.available > 0 && activeAccount < 0) {
                        activeAccount = index;
                    }

                    // find claimed transaction in local storage
                    // let hashHex = window.localStorage.getItem(account.address);
                    // if(hashHex){
                    //     account.transactionSuccess = {
                    //         url: `${this.state.bitcoreApiUrl}tx/${hashHex}`,
                    //         hashHex: hashHex
                    //     }
                    // }
                    accounts.push(account);
                }

                if (activeAccount < 0) activeAccount = 0;

                const fees = [];
                for (let f in response.fees) {
                    fees.push({
                        name: f,
                        maxFee: response.fees[f]
                    })
                }
                fees.reverse();

                let trezorAddresses = [];
                if(this.state.useTrezorAccounts){
                    for (let acc of response.originAddresses) {
                        trezorAddresses.push({ 
                            address: acc.info.unusedAddresses[0], 
                            name: `Account #${(acc.id + 1)}`,
                            path: acc.basePath.concat([0, acc.info.usedAddresses.length])
                        });
                    }
                }

                this.setState({ 
                    activeAccount: activeAccount,
                    accounts: accounts,
                    originAccount: origin,
                    destinationAccount: destination,
                    trezorAccounts: trezorAddresses,
                    originAddresses: response.originAddresses,
                    fees: fees,
                    error: null
                });
                

            }else{
                window.scrollTo(0, 0);
                console.error(response.error);
                this.setState({
                    error: response.error
                });
            }
        }, TREZOR_FIRMWARE);
    }

    verifyAddress(address): void {

        const { originAccount, accounts, activeAccount, trezorAccounts } = this.state;

        let index = -1;
        for (let [i, a] of trezorAccounts.entries()) {
            if (a.address === address) {
                index = i;
                break;
            }
        }

        if (index >= 0) {
            const addr = trezorAccounts[index];
            const account = accounts[activeAccount];
            const isSegwit = this.state.destinationAccount.id === 'btcX' ? true : account.segwit;
            TrezorConnect.getAddress(addr.path, originAccount.txType, isSegwit, (response) => {
                //console.log("TrezorConnect.getAddress response", response);
            });
        }
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

    signTX(account: Object, address: number, amount: number): void {
        console.log("SignTx params", account, address, amount);

        const outputs = [
            {
                address: address,
                value: amount
            }
        ];

        TrezorConnect.closeAfterSuccess(false);
        TrezorConnect.setBitcoreURLS(this.state.originAccount.bitcore);
        TrezorConnect.recoverSignTx(account, account.info.utxos, outputs, response => {
            console.log("SingTx", response)

            TrezorConnect.closeAfterSuccess(true);
            TrezorConnect.recoverPushTx(response.serialized_tx, pushResult => {
                console.log("pushTransaction", pushResult)
                if (pushResult.success) {
                    // update cached values for account
                    let hashHex = pushResult.txid;
                    let index = this.state.activeAccount;
                    let newAccounts = [ ...this.state.accounts ];
                    newAccounts[index].balance = 0;
                    newAccounts[index].available = 0;
                    newAccounts[index].transactionSuccess = {
                        url: `${this.state.originAccount.bitcore[0]}tx/${hashHex}`,
                        hashHex: hashHex
                    }

                    // store tx in local storage
                    // window.localStorage.setItem(account.address, hashHex);

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
        }, TREZOR_FIRMWARE);
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
            const { accounts, originAccount, trezorAccounts, fees, activeAccount, success, error } = this.state;
            view = <Send 
                        // callbacks
                        send={ this.signTX.bind(this) }
                        verifyAddress={ this.verifyAddress.bind(this) }
                        selectAccount={ this.selectAccount.bind(this) }
                        hideError={ this.hideError.bind(this) }
                        // data
                        useTrezorAccounts={ this.state.useTrezorAccounts && trezorAccounts.length > 0 }
                        accounts={ accounts }
                        originAccount={ originAccount }
                        trezorAccounts={ trezorAccounts }
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
