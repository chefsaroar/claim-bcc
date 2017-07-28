import { h, Component } from 'preact';
import { satoshi2btc, getValidInputs, calculateFee } from '../utils/utils';

export default class SendComponent extends Component {

    constructor(props) {
        super(props);
        this.state = {
            selectedFee: 1,
            addressInTrezor: props.accounts[ props.activeAccount ].bitcoinCashAddress,
            address: props.accounts[ props.activeAccount ].bitcoinCashAddress,
            addressValid: true,
            advanced: false
        }
    }

    changeFee(event) {
        this.setState({
            selectedFee: event.currentTarget.selectedIndex
        })
    }

    onAddressChange(event) {
        this.setState({
            address: event.currentTarget.value,
            addressValid: false,
        });
    }

    toggleAdvanced(event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        this.setState({
            advanced: this.state.advanced ? false : true
        });
    }

    render(props) {

        const activeAccount = props.accounts[ props.activeAccount ];

        const accountSelect = props.accounts.map((account, index) => 
            <option value={index}>{ account.name } <span>{ satoshi2btc(account.balance) } BTC</span></option>
        );
        const inputs = getValidInputs(activeAccount.unspents);
        const fee = calculateFee(activeAccount.unspents.length, 1, props.fees[ this.state.selectedFee ].maxFee);
        const feeSelect = props.fees.map((f, index) => 
            <option value={index}>{ f.name }</option>
        );

        //var targetAddress = '18NjTNXRgaFqaTFKYQ5ujxuu8PCcVt5NCD';
        var targetAddress = activeAccount.bitcoinCashAddress;
        var errorMessage = '';


        const advancedSettingsButtonClassName = `show-advanced-settings ${ (this.state.advanced ? 'opened' : '') }`;
        const advancedSettingsButtonLabel = this.state.advanced ? 'Hide advanced settings' : 'Show advanced settings';
        const advancedSettingsClassName = `advanced-settings ${ (this.state.advanced ? 'opened' : '') }`;
        const formValid = this.state.addressValid ? '' : 'not-valid';
        /*
        Explorer addr: https://bcc-bitcore2.trezor.io/
        <article>
                    <button>×</button>
                    <h4>Failed to send transaction.</h4>
                    <p>
                        <span>Error details:</span>
                        <span>{ errorMessage }</span>
                    </p>
                    <p>
                        <span>If the problem persists, please run our</span>
                        <a href="">Troubleshooter</a>
                    </p>
                </article>*/


        /*
        You can claim XXX BCC.
        Popup: If the number does not match your BTC account balance, then you probably received additional BTC after the chain-split. These cannot be claimed as BCC.
        */

        var addressHint = this.state.address === this.state.addressInTrezor ? `Bitcoin Cash ${activeAccount.name} in TREZOR` : 'Not a TREZOR account, please double check it!';
        if(!this.state.addressValid){
            addressHint = 'Not a valid address';
        }
        const addressHintClassName = this.state.address === this.state.addressInTrezor ? 'address-hint' : 'address-hint foreign-address';

        return (
            <section className="component-send">
                <h3>Send Bitcoin Cash to your wallet</h3>
                
                <fieldset className={ formValid }>
                    <p>
                        <label>Account</label>
                        <select value={ activeAccount.id } onChange={ () => { props.selectAccount(event.currentTarget.selectedIndex) } }>
                            { accountSelect }
                        </select>
                    </p>
                    <div className={advancedSettingsButtonClassName}>
                        <a href="#" onClick={ () => { this.toggleAdvanced(event) } }>{ advancedSettingsButtonLabel }</a>
                    </div>
                    <div className={advancedSettingsClassName}>
                        <p>
                            <label for="address">Address</label>
                            <span className="address-input">
                                <input id="address" type="text" value={ this.state.address } onInput={ () => { this.onAddressChange(event) } } />
                            </span>
                            <span className={addressHintClassName}>{ addressHint }</span>
                        </p>
                        <p>
                            <label>Amount</label>
                            <input type="text" value={ satoshi2btc(activeAccount.balance - fee) } disabled />
                            <span>Only 0.003 BTC are available for claim &#9432;</span>
                        </p>
                        <p>
                            <label>Fee</label>
                            <select value={ this.state.selectedFee } onChange={ () => { this.changeFee(event) } }>
                                { feeSelect }
                            </select>
                            <span>{ satoshi2btc(fee) } BTC</span>
                        </p>
                    </div>
                    <button 
                        className="btn_primary"
                        onClick={ () => { props.send(activeAccount, activeAccount.balance - fee) } }
                        disabled={!this.state.addressValid}>Claim { satoshi2btc(activeAccount.balance - fee) } BBC</button>
                </fieldset>
            </section>
        );
    }
}