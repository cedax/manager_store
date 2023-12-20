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
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

app.use(express.static(__dirname + '/public'));

app.use(expressLayouts)
//app.set('layout', './layouts/shared')
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'));

mongoose.connect(process.env.MONGODB_STRING_CONN, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

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

const dashboardRoutes = require('./routes/dashboard');
app.use('/dashboard', dashboardRoutes);

app.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect('/dashboard');
    } else {
        res.redirect('/login');
    }
});

app.get('/logout', (req, res) => {
    req.logout(function (err) {
        if (err) { return next(err); }
        res.redirect('/');
    });
});

app.get('/forgot-pass', (req, res) => {
    res.render('forgot-pass', { title: 'Olvido contraseña', layout: './layouts/auth', req })
});

app.get('/reset-pass-recovery', (req, res) => {
    res.render('reset-pass', { title: 'Olvido contraseña', layout: './layouts/auth', req })
});

app.post('/forgot-pass', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email: email }).exec();

        if (user) {
            const token = user.generateAuthToken();
            
            const transporter = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: 'sedax.contact@gmail.com',
                    pass: 'itdldpbvhwqjcvsb'
                }
            });

            try {
                const mailOptions = {
                    from: 'sedax.contact@gmail.com',
                    to: email,
                    subject: 'Reseteo de contraseña - No responder',
                    text: 'Token para restablecer tu contraseña: ' + token
                };

                // Envía el correo
                transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        console.error('Error al enviar el correo:', error);
                        res.status(500).json({ error: 'Error al enviar el correo' });
                    } else {
                        console.log('Correo enviado: ' + info.response);
                    }
                });
            } catch (error) {
                console.error(error);
            }

            const link = `/reset-pass-recovery`;
            res.redirect(link);
        } else {
            res.redirect('/forgot-pass/?error=1');
        }
    } catch (err) {
        console.error(err);
        res.redirect('/forgot-pass/?error=2');
    }
});

function verifyToken(token) {
    try {
        // Verificar la validez del token utilizando la misma clave secreta
        const decoded = jwt.verify(token, 'your-secret-key');
        return decoded;
    } catch (err) {
        // Si hay un error, el token no es válido
        return null;
    }
}

app.post('/reset-pass', async (req, res) => {
    try {
        const { token, password, passwordConfirm } = req.body;
        if (password !== passwordConfirm) {
            return res.redirect('/reset-pass-recovery/?error=1');
        }

        // Verificar si el token es válido
        const decodedToken = verifyToken(token);

        if (decodedToken) {
            // Token válido, puedes procesar la solicitud
            const userId = decodedToken._id;
            
            try {
                const user = await User.findById(userId).exec();
                
                if (user) {
                    const isTokenValid = user.isAuthTokenValid(token);

                    if (!isTokenValid) {
                        return res.redirect('/reset-pass-recovery/?error=5');
                    }

                    user.setPassword(password, async () => {
                        await user.save();
                        await user.invalidateAuthToken(token);
                        res.redirect('/login/?exit=1');
                    });
                } else {
                    res.redirect('/reset-pass-recovery/?error=3');
                }
            } catch (err) {
                console.error(err);
                res.redirect('/reset-pass-recovery/?error=2');
            }
        } else {
            res.redirect('/reset-pass-recovery/?error=4');
        }
    } catch (err) {
        console.error(err);
        res.redirect('/forgot-pass-recovery/?error=2');
    }
});

// Iniciar el servidor
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Servidor Express en ejecución en el puerto ${port}`);
});