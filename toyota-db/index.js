require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected!"))
    .catch(err => console.error("Connection error:", err));

    
const Car = require('./models/Car');

const cars = [
    { make: "Toyota", model: "Corolla", year: 2024, price: 22000, fuelType: "Gasoline", transmission: "Automatic" },
    { make: "Toyota", model: "Camry", year: 2025, price: 28000, fuelType: "Hybrid", transmission: "Automatic" },
    { make: "Toyota", model: "RAV4", year: 2023, price: 30000, fuelType: "Gasoline", transmission: "Automatic" },
];

Car.insertMany(cars)
    .then(() => console.log("Mock cars added!"))
    .catch(err => console.error("Error inserting cars:", err))
    .finally(() => mongoose.connection.close());
    