import { h, render as PreactRender } from 'preact';
import App from './view/App';
import styles from  '../styles/index.less';

let container = document.getElementById('app');
PreactRender(<App />, container, container.lastChild);