import path from 'path';

export const ABSOLUTE_BASE = path.normalize(path.join(__dirname, '..'));

const constants = Object.freeze({
    BUILD: path.join(ABSOLUTE_BASE, 'build/'),
    SRC: path.join(ABSOLUTE_BASE, 'src/'),
    PORT: 8081,
    INDEX: path.join(ABSOLUTE_BASE, 'src/index.html')
});

export const LIB_NAME = 'TrezorConnect';
export const BUILD = constants.BUILD;
export const SRC = constants.SRC;
export const PORT = constants.PORT;
export const INDEX = constants.INDEX;

export default constants;