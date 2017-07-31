import { h, Component } from 'preact';

export default class MessageComponent extends Component {
    render(props) {

        if(!props.error && !props.success) return null;

        if(this.props.error){
            return (
                <article className="error">
                    <button onClick={ () => props.hideError() }>×</button>
                    <h4>{ props.header }</h4>
                    <p>
                        Error details: <span>{ props.error }</span>
                    </p>
                </article>
            );
        }else{
            let url = `https://bch-bitcore2.trezor.io/tx/${props.success.hashHex}`;
            return (
                <article>
                    <h4>Transaction was successfully sent.</h4>
                    <p>
                        <a href={ url } target="_blank">Check transaction details</a>
                    </p>
                </article>
            );
        }
    }
}