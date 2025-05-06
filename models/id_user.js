const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  _id: { 
    type: String, 
    required: true 
  },
  sequence_value: { 
    type: Number, 
    default: 0
  }
});


module.exports = (connection) => {
  const Counter = connection.model('Counter', counterSchema);
  //incremento automático en 1
  const getNextSequence = async (sequenceName) => {
    const updatedCounter = await Counter.findOneAndUpdate(
      { _id: sequenceName },
      { $inc: { sequence_value: 1 } },
      { new: true, upsert: true }
    );
    return updatedCounter.sequence_value;
  };

  return getNextSequence;
};
