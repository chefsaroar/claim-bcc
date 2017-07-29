import { h, Component } from 'preact';

export default class HomeComponent extends Component {
    render(props) {
        return (
            <section className="component-home">
                <h1>Claim your Bitcoin Cash</h1>
                <p>On August 1st, a group of users and some businesses have implemented a non-compatible upgrade to the network, raising the blocksize limit to 8MB and removing Segregated Witness. As this upgrade does not have a wide backing of the network, this “hard fork” has split the Bitcoin network in two. As a result, we are left with the Bitcoin with activated SegWit (through BIP91/BIP141) and its clone, dubbed Bitcoin Cash.</p>
                <p>As this is a chain-split, Bitcoin Cash shares its entire transaction history with Bitcoin up until the point of the split, with the history diverging after the split. This means that for whatever amount of bitcoins you had before the split, you now have that same amount of Bitcoin Cash.</p>
                <p>Bitcoin and Bitcoin Cash have essentially become two separate currencies, independent of each other. Continue with this process to securely claim your Bitcoin Cash.</p>
                <div>
                    <button className="btn_primary" onClick={ () => { props.click() } } disabled={ !props.block }>Connect with TREZOR</button>
                </div>
            </section>
        );
    }
}