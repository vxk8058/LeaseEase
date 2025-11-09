const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
    model: String,
    year: Number,
    price: Number,
    fuelType: String,
    colors: [String],
    type: String,
    seats: Number,
    image: String
}, { versionKey: false });;

module.exports = mongoose.model('ToyotaCar', carSchema, 'Toyota-cars');
