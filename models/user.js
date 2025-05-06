const mongoose = require('mongoose');

module.exports = (connection) => {
  const userSchema = new mongoose.Schema({
    Id_user: {
      type: Number,
      required: true,
      unique: true
    },
    Username: {
      type: String,
      required: true,
      unique: true
    },
    Password: {
      type: String,
      required: true
    }
  });

  return connection.model('User', userSchema);
};
