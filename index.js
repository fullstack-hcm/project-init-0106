const express = require('express');
const app     = express();

const mongoose          = require('mongoose');
const bodyParser        = require('body-parser');
const expressSession    = require('express-session');
const { URI_MONGOOSE }  = require('./constanst');

const { ROUTER_USER } = require('./routers/user');

app.set('views', './views/');
app.set('view engine', 'ejs');

app.use(express.static('./public/'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({}));

app.use(expressSession({
    secret: 'MERN_STACK_0106 AAA',
    resave: false,
    saveUninitialized: true,
    cookie: { 
        maxAge: 300000   
    }
}));


/**
 * user router-level middleware
 */


app.get('/', (req, res) => {
    res.redirect('/user/login');
});

app.use('/user', ROUTER_USER);

mongoose.connect(URI_MONGOOSE);
mongoose.connection.once('open', () => {
    console.log(`mongo client connected`)
    app.listen(3000, () => console.log(`server started at port 3000`));
});