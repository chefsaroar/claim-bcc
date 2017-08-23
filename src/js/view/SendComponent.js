import { h, Component } from 'preact';
import bitcoinjs from 'bitcoinjs-lib';
import { satoshi2btc, getValidInputs, calculateFee, isBitcoinCashAccount } from '../utils/utils';
import Message from './MessageComponent';

const initalState = {
    accountId: -1,
    advanced: false,
    address: undefined,
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
        //if(props.account.id !== this.state.accountId) {
            this.setState({
                ...initalState,
                ...this.getAccountState(props, this.state)
            });
        //}
    }

    // set state values on init (constructor) or account change (componentWillReceiveProps)
    getAccountState(props, state) {

        // corner case:
        // after account selection availableBCH - fee <= 0 (fee Normal, which is set as default)
        // try to set fee as Low, recalculate fee and open advanced tab
        let fee = calculateFee(props.account.unspents.length, 1, props.fees[ state.selectedFee ].maxFee);
        let selectedFee = state.selectedFee;
        let advanced = state.advanced;
        if (props.account.availableBCH - fee <= 0){
            advanced = true;
            selectedFee = props.fees.length - 1;
            fee = calculateFee(props.account.unspents.length, 1, props.fees[ selectedFee ].maxFee);
        }

        let address = this.state.address;
        let addressIsValid = this.state.addressIsValid === undefined ? true : this.state.addressIsValid;
        if (props.useTrezorAccounts && (this.state.address === undefined || this.state.accountId !== props.account.id)) {
            address = props.bchAccounts[0].address;
            addressIsValid = true;
        }
        return {
            accountId: props.account.id,
            //address: props.account.bitcoinCashAddress,
            address: address,
            addressIsValid: addressIsValid,
            advanced: props.useTrezorAccounts ? advanced : true,
            selectedFee: selectedFee,
            fee: fee,
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
            address: this.props.bchAccounts.length > 0 ? this.props.bchAccounts[0].address : this.props.accounts[0].bitcoinCashAddress,
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

        const { account, bchAccounts, usedBchAccounts, useTrezorAccounts, success, error } = props;

        // form values

        const accountSelect = props.accounts.map((account, index) => 
            <option value={index}>{ account.name }  / { satoshi2btc(account.balance) } BCH</option>
        );
        
        const feeSelect = props.fees.map((fee, index) => 
            <option value={index}>{ fee.name }</option>
        );

        const amountToClaim = account.availableBCH - fee;
        var amountToClaimBTC = satoshi2btc(amountToClaim); 

        // css classNames and labels

        const advancedSettingsButtonClassName = `show-advanced-settings ${ advanced ? 'opened' : '' }`;
        const advancedSettingsButtonLabel = advanced ? 'Hide advanced settings' : 'Show advanced settings';
        const advancedSettingsClassName = `advanced-settings ${ advanced ? 'opened' : '' }`;
        const amountHintClassName = `amount-hint ${ (account.balance !== account.availableBCH) ? 'warning' : '' }`;

        // target address validation
        var formClassName = useTrezorAccounts ? 'valid' : 'not-bch-account';
        var addressHint;
        if (!addressIsValid) {
            addressHint = 'Not a valid address';
            formClassName = useTrezorAccounts ? 'not-valid' : 'not-valid not-bch-account';
        } else if (useTrezorAccounts) {
            if (!isBitcoinCashAccount(bchAccounts, usedBchAccounts, address)) {
                addressHint = 'Not a TREZOR account, please double check it!';
                formClassName = 'foreign-address';
            } else {
                addressHint = `Bcash Account in TREZOR`;
                formClassName = 'valid';
                //addressHint = `Bcash Account #${ (props.accounts.length - bchAccounts.length + 1)} in TREZOR`;
                //addressHint = `Bcash ${account.name} in TREZOR`;
            }
        } else {
            formClassName = `not-bch-account ${ address === '' || address === undefined ? 'empty' : ''}`;
        }

        // disable form if amount <= 0 or availableBCH == 0
        var emptyAccountHint = "You don't have enought funds in your account.";
        if (account.availableBCH === 0) {
            formClassName = 'disabled';
            if(success) {
                emptyAccountHint = "You have already claimed.";
            }else if (account.balance === 0) {
                formClassName = 'disabled warning';
                emptyAccountHint = "You don't have enough funds in your account.";
            } else {
                formClassName = 'disabled warning not-empty';
                emptyAccountHint = "Your BTC was received after the chain-split.";
            }
        }

        var claimButtonLabel = `Claim ${ amountToClaimBTC } BCH`;
        var amoutIsValid = true;
        if(amountToClaim < 0){
            amoutIsValid = false;
            amountToClaimBTC = 0;
            claimButtonLabel = "Amount is too low!";
            formClassName += ' low-amount';
        }
        
        return (
            <section className="component-send">
                <h3>Claim your Bitcoin Cash (Bcash)</h3>

                <Message 
                    header="Failed to send transaction."
                    success={ success } 
                    error={ error }
                    hideError={ props.hideError } />

                <fieldset className={ formClassName }>
                    <p>
                        <label>Account</label>
                        <select 
                            value={ account.id } 
                            onChange={ event => props.selectAccount(event.currentTarget.selectedIndex) }>
                            { accountSelect }
                        </select>
                    </p>
                    <div className={ advancedSettingsButtonClassName }>
                        <a href="#" onClick={ event => this.toggleAdvanced(event) }>{ advancedSettingsButtonLabel }</a>
                    </div>
                    <div className={ advancedSettingsClassName }>
                        <p>
                            <label className="targetAddressLabel" for="address">Target Address</label>
                            <span className="address-input">
                                <input id="address" type="text" placeholder="Please make sure it's a BCH address!" value={ this.state.address } onInput={ event => this.onAddressChange(event) } />
                                <button onClick={ () => this.resetAddress() }>
                                    <span>Set address from TREZOR</span>
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
                                You can claim { satoshi2btc(account.availableBCH) } BCH
                                <div className="amount-tooltip">
                                    Due to the transaction size limitations, you cannot claim all your BCH at once.<br/>
                                    After this transaction, please run the tool again to claim the rest.
                                </div>
                            </span>
                        </p>
                        <p>
                            <label>Fee</label>
                            <select value={ selectedFee } onChange={ event => this.changeFee(event) }>
                                { feeSelect }
                            </select>
                            <span>{ satoshi2btc(fee) } BCH</span>
                        </p>
                    </div>
                    <p className="claim-button">
                        <button 
                            onClick={ () => props.send(account, this.state.address, amountToClaim) }
                            disabled={ !addressIsValid || !amoutIsValid || address === undefined }>{ claimButtonLabel }</button>
                        <span>Your funds will be deposed in TREZOR Bcash {account.name}</span>
                    </p>
                    <div className="empty-account">
                        <p>
                            { emptyAccountHint }
                        </p>
                    </div>
                </fieldset>
            </section>
        );
    }
}
