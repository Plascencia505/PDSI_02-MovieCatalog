const express = require('express');
const { body, validationResult } = require('express-validator');
const he = require('he');
const mongoose = require('mongoose');

module.exports = (Movie, User, userConnection) => {
    const router = express.Router();
    const getNextSequence = require('../models/id_user')(userConnection);
    const bcrypt = require('bcrypt');

    // Login
    router.get('/login', (req, res) => {
        res.render('login', { error: null });
    });

    router.post('/register', [
        body('username')
        .trim().escape().notEmpty().withMessage('Nombre requerido')
        .isLength({ max: 30 }).withMessage('Máximo 30 caracteres')
        .matches(/^[a-zA-Z0-9_]+$/).withMessage('Solo letras, números y guiones bajos permitidos'),

        body('password')
        .notEmpty().withMessage('Contraseña requerida')
        .isLength({ min: 8, max: 16 }).withMessage('Debe tener entre 8 y 16 caractéres')
    ], async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.render('login', { error: errors.array()[0].msg });
        }

        const { username, password } = req.body;
        try {
            const existingUser = await User.findOne({ Username: username });
            if (existingUser) {
                return res.render('login', { error: 'Nombre de usuario ya registrado.' });
            }

            const newId = await getNextSequence('userId');
            const hashedPassword = await bcrypt.hash(password, 10);

            const newUser = new User({
                Id_user: newId,
                Username: username,
                Password: hashedPassword
            });
            await newUser.save();
            console.log('Usuario registrado correctamente');
            res.redirect('/login?registrado=1');
        } catch (err) {
            console.error('Error en register:', err);
            res.render('login', { error: 'Error al crear usuario.' });
        }
    });

    router.post('/login', [
        body('username')
        .trim().escape().notEmpty().withMessage('Nombre requerido')
        .isLength({ max: 30 }).withMessage('Máximo 30 caracteres')
        .matches(/^[a-zA-Z0-9_]+$/).withMessage('Solo letras, números y guiones bajos permitidos'),

        body('password')
        .notEmpty().withMessage('Contraseña requerida')
        .isLength({ min: 8, max: 16 }).withMessage('Debe tener entre 8 y 16 caractéres')
    ], async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.render('login', { error: 'Usuario o contraseña inválidos.' });
        }

        const { username, password } = req.body;
        try {
            const user = await User.findOne({ Username: username });
            if (!user) {
                return res.render('login', { error: 'Usuario o contraseña incorrectos.' });
            }
            const validPassword = await bcrypt.compare(password, user.Password);
            if (!validPassword) {
                return res.render('login', { error: 'Usuario o contraseña incorrectos.' });
            }

            req.session.usuario = {
                Id_user: user.Id_user,
                Username: user.Username
            };
            res.redirect('/');
        } catch (err) {
            console.error('Error en login:', err);
            res.render('login', { error: 'Error en el login.' });
        }
    });

    router.get('/logout', (req, res) => {
        req.session.destroy(err => {
            if (err) {
                console.error(err);
                return res.redirect('/');
            }
            res.locals.usuario = null;
            res.redirect('/');
        });
    });

    // Agregar película
    router.get('/agregar', (req, res) => {
        if (!req.session.usuario) {
          return res.redirect('/login');
        }  
        res.render('agregar', {...{username: req.session.usuario.Username}, ...{ error: null }}); 
    });

    router.post('/agregar', [
        body('Titulo').trim().notEmpty().withMessage('Título requerido').escape(),
        body('Sinopsis').trim().notEmpty().withMessage('Sinopsis requerida').escape(),
        body('Actores').trim().notEmpty().withMessage('Actores requeridos'),
        body('Anio').isInt({ min: 1888, max: 2100 }).withMessage('Año no válido'),
        body('Categoria').notEmpty().withMessage('Categoría requerida'),
        body('Imagen').trim().escape()
    ], async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).render('agregar', {
                error: errors.array()[0].msg,
                username: req.session.usuario.Username
            });
        }
        if (!req.session.usuario) {
            return res.status(401).render('agregar', {
                error: 'Debes iniciar sesión para agregar una película.',
                username: null
            });
        }
    
        let { Titulo, Sinopsis, Actores, Anio, Categoria, Imagen } = req.body;
        let actoresArray = Actores.split(',').map(actor => he.escape(actor.trim())).filter(Boolean);
        let categoriasArray = Array.isArray(Categoria) ? Categoria.map(cat => he.escape(cat.trim())) : [he.escape(Categoria.trim())];
        
        try {
            Imagen = Imagen.replace(/\.(jpg|jpeg|png|gif)$/i, '');
            const nuevaPelicula = new Movie({
                Titulo,
                Sinopsis,
                Actores: actoresArray,
                Anio,
                Categoria: categoriasArray,
                Imagen: `src/img/${Imagen}.jpg`,
                Id_creador: req.session.usuario.Id_user
            });
    
            await nuevaPelicula.save();
            res.redirect('/agregar?agregada=1');
        } catch (err) {
            console.error('Error al crear película:', err);
            res.status(500).render('agregar', {
                error: 'Error al guardar la película.',
                username: req.session.usuario.Username
            });
        }
    });    

    // Editar película
    router.get('/editar', async (req, res) =>{
        if (!req.session.usuario) {
            return res.redirect('/login');
        }
        return res.status(400).render('error', {
            error: 'No se puede editar la película.'
        });
    });// en caso de que borren el id

    router.get('/editar/:id', async (req, res) => {
        if (!req.session.usuario) {
            return res.redirect('/login');
        }
    
        const { id } = req.params;
    
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).render('error', {
                error: 'Película no encontrada.',
            });
        }
    
        try {
            const movie = await Movie.findById(id);
            if (!movie) {
                return res.status(404).render('error', {
                    error: 'Película no encontrada.',
                });
            }
    
            const userId = req.session.usuario.Id_user;
            if (userId !== 1 && userId !== movie.Id_creador) {
                return res.status(403).send('No tienes permiso para editar esta película.');
            }
    
            res.render('editar', {
                username: req.session.usuario.Username,
                error: null,
                movie: movie
            });
        } catch (err) {
            console.error('Error al cargar película para editar:', err);
            res.status(500).send('Error al cargar la película.');
        }
    });

    router.post('/editar', [
        body('Id').trim().notEmpty().withMessage('ID requerido'),
        body('Titulo').trim().escape().notEmpty().withMessage('Título requerido'),
        body('Sinopsis').trim().escape().notEmpty().withMessage('Sinopsis requerida'),
        body('Actores').trim().notEmpty().withMessage('Actores requeridos'),
        body('Anio').isInt({ min: 1888, max: 2100 }).withMessage('Año no válido'),
        body('Categoria').notEmpty().withMessage('Categoría requerida'),
        body('Imagen').trim().escape()
    ], async (req, res) => {
    
        if (!req.session.usuario) {
            return res.status(401).render('editar', {
                error: 'Debes iniciar sesión para editar una película.',
                username: 'Invitado',
                movie: req.body
            });
        }
    
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).render('editar', {
                error: errors.array()[0].msg,
                username: req.session.usuario.Username,
                movie: req.body
            });
        }
    
        let { Id, Titulo, Sinopsis, Actores, Anio, Categoria, Imagen } = req.body;
    
        if (!mongoose.Types.ObjectId.isValid(Id)) {
            return res.status(400).render('editar', {
                error: 'ID de película no válido.',
                username: req.session.usuario.Username,
                movie: req.body
            });
        }

        let actoresArray = Actores.split(',').map(actor => he.escape(actor.trim())).filter(Boolean);
        let categoriasArray = Array.isArray(Categoria) ? Categoria.map(cat => he.escape(cat.trim())) : [he.escape(Categoria.trim())];

        try {
            const movie = await Movie.findById(Id);
            if (!movie) {
                return res.status(404).render('editar', {
                    error: 'Película no encontrada.',
                    username: req.session.usuario.Username,
                    movie: req.body
                });
            }
    
            const userId = req.session.usuario.Id_user;
            if (userId !== 1 && userId !== movie.Id_creador) {
                return res.status(403).render('editar', {
                    error: 'No tienes permiso para editar esta película.',
                    username: req.session.usuario.Username,
                    movie: req.body
                });
            }
    
            movie.Titulo = Titulo;
            movie.Sinopsis = Sinopsis;
            movie.Actores = actoresArray;
            movie.Anio = Anio;
            movie.Categoria = categoriasArray;
            Imagen = Imagen.replace(/\.(jpg|jpeg|png|gif)$/i, '').replace(' ','_');
            movie.Imagen = `src/img/${Imagen}.jpg`;
    
            await movie.save();
            res.redirect('/?editada=1');
        } catch (err) {
            console.error('Error al editar película:', err);
            res.status(500).render('editar', {
                error: 'Error interno al editar la película.',
                username: req.session.usuario.Username,
                movie: req.body
            });
        }
    });
    
    // Eliminar película
    router.post('/eliminar', [
        body('Id').trim().notEmpty().withMessage('ID requerido')
    ], async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).send(errors.array()[0].msg);
        }

        const { Id } = req.body;

        if (!mongoose.Types.ObjectId.isValid(Id)) {
            res.redirect('/?error=notFound');
        }

        try {
            const movie = await Movie.findById(Id);
            if (!movie) {
                res.redirect('/?error=notFound');
            }

            const userId = req.session.usuario.Id_user;
            if (userId !== 1 && userId !== movie.Id_creador) {
                return res.status(403).send('No tienes permiso para eliminar esta película');
            }

            await Movie.deleteOne({ _id: Id });
            res.redirect('/?eliminada=1');
        } catch (err) {
            console.error('Error al eliminar película:', err);
            res.redirect('/?error=1');
        }
    });

    // Buscar en películas
    router.get('/buscar', async (req, res) => {
        const query = req.query.q?.trim();
    
        if (!query) {
            return res.redirect('/');
        }
    
        try {
            let escapeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            const regex = new RegExp(escapeQuery, 'i'); // búsqueda insensible a mayúsculas
    
            const condiciones = [
                { Titulo: regex },
                { Actores: { $regex: regex } },
                { Categoria: { $regex: regex } },
                { Sinopsis: regex }
            ];

            if (!isNaN(query)) {
                condiciones.push({ Anio: Number(query) });
            }
            
            const resultados = await Movie.find({ $or: condiciones });
    
            res.render('index', {
                movies: resultados,
                user: req.session.usuario,
                searchQuery: query
            });
        } catch (err) {
            console.error('Error en búsqueda:', err);
            res.status(500).send('Error en búsqueda');
        }
    });

    // Página principal
    router.get('/', async (req, res) => {
        try {
            const movies = await Movie.find();
            res.render('index', {
                movies,
                user: req.session.usuario || null,
                searchQuery: null
            });
        } catch (err) {
            console.error('Error al obtener películas:', err);
            res.status(500).send('Error al obtener películas');
        }
    });

    // Pagina no encontrada
    router.use((req, res) => {
        res.status(404).render('error', {
            error: 'La página que buscas no existe.'
        });
    });

    return router;
};
