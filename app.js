const mongoose = require('mongoose');
const express = require('express');
const path = require('path');
const session = require('express-session');
const app = express();

const movieConnection = mongoose.createConnection('mongodb://localhost:27017/MovieDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  directConnection: true
});
movieConnection.on('connected', () => {
  console.log('Conexión a MovieDB exitosa');
});
movieConnection.on('error', (err) => {
  console.log('Error de conexión en MovieDB: ', err);
});

const userConnection = mongoose.createConnection('mongodb://localhost:27017/UserDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  directConnection: true
});
userConnection.on('connected', () => {
  console.log('Conexión a UserDB exitosa');
});
userConnection.on('error', (err) => {
  console.log('Error de conexión en UserDB: ', err);
});

const Movie = require('./models/movie')(movieConnection);
const User = require('./models/user')(userConnection);

/*async function createAdminUser() {
  try {
    const existingAdmin = await User.findOne({ Username: 'Admin' });
    if (!existingAdmin) {
      const getNextSequence = require('./models/id_user')(userConnection);
      const newId = await getNextSequence('userId');
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('Contra1234', 10);

      const adminUser = new User({
        Id_user: newId,
        Username: 'Admin',
        Password: hashedPassword
      });
      await adminUser.save();
      console.log('Usuario Admin creado exitosamente.');
    } else {
      console.log('El usuario Admin ya existe.');
    }
  } catch (error) {
    console.error('Error creando usuario Admin:', error);
  }
}*/

//createAdminUser();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'Tangamandapio',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 120 } // 2 hora
}));

// El usuario en todas las vistas
app.use((req, res, next) => {
  res.locals.usuario = req.session.usuario || null;
  next();
});

const routes = require('./routes/routes')(Movie, User, userConnection);
app.use('/', routes);

const PORT = 8080, IP = 'localhost';
app.listen(PORT, IP, () => console.log(`http://${IP}:${PORT}`));
