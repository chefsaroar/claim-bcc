import { h, Component } from 'preact';
import { satoshi2btc, calculateFee } from '../utils/utils';

export default class AccountsComponent extends Component {

    constructor(props) {
        super(props);
        this.state = {
            selectedFee: 1
        }
    }

    changeFee(event) {
        this.setState({
            selectedFee: event.currentTarget.selectedIndex
        })
    }

    render(props) {
        console.log("AccountComponent", props)

        var accounts = props.accounts.map((account, index) => 
            <li onClick={ () => { props.selectAccount(index) } } className={ props.activeAccount === index ? 'active' : '' }>
                <a>
                    <span className="account-label">{account.name}</span>
                    <span className="account-balance">{ satoshi2btc(account.balance) } BTC</span>
                </a>
            </li>
        );

        var accountSelect = props.accounts.map((account, index) => 
            <option value={index}>{ account.name }</option>
        );

        var activeAccount = props.accounts[ props.activeAccount ];
        var fee = calculateFee(activeAccount.unspents.length, 1, props.fees[ this.state.selectedFee ].maxFee);
        // console.log("FEE", activeAccount.balance, fee, props.fees[0].maxFee)
        let feeSelect = props.fees.map((f, index) => 
            <option value={index}>{ f.name }</option>
        );
        
        var tx;
        if(activeAccount.tx){
            tx = <div className="account-tx">
                    <h3>Trasaction history</h3>
                    <div className="account-tx-row">
                        <span className="time">11:00</span>
                        <a href="https://btc-bitcore3.trezor.io/tx/99ed59f0c6ecf25ef78d046ccdb6e504b06b13e420e01abb5b4c03394691c9fd">
                            { activeAccount.tx.id }
                        </a>
                        <span className="out">-0.003 BTC</span>
                        <div className="clear"></div>
                    </div>
                    
                 </div>;
        }

        var targetAddress = '0x123454';

        /*
        <nav>
                    <ul>
                        { accounts }
                    </ul>
                </nav>*/
        // <h3>{ activeAccount.name }</h3>
        return (
            <article className="component-send">
                
                <aside>
                    
                    <h3>Send</h3>
                    <p>You are about to send all of your BTC to BCC chain</p>
                    <article>
                    </article>
                    <fieldset>
                        <div>
                            <label>Account</label>
                            <select value={ activeAccount.id } onChange={ () => { props.selectAccount(event.currentTarget.selectedIndex) } }>
                                { accountSelect }
                            </select>
                        </div>
                        <div>
                            <label for="address">Address</label>
                            <input id="address" type="text" value={ targetAddress } />
                            <span>Bitcoin Cash { activeAccount.name } in TREZOR</span>
                        </div>
                        <div>
                            <label>Amount</label>
                            <input type="text" value={ satoshi2btc(activeAccount.balance - fee) } disabled />
                        </div>
                        <div>
                            <label>Fee</label>
                            <select value={ this.state.selectedFee } onChange={ () => { this.changeFee(event) } }>
                                { feeSelect }
                            </select>
                            <span>{ satoshi2btc(fee) } BTC</span>
                        </div>
                        <button className="btn_primary" onClick={ () => { props.send(activeAccount, activeAccount.balance - fee) } }>Send</button>
                    </fieldset>
                    { tx }
                </aside>
            </article>
        );
    }
}