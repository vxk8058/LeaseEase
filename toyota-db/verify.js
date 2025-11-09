const mongoose = require('mongoose');
require('dotenv').config();
const Car = require('./models/Car');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("Connected to MongoDB");
    try {
      // Get one car with its monthly estimates
      const car = await Car.findOne({});
      console.log('Sample car data:');
      console.log(`Model: ${car.model}`);
      console.log(`Price: $${car.price}`);
      console.log('\nMonthly payment estimates:');
      car.monthlyEstimates.forEach(estimate => {
        console.log(`\nDown payment: $${estimate.downPayment}`);
        console.log(`Annual rate: ${estimate.annualRate}%`);
        console.log(`Loan term: ${estimate.loanTerm} months`);
        console.log(`Monthly payment: $${estimate.monthlyPayment}`);
      });
    } catch (error) {
      console.error("Error:", error);
    } finally {
      await mongoose.connection.close();
      console.log("\nMongoDB connection closed");
    }
  })
  .catch(err => console.error("Connection Error:", err));