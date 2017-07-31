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
            let url = `https://bcc-bitcore2.trezor.io/tx/?__TODO=${props.success.hashHex}`;
            return (
                <article>
                    <p>
                        Transaction <a href={ url } target="_blank">{ props.success.hashHex }</a> was successfully sent.
                    </p>
                </article>
            );
        }
    }
}