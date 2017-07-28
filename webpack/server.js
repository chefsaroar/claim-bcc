import express from 'express';
import webpack from 'webpack';
import open from 'open';

import { SRC, PORT, INDEX, ABSOLUTE_BASE } from './constants';
import config from './webpack.config.dev';

const app = express();
const compiler = webpack(config);

app.use(require('webpack-dev-middleware')(compiler, {
    contentBase: '/',
    hot: true,
    inline: true,
    compress: true,
    noInfo: false,
    stats: { colors: true }
}));
app.use(require('webpack-hot-middleware')(compiler));

app.get('*', function(req, res) {
    // console.log("SEND", req.url)
    // if(req.url === '/config.json'){

    // }
    //res.sendFile(INDEX);
    res.sendFile(ABSOLUTE_BASE + '/src' + req.url);
});

app.listen(PORT, 'localhost', function(err) {
    if (err) {
        console.log(err);
        return;
    }
    open(`http://localhost:${PORT}/`);
    console.log(`Listening at http://localhost:${PORT}`);
    console.log(`Serving ${INDEX}`);
});