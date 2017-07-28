import { h, Component } from 'preact';
import HeaderComponent from './HeaderComponent';
import Start from './StartComponent';
import Accounts from './SendComponent';

import { getBitcoinCashPathFromIndex, getSplitBlock } from '../utils/utils';


export default class App extends Component {

    constructor(props) {
        super(props);

        getSplitBlock().then(json => {
            console.log("JSON!", this, json.block)
            this.setState({
                splitBlockHeight: json.block
            });

        })

        this.state = {
            // accounts: [ 
            //     { name: 'Account #1', 
            //       id: 0,
            //       balance: 30000, 
            //       unspents: [1],
            //       bitcoinCashAddress: 'ABCD',
            //       tx: { id: '1234557asdq3esdc24asd3424sdad' } 
            //     },
            //     { name: 'Account #2', id: 1, balance: 0, unspents: [] } 
            // ],
            // fees: [
            //     { name: "High", maxFee: 200 },
            //     { name: "Normal", maxFee: 100 }
            // ],
            activeAccount: 0,
            loading: false
        };
    }

    getAccounts() {
        TrezorConnect.claimBitcoinCashAccountsInfo(response => {
            if(response.success){
                let accounts = [];
                for(let account of response.accounts){
                    if(account.addressId > 0 && account.balance > 0){
                        account.name = `Account #${(account.id + 1)}`;
                        accounts.push(account);
                    }
                }
                this.setState({ 
                    accounts: accounts,
                    fees: response.fees
                });
            }
        });
    }

    selectAccount(index: number): void {
        this.setState({
            activeAccount: index
        })
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
                //address_n: getBitcoinCashPathFromIndex(account.id),
                address_n: account.bitcoinCashPath,
                amount: amount,
                script_type: 'PAYTOADDRESS'
            }
        ]

        console.log("SIGNTX params", inputs, outputs);

        TrezorConnect.signTx(inputs, outputs, response => {
            console.log("SIGNTX", response);
            if(response.status){

            }
        });


        // var hidden = '';
        // var visual = '';
        // TrezorConnect.requestLogin(null, hidden, visual, response => {
        //     if(response.success){
        //         let list = this.state.accounts;
        //         let index = list.indexOf(account);
        //         list[index].balance = '0 BTC';
        //         list[index].tx = {
        //             id: '1234557asdq3esdc24asd3424sdad',
        //             url: ''
        //         }
        //         this.setState({
        //             accounts: list
        //         });
        //     }            
        // });

        // let inputs = [{
        //      address_n: [44 | 0x80000000, 0 | 0x80000000, 2 | 0x80000000, 1, 0],
        //      prev_index: 0,
        //      prev_hash: 'b035d89d4543ce5713c553d69431698116a822c57c03ddacf3f04b763d1999ac'
        // }];

        
        // let outputs = [
        //     {
        //      address_n: [44 | 0x80000000, 0 | 0x80000000, 2 | 0x80000000, 1, 1],
        //      amount: 3181747,
        //      script_type: 'PAYTOADDRESS'
        //  }, {
        //      address: '17oeY71zms7LJkfNDXMUwYV4HHRmwJnm9Z',
        //      amount: 200000,
        //      script_type: 'PAYTOADDRESS'
        // }];
    }

    render(props) {

        let view = this.state.accounts === null ||  this.state.accounts === undefined ? 
            <Start click={ this.getAccounts.bind(this) } { ...this.state } /> : 
            <Accounts 
                send={ this.signTX.bind(this) } 
                selectAccount={ this.selectAccount.bind(this) }
                { ...this.state } />;

        // <button onClick={ () => { this.getAccounts() } }>Connect with trezor</button>
        //         <br/>
        //         <button onClick={ () => { this.signTX() } }>SEND</button>

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