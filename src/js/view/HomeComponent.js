import { h, Component } from 'preact';
import Message from './MessageComponent';

export default class HomeComponent extends Component {
    render(props) {
        let buttonClassName = props.block === undefined || props.block === null ? 'hidden' : '';
        let buttonLabel = props.block ? 'Connect with TREZOR' : 'This feature will be available after fork (~13:20 UTC)';
        return (
            <section className="component-home">
                <h3>Claim your Bcash</h3>
                <Message
                    header="Reading of accounts failed."
                    error={ props.error }
                    hideError={ props.hideError } />
                <fieldset>
                    <p>On August 1st, a group of users and some businesses have implemented a non-compatible upgrade to the network, raising the blocksize limit to 8MB and removing Segregated Witness. As this upgrade does not have a wide backing of the network, this “hard fork” has split the Bitcoin network in two. As a result, we are left with the Bitcoin with activated SegWit (through BIP91/BIP141) and its clone, dubbed Bcash.</p>
                    <p>As this is a chain-split, Bcash shares its entire transaction history with Bitcoin up until the point of the split, with the history diverging after the split. This means that for whatever amount of bitcoins you had before the split, you now have that same amount of Bcash.</p>
                    <p>Bitcoin and Bcash have essentially become two separate currencies, independent of each other. Continue with this process to securely claim your Bcash.</p>
                    <div>
                        <button className={ buttonClassName } onClick={ () => { props.click() } } disabled={ !props.block }>{ buttonLabel }</button>
                    </div>
                </fieldset>
            </section>
        );
    }
}