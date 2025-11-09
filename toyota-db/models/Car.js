const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
    make: String,
    model: String,
    year: Number,
    price: Number,
    fuelType: String,
    transmission: String
});

module.exports = mongoose.model('ToyotaCar', carSchema, 'Toyota-cars');
