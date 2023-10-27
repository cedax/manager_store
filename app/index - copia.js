const express = require('express');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const expressLayouts = require('express-ejs-layouts')

const app = express();

app.use(express.static(__dirname + '/public'));

app.use(expressLayouts)
app.set('layout', './layouts/shared')
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'));

// Conecta a tu base de datos (asegúrate de tener Mongoose configurado)
mongoose.connect('mongodb+srv://Sedax:GmjZR5o3erWOkhk4@modpruebas.ixwaq5z.mongodb.net/', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Configura el middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: 'fOcaFUUEGXvqCImkmdnQnOZXdBOs514p', // Cambia esta clave secreta por una segura
    resave: false,
    saveUninitialized: false,
  })
)

// Define un modelo de usuario (utiliza Mongoose)
const User = require('./models/user'); // Debes definir tu propio modelo de usuario

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(passport.initialize());
app.use(passport.session());

// Rutas públicas
const loginRoutes = require('./routes/login');
app.use('/', loginRoutes);

app.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    // Si el usuario está autenticado, muestra un botón para ir al dashboard
    res.send(`
      <h1>Inicio de sesión con Passport</h1>
      <a href="/dashboard">Ir al Dashboard</a>
      <br>
      <a href="/logout">Cerrar sesión</a>
    `);
  } else {
    // Si el usuario no está autenticado, muestra un enlace para iniciar sesión
    res.send(`
      <h1>Inicio de sesión con Passport</h1>
      <a href="/login">Iniciar sesión</a>
    `);
  }
});

// Ruta de inicio de sesión
app.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err); // Error interno del servidor
    }
    if (!user) {
      // Autenticación fallida, redirige a la página de inicio de sesión con un mensaje de error
      return res.redirect('login/?error=1'); // Puedes usar un parámetro en la URL para indicar el error
    }
    // Autenticación exitosa, redirige al dashboard
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      return res.redirect('/dashboard');
    });
  })(req, res, next);
});


// Rutas protegidas
app.get('/dashboard', isLoggedIn, (req, res) => {
  res.render('dashboard', { title: 'Dashboard', layout: './layouts/shared', req })
});

// Middleware de autenticación
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
}

// Iniciar el servidor
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor Express en ejecución en el puerto ${port}`);
});

// Ruta para mostrar el formulario de registro
app.get('/register', (req, res) => {
  if (req.isAuthenticated()) {
    res.redirect('/');
  } else {
    res.render('register'); // Puedes crear una vista 'register.ejs' para el formulario de registro
  }
});

// Ruta para procesar el formulario de registro
app.post('/register', (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  User.register(new User({ username: username }), password, (err, user) => {
    if (err) {
      console.error(err);
      return res.redirect('/register'); // Redirige de nuevo al formulario de registro en caso de error
    }
    passport.authenticate('local')(req, res, () => {
      res.redirect('/dashboard'); // Redirige al usuario a su panel de control o página de inicio de sesión
    });
  });
});

app.get('/logout', (req, res) => {
  req.logout(function (err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});