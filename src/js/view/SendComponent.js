import { h, Component } from 'preact';
import bitcoinjs from 'bitcoinjs-lib';
import { satoshi2btc, getValidInputs, calculateFee } from '../utils/utils';

const initalState = {
    accountId: -1,
    advanced: true,
    address: null,
    addressIsValid: true,
    selectedFee: 1,
    fee: 0
};

export default class SendComponent extends Component {

    constructor(props) {
        super(props);
        this.state = {
            ...initalState,
            ...this.getAccountState(props, initalState)
        };
    }

    // handle account change (component update)
    componentWillReceiveProps(props) {
        if(props.account.id !== this.state.accountId) {
            this.setState({
                ...initalState,
                ...this.getAccountState(props, this.state)
            });
        }
    }

    // set state values on init (constructor) or account change (componentWillReceiveProps)
    getAccountState(props, state) {
        return {
            accountId: props.account.id,
            advanced: state.advanced,
            address: props.account.bitcoinCashAddress,
            selectedFee: state.selectedFee,
            fee: calculateFee(props.account.unspents.length, 1, props.fees[ state.selectedFee ].maxFee),
        };
    }

    changeFee(event) {
        let value = event.currentTarget.selectedIndex;
        this.setState({
            selectedFee: value,
            fee: calculateFee(this.props.account.unspents.length, 1, this.props.fees[ value ].maxFee)
        });
    }

    onAddressChange(event) {
        let value = event.currentTarget.value;
        let valid;
        try {
            valid = bitcoinjs.address.toOutputScript(value, bitcoinjs.networks.bitcoin);
        } catch ( error ) { }

        this.setState({
            address: value,
            addressIsValid: typeof valid !== 'undefined',
        });
    }

    resetAddress() {
        this.setState({
            address: this.props.account.bitcoinCashAddress,
            addressIsValid: true
        });
    }

    toggleAdvanced(event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        this.setState({
            advanced: !this.state.advanced
        });
    }

    

    render(props) {

        const { accountId, advanced, address, addressIsValid, selectedFee, fee } = this.state;

        // no account is set in state yet, don't render anything...
        if(accountId < 0) return null;

        const account = props.account;

        // form values

        const accountSelect = props.accounts.map((account, index) => 
            <option value={index}>{ account.name } <span>{ satoshi2btc(account.balance) } BTC</span></option>
        );
        
        const feeSelect = props.fees.map((fee, index) => 
            <option value={index}>{ fee.name }</option>
        );

        //const inputs = getValidInputs(account.unspents);
        const amountToClaim = account.balance - fee; // TODO: calculate proper amount depending on split block
        const amountToClaimBTC = satoshi2btc(amountToClaim); 

        // css classNames and labels

        const advancedSettingsButtonClassName = `show-advanced-settings ${ advanced ? 'opened' : '' }`;
        const advancedSettingsButtonLabel = advanced ? 'Hide advanced settings' : 'Show advanced settings';
        const advancedSettingsClassName = `advanced-settings ${ advanced ? 'opened' : '' }`;
        //const formClassName = addressIsValid ? '' : 'not-valid';
        const amountHintClassName = `amount-hint ${ true ? 'warning' : '' }`;

        var formClassName = 'valid';
        var addressHint;
        if (!addressIsValid) {
            addressHint = 'Not a valid address';
            formClassName = 'not-valid';
        } else if(props.account.bitcoinCashAddress !== address){
            addressHint = 'Not a TREZOR account, please double check it!';
            formClassName = 'foreign-address';
        } else {
            addressHint = `Bitcoin Cash ${account.name} in TREZOR`;
        }

        // Success view
        //props.success
        // Error view
        //var errorMessage = props.error;

        /*
        Explorer address: https://bcc-bitcore2.trezor.io/
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
        Popup: 
        */

        
        
        return (
            <section className="component-send">
                <h3>Send Bitcoin Cash to your wallet</h3>
                
                <fieldset className={ formClassName }>
                    <p>
                        <label>Account</label>
                        <select value={ account.id } onChange={ () => { props.selectAccount(event.currentTarget.selectedIndex) } }>
                            { accountSelect }
                        </select>
                    </p>
                    <div className={ advancedSettingsButtonClassName }>
                        <a href="#" onClick={ () => { this.toggleAdvanced(event) } }>{ advancedSettingsButtonLabel }</a>
                    </div>
                    <div className={ advancedSettingsClassName }>
                        <p>
                            <label for="address">Address</label>
                            <span className="address-input">
                                <input id="address" type="text" value={ this.state.address } onInput={ () => { this.onAddressChange(event) } } />
                                <button onClick={ () => { this.resetAddress() } }>
                                    <span>Set TREZOR address</span>
                                </button>
                            </span>
                            <span className="address-hint">
                                { addressHint }
                            </span>
                        </p>
                        <p>
                            <label>Amount</label>
                            <input type="text" value={ amountToClaimBTC } disabled />
                            <span className={ amountHintClassName }>
                                You can claim 0.003 BCC.
                                <div className="amount-tooltip">
                                    If the number does not match your BTC account balance, then you probably received additional BTC after the chain-split.<br/>
                                    These cannot be claimed as BCC.
                                </div>
                            </span>
                        </p>
                        <p>
                            <label>Fee</label>
                            <select value={ selectedFee } onChange={ () => { this.changeFee(event) } }>
                                { feeSelect }
                            </select>
                            <span>{ satoshi2btc(fee) } BBC</span>
                        </p>
                    </div>
                    <button 
                        className="btn_primary"
                        onClick={ () => { props.send(account, amountToClaim) } }
                        disabled={ !addressIsValid }>Claim { amountToClaimBTC } BBC</button>
                </fieldset>
            </section>
        );
    }
}