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

// Standard financing terms
const STANDARD_RATE = 5;  // 5% APR
const STANDARD_TERM = 60; // 60 months

// Connect to MongoDB and update all cars with monthly estimates
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("Connected to MongoDB");

    try {
      // Get all cars from MongoDB
      const cars = await Car.find({});
      console.log(`Found ${cars.length} cars in database`);

      // Update each car with its monthly estimate
      const updatePromises = cars.map(car => {
        const monthlyEstimate = computeMonthly(car.price, STANDARD_RATE, STANDARD_TERM);
        return Car.findByIdAndUpdate(
          car._id,
          { $set: { monthlyEstimate } },
          { new: true }
        );
      });

      await Promise.all(updatePromises);
      console.log("Successfully updated all cars with monthly estimates");

      // Verify a few examples
      const examples = await Car.find().limit(3);
      examples.forEach(car => {
        console.log(`\n${car.model} ($${car.price}):`);
        console.log(`Monthly estimate: $${car.monthlyEstimate}`);
      });

    } catch (error) {
      console.error("Error updating cars:", error);
    } finally {
      await mongoose.connection.close();
      console.log("\nMongoDB connection closed");
    }
  })
  .catch(err => console.error("Connection Error:", err));