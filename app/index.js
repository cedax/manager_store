const express = require('express');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const expressLayouts = require('express-ejs-layouts')
const app = express();
require('dotenv').config();

app.use(express.static(__dirname + '/public'));

app.use(expressLayouts)
app.set('layout', './layouts/shared')
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'));

// Conecta a tu base de datos (asegúrate de tener Mongoose configurado)
mongoose.connect(process.env.MONGODB_STRING_CONN, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Middlewares
const {isLoggedIn} = require('./middlewares/authentication');

app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SECRET_SESSION_KEY,
    resave: false,
    saveUninitialized: false,
  })
);

// Modelos
const User = require('./models/user');

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(passport.initialize());
app.use(passport.session());

// Rutas públicas
const loginRoutes = require('./routes/login');
app.use('/', loginRoutes);

const registerRoutes = require('./routes/register');
app.use('/', registerRoutes);

app.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    res.redirect('/dashboard');
  } else {
    res.redirect('/login');
  }
});

app.get('/dashboard', isLoggedIn, (req, res) => {
  res.render('dashboard', { title: 'Dashboard', layout: './layouts/shared', req })
});

app.get('/logout', (req, res) => {
  req.logout(function (err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

// Iniciar el servidor
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor Express en ejecución en el puerto ${port}`);
});