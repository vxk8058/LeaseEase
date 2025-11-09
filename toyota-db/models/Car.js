const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
    model: String,
    year: Number,
    price: Number,
    fuelType: String,
    colors: [String],
    type: String,
    seats: Number,
    image: String,
    monthlyEstimate: Number  // Single monthly estimate based on car's price
}, { versionKey: false });

module.exports = mongoose.model('ToyotaCar', carSchema, 'Toyota-cars');
