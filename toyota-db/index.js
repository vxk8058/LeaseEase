const mongoose = require('mongoose');
require('dotenv').config();
const Car = require('./models/Car');

// Helper function to calculate monthly payment
function computeMonthly(principal, annualRate, months) {
  const P = parseFloat(principal) || 0;
  const annual = parseFloat(annualRate) || 0;
  const n = Math.max(1, Math.floor(Number(months) || 0));
  const r = annual / 100 / 12; // monthly rate

  if (n <= 0 || P <= 0) return 0;

  // zero (or effectively zero) interest fallback
  if (r <= 0) {
    const flat = P / n;
    return Math.round(flat * 100) / 100;
  }

  // multiplier = r*(1+r)^n / ((1+r)^n - 1)
  const onePlusRpowN = Math.pow(1 + r, n);
  const multiplier = (r * onePlusRpowN) / (onePlusRpowN - 1);
  const monthly = P * multiplier;

  // round to cents
  return Math.round(monthly * 100) / 100;
}

// Common financing scenarios to pre-calculate
const financingScenarios = [
  { downPayment: 0, annualRate: 5, loanTerm: 60 },      // 0 down, 5% APR, 60 months
  { downPayment: 5000, annualRate: 5, loanTerm: 60 },   // $5k down, 5% APR, 60 months
  { downPayment: 10000, annualRate: 5, loanTerm: 60 },  // $10k down, 5% APR, 60 months
  { downPayment: 0, annualRate: 3, loanTerm: 36 },      // 0 down, 3% APR, 36 months
  { downPayment: 0, annualRate: 7, loanTerm: 72 }       // 0 down, 7% APR, 72 months
];

// Function to update a single car with monthly estimates
async function updateCarWithEstimates(car) {
  const monthlyEstimates = financingScenarios.map(scenario => ({
    ...scenario,
    monthlyPayment: computeMonthly(car.price - scenario.downPayment, scenario.annualRate, scenario.loanTerm)
  }));

  return Car.findByIdAndUpdate(
    car._id,
    { $set: { monthlyEstimates } },
    { new: true }
  );
}

const cars = [
    { 
      model: "Corolla", 
      year: 2024, 
      price: 22000, 
      fuelType: "Gasoline", 
      colors: ["Red", "White", "Blue"], 
      type: "Sedan", 
      seats: 5, 
      image: "https://drive.google.com/file/d/11P92TClLUYaRHVOlL0vyC71j7zv8wIED/view?usp=sharing",
      monthlyEstimates: financingScenarios.map(scenario => ({
        ...scenario,
        monthlyPayment: computeMonthly(22000 - scenario.downPayment, scenario.annualRate, scenario.loanTerm)
      }))
    },
    { model: "Camry", year: 2025, price: 28000, fuelType: "Hybrid", colors: ["Black", "Silver"], type: "Sedan", seats: 5 , image: "https://drive.google.com/file/d/1R_go_V7WyhRg04t8Tne73qeHVHUcDIeK/view?usp=sharing" },
    { model: "RAV4", year: 2023, price: 30000, fuelType: "Gasoline", colors: ["White", "Gray"], type: "SUV", seats: 5, image: "https://drive.google.com/file/d/1-V0Wb6k1PAgKT7W9LBhqcZ0xllJv3u3z/view?usp=sharing" },
    { model: "Highlander", year: 2024, price: 42000, fuelType: "Hybrid", colors: ["Black", "Blue"], type: "SUV", seats: 7, image: "https://drive.google.com/file/d/1sYLJgSfcNC2svTbzUAopWIWgg09yAXxN/view?usp=sharing" },
    { model: "Prius", year: 2025, price: 25000, fuelType: "Hybrid", colors: ["Green", "White"], type: "Hatchback", seats: 5, image: "https://drive.google.com/file/d/10eJjtWvk6BISLFnRSgCkzlfDisQisH_q/view?usp=sharing" },
    { model: "Supra", year: 2024, price: 55000, fuelType: "Gasoline", colors: ["Red", "Yellow"], type: "Sports", seats: 2, image: "https://drive.google.com/file/d/1GrYUGMPvOmKAMtBjyuZtzer-3nU4eg8V/view?usp=sharing" },
    { model: "Tacoma", year: 2023, price: 32000, fuelType: "Gasoline", colors: ["Silver", "Blue"], type: "Truck", seats: 5, image: "https://drive.google.com/file/d/1xoVUB4f-mttGgYsFDXtlkXAO8gmF5YfD/view?usp=sharing" },
    { model: "Tundra", year: 2025, price: 47000, fuelType: "Gasoline", colors: ["Black", "White"], type: "Truck", seats: 5, image: "https://drive.google.com/file/d/1xoVUB4f-mttGgYsFDXtlkXAO8gmF5YfD/view?usp=sharing" },
    { model: "Venza", year: 2024, price: 40000, fuelType: "Hybrid", colors: ["Gray", "White"], type: "SUV", seats: 5, image: "https://drive.google.com/file/d/1bKOQSDhgqZoKg4pAy0tmMfO05Me6rOse/view?usp=sharing" },
    { model: "Sienna", year: 2025, price: 45000, fuelType: "Hybrid", colors: ["Blue", "Silver"], type: "Minivan", seats: 7, image: "https://drive.google.com/file/d/1oqp-qUbPK0VSJS52IMtB3QPAnCxGr6w_/view?usp=sharing" },
    { model: "Corolla Cross", year: 2023, price: 26000, fuelType: "Gasoline", colors: ["Red", "White"], type: "SUV", seats: 5, image: "https://drive.google.com/file/d/1R_go_V7WyhRg04t8Tne73qeHVHUcDIeK/view?usp=sharing" },
    { model: "C-HR", year: 2024, price: 28000, fuelType: "Gasoline", colors: ["Black", "Gray"], type: "SUV", seats: 5, image: "https://drive.google.com/file/d/11uWcBO_HWZMSk1mZ0LsLtUX9ty-VGllW/view?usp=sharing" },
    { model: "Yaris", year: 2023, price: 20000, fuelType: "Gasoline", colors: ["Yellow", "White"], type: "Hatchback", seats: 5, image: "https://drive.google.com/file/d/1WX5gJtDGMPPZ7LXEBfMaseeFJgx4GtAZ/view?usp=sharing" },
    { model: "Avalon", year: 2025, price: 43000, fuelType: "Hybrid", colors: ["Silver", "Blue"], type: "Sedan", seats: 5, image: "https://drive.google.com/file/d/1PnJGhLA0jpZhK5lTQsZYg_mB8EDO0nwS/view?usp=sharing" },
    { model: "GR86", year: 2024, price: 35000, fuelType: "Gasoline", colors: ["Red", "Black"], type: "Sports", seats: 2, image: "https://drive.google.com/file/d/1HUzdXXf55HqJ6pRUSs5FM3lvG-MSuPxq/view?usp=sharing" },
    { model: "Sequoia", year: 2023, price: 55000, fuelType: "Gasoline", colors: ["White", "Gray"], type: "SUV", seats: 8, image: "https://drive.google.com/file/d/13Jv1EOLMt04S_MbDsINbug4eETQU2VH5/view?usp=sharing" },
    { model: "Hilux", year: 2025, price: 36000, fuelType: "Gasoline", colors: ["Black", "Silver"], type: "Truck", seats: 5, image: "https://drive.google.com/file/d/1sYLJgSfcNC2svTbzUAopWIWgg09yAXxN/view?usp=sharing" },
    { model: "Mirai", year: 2024, price: 50000, fuelType: "Hydrogen", colors: ["Blue", "White"], type: "Sedan", seats: 5, image: "https://drive.google.com/file/d/1kZfhMdkc8y8yYpYVv2xMOUzbnVG8WudR/view?usp=sharing" },
    { model: "Crown", year: 2025, price: 47000, fuelType: "Hybrid", colors: ["Black", "Red"], type: "Sedan", seats: 5, image: "https://drive.google.com/file/d/1FAOx3WhNPsrhv5tHIgKsoSNvohaKKgkl/view?usp=sharing" },
    { model: "bZ4X", year: 2024, price: 42000, fuelType: "Electric", colors: ["White", "Silver"], type: "SUV", seats: 5, image: "https://drive.google.com/file/d/1yn9FXK_ChQFhKD_TAzqN3EX8R0PaThCh/view?usp=sharing" }
];
  

// Connect to MongoDB and update all cars with monthly estimates
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("Connected to MongoDB");

    try {
      // Get all cars from MongoDB
      const cars = await Car.find({});
      console.log(`Found ${cars.length} cars in database`);

      // Update each car with monthly estimates
      const updatePromises = cars.map(car => updateCarWithEstimates(car));
      await Promise.all(updatePromises);

      console.log("Successfully updated all cars with monthly estimates");
    } catch (error) {
      console.error("Error updating cars:", error);
    } finally {
      await mongoose.connection.close();
      console.log("MongoDB connection closed");
    }
  })
  .catch(err => console.error("Connection Error:", err));

// Car.insertMany(cars)
//     .then(() => console.log("20+ Toyota Mock cars added with pictures!"))
//     .catch(err => console.error("Error inserting cars:", err))
//     .finally(() => mongoose.connection.close());