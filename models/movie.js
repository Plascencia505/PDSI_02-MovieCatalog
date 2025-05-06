const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
    Titulo:{
        type: String,
        required: true,
    },
    Actores:{
        type: [String],
        required: true,
    },
    Anio:{
        type: Number,
        required: true,
    },
    Categoria: {
        type: [String],
        required: true, 
    },
    Sinopsis: {
        type: String,
        required: true, 
    },
    Imagen: {
        type: String, 
        required: true, 
    },
    Id_creador: {
        type: Number,
        required: true,
    },
});

module.exports = (connection) =>{
    return connection.model('Movie', movieSchema)
};