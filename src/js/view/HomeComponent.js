import { h, Component } from 'preact';
import Message from './MessageComponent';
import SelectComponent from './SelectComponent';


const initalState = {
    originAccount: null,
    destinationAccount: null,
    destinationOptions: null
};

const accounts = [
    { id: "btc1", name: "Bitcoin (1-address)", simpleName: "Bitcoin", short: "BTC", txType: "Bitcoin", bip44: [44, 0], addressVersion: 0, bitcore: ['https://btc-bitcore1.trezor.io/', 'https://btc-bitcore3.trezor.io/'] },
    { id: "btc3", name: "Bitcoin (3-address)", simpleName: "Bitcoin", short: "BTC", txType: "Bitcoin", bip44: [49, 0], addressVersion: 5, bitcore: ['https://btc-bitcore1.trezor.io/', 'https://btc-bitcore3.trezor.io/'] },
    { id: "btcM", name: "Bitcoin (M-address)", simpleName: "Bitcoin", short: "BTC", txType: "Bitcoin", bip44: [49, 0], addressVersion: 5, bitcore: ['https://btc-bitcore1.trezor.io/', 'https://btc-bitcore3.trezor.io/'] },
    { id: "bch1", name: "Bitcoin Cash (1-address)", simpleName: "Bitcoin Cash", short: "BCH", txType: "Bcash", bip44: [44, 145], addressVersion: 0, bitcore: ['https://bch-bitcore2.trezor.io/'] },
    { id: "ltc3", name: "Litecoin (3-address)", simpleName: "Litecoin", short: "LTC", txType: "Litecoin", bip44: [49, 2], addressVersion: 50, bitcore: ['https://ltc-bitcore1.trezor.io/', 'https://ltc-bitcore3.trezor.io/'] }
];

const fromAccounts = [
    accounts[1],
    accounts[3],
    accounts[4]
]

const claimable = {
    "btc1": [
        { id: "bch1" },
        { id: "ltc3" },
    ],
    "btc3": [
        { id: "bch1" },
        { id: "ltc3"},
    ],
    "bch1": [
        { id: "btc1" },
        { id: "btc3", possible: false },
        { id: "ltc3", possible: false }
    ],
    "ltc3": [
        { id: "btc3" },
        { id: "btcM" }
    ]
}

const findAccountById = (id) => {
    for (let item of accounts) {
        if(item.id === id) return item;
    }
}

const findClaimableById = (id) => {
    for (let item in claimable) {
        if (item === id) {
            let destinationAccounts = [];
            for (let account of claimable[item]) {
                const destination = findAccountById(account.id);
                if (account.possible === false) {
                    destination.possible = false;
                } else {
                    delete destination.possible;
                }
                destinationAccounts.push(destination)
            }
            return destinationAccounts;
        }
    }
}

export default class HomeComponent extends Component {

    constructor(props) {
        super(props);
        this.state = {
            ...initalState
        };
        this.selectAccount("origin", fromAccounts[2]);
    }

    selectAccount(type, account) {
        if (type === "origin") {
            const claimable = findClaimableById(account.id);
            this.setState({
                originAccount: account,
                destinationAccount: claimable[0],
                destinationOptions: claimable
            });
        } else {
            this.setState({
                destinationAccount: account,
            });
        }
    }

    render(props) {

        const { originAccount, destinationAccount, destinationOptions } = this.state;

        let button = (<button onClick={ () => { props.click(originAccount, destinationAccount) } } disabled={ !props.block }>Start recovering</button>);
        let warning = null;
        if (destinationAccount.possible === false) {
            button = true;
            warning = (
                <div className="warning">
                    Unfortunately, it is not possible to recover { originAccount.name } from { destinationAccount.name } address.<br/>
                    Segwit is not activated on the Bitcoin Cash network, and hence the coins cannot be spent securely.
                </div>
            )
        }

        return (
            <section className="component-home">
                <h3>Recover your coins sent to a wrong address type</h3>
                <Message
                    header="Reading of accounts failed."
                    error={ props.error }
                    hideError={ props.hideError } />
                <fieldset>
                    
                    <p className="nl-form">
                        <span>I have accidentally sent coins from a</span>
                        <SelectComponent 
                            type="origin"
                            useName="simpleName"
                            selected={ originAccount }
                            options= { fromAccounts }
                            onSelect={ this.selectAccount.bind(this) }
                            />
                        <span>account to a</span>
                        <SelectComponent 
                            type="destination"
                            selected={ destinationAccount }
                            options= { destinationOptions }
                            onSelect={ this.selectAccount.bind(this) }
                            />
                        <span>in my TREZOR.</span>
                    </p>
                    {/* <p>This tool can help you recover your coins which were sent to wrong addresses generated by your TREZOR.</p> */}
                    <div className="button-wrapper">
                        { warning }
                        { button }
                    </div>
                </fieldset>
            </section>
        );
    }
}