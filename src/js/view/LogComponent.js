import { h, Component } from 'preact';

export default class DebugComponent extends Component {

    constructor(props) {
        super(props);
        this.state = {
            log: []
        };

        const c = global.console;
        const orig = {
            error: c.error,
            warn: c.warn,
            info: c.info,
            debug: c.debug,
            log: c.log
        };

        const createMethod = (method, level) => {
            return (...args) => {
                var time = new Date().toUTCString();
                let log = this.state.log;
                log.push([level, time].concat(args));
                this.setState({
                    log: log
                })
                return method.apply(c, args);
            }
        }

        for (let level in orig) {
            if (orig.hasOwnProperty(level)) {
                c[level] = createMethod(orig[level], level);
            }
        }

        console.log("init");
    }

    render(props) {

        if (!props.displayed) return null;

        let L = this.state.log.map(log => {
            let logError = log.map(k => k instanceof Error ? k.toString() : k);
            let str;
            try {
                str = JSON.stringify(logError);
            } catch (e) {
                str = logError.toString();
            }
            return str;
        }).join('\n');

        return (
            <section className="component-home">
                <article className="log">
                    <button onClick={ () => props.hideLog() }>×</button>
                    <h4>Log</h4>
                    <textarea onFocus={ event => { event.target.select() } }>{ L }</textarea>
                </article>
            </section>
        );
    }
}