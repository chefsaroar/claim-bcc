import { h, Component } from 'preact';
import Message from './MessageComponent';

export default class HomeComponent extends Component {
    render(props) {
        let buttonClassName = props.block === undefined || props.block === null ? 'hidden' : '';
        let buttonLabel = props.block ? 'Connect with TREZOR' : 'This feature will be available after fork (~13:20 UTC)';
        return (
            <section className="component-home">
                <h3>Claim your Bitcoin Cash (Bcash)</h3>
                <Message
                    header="Reading of accounts failed."
                    error={ props.error }
                    hideError={ props.hideError } />
                <fieldset>
                    <p>This tool allows you to claim your Bitcoin Cash/Bcash (BCH) from your TREZOR Wallet, assuming you had bitcoins (BTC) on your TREZOR before August 1st.</p>
                    <p>BTC and BCH are completely independent and separate currencies. A transaction sent on one chain will not affect the other one. This applies to this claim tool too; your BTC will not be affected.</p>
                    <p>Please <a href="https://blog.trezor.io/claim-bcash-bitcoin-cash-bch-bcc-trezor-wallet-f0a810d5864a">read this guide</a> for more details how to claim your BCH. Refer to the same guide for FAQ about BCH.</p>
                    <div>
                        <button className={ buttonClassName } onClick={ () => { props.click() } } disabled={ !props.block }>{ buttonLabel }</button>
                    </div>
                </fieldset>
            </section>
        );
    }
}