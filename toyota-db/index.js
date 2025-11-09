require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected!"))
    .catch(err => console.error("Connection error:", err));


const Car = require('./models/Car');

const cars = [
    { model: "Corolla", year: 2024, price: 22000, fuelType: "Gasoline", colors: ["Red", "White", "Blue"], type: "Sedan", seats: 5 },
    { model: "Camry", year: 2025, price: 28000, fuelType: "Hybrid", colors: ["Black", "Silver"], type: "Sedan", seats: 5 },
    { model: "RAV4", year: 2023, price: 30000, fuelType: "Gasoline", colors: ["White", "Gray"], type: "SUV", seats: 5 },
    { model: "Highlander", year: 2024, price: 42000, fuelType: "Hybrid", colors: ["Black", "Blue"], type: "SUV", seats: 7 },
    { model: "Prius", year: 2025, price: 25000, fuelType: "Hybrid", colors: ["Green", "White"], type: "Hatchback", seats: 5 },
    { model: "Supra", year: 2024, price: 55000, fuelType: "Gasoline", colors: ["Red", "Yellow"], type: "Sports", seats: 2 },
    { model: "Tacoma", year: 2023, price: 32000, fuelType: "Gasoline", colors: ["Silver", "Blue"], type: "Truck", seats: 5 },
    { model: "Tundra", year: 2025, price: 47000, fuelType: "Gasoline", colors: ["Black", "White"], type: "Truck", seats: 5 },
    { model: "Venza", year: 2024, price: 40000, fuelType: "Hybrid", colors: ["Gray", "White"], type: "SUV", seats: 5 },
    { model: "Sienna", year: 2025, price: 45000, fuelType: "Hybrid", colors: ["Blue", "Silver"], type: "Minivan", seats: 7 },
    { model: "Corolla Cross", year: 2023, price: 26000, fuelType: "Gasoline", colors: ["Red", "White"], type: "SUV", seats: 5 },
    { model: "C-HR", year: 2024, price: 28000, fuelType: "Gasoline", colors: ["Black", "Gray"], type: "SUV", seats: 5 },
    { model: "Yaris", year: 2023, price: 20000, fuelType: "Gasoline", colors: ["Yellow", "White"], type: "Hatchback", seats: 5 },
    { model: "Avalon", year: 2025, price: 43000, fuelType: "Hybrid", colors: ["Silver", "Blue"], type: "Sedan", seats: 5 },
    { model: "GR86", year: 2024, price: 35000, fuelType: "Gasoline", colors: ["Red", "Black"], type: "Sports", seats: 2 },
    { model: "Sequoia", year: 2023, price: 55000, fuelType: "Gasoline", colors: ["White", "Gray"], type: "SUV", seats: 8 },
    { model: "Hilux", year: 2025, price: 36000, fuelType: "Gasoline", colors: ["Black", "Silver"], type: "Truck", seats: 5 },
    { model: "Mirai", year: 2024, price: 50000, fuelType: "Hydrogen", colors: ["Blue", "White"], type: "Sedan", seats: 5 },
    { model: "Crown", year: 2025, price: 47000, fuelType: "Hybrid", colors: ["Black", "Red"], type: "Sedan", seats: 5 },
    { model: "bZ4X", year: 2024, price: 42000, fuelType: "Electric", colors: ["White", "Silver"], type: "SUV", seats: 5 },

];

Car.insertMany(cars)
    .then(() => console.log("20+ Toyota Mock cars added!"))
    .catch(err => console.error("Error inserting cars:", err))
    .finally(() => mongoose.connection.close());