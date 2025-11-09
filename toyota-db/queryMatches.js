const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/.env' });
const Car = require('./models/Car');

const maxMonthly = Number(process.argv[2] || 500);

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    try {
      console.log(`Connected to MongoDB. Querying cars with monthlyEstimate <= ${maxMonthly}`);
      const cars = await Car.find({ monthlyEstimate: { $lte: maxMonthly } }).sort({ monthlyEstimate: 1 }).limit(5).lean();
      console.log(`Found ${cars.length} matching cars:\n`);
      cars.forEach((c, i) => {
        console.log(`${i+1}. ${c.model} (${c.year}) - $${c.price} - monthlyEstimate: $${c.monthlyEstimate}`);
        console.log(`   image: ${c.image}`);
      });
    } catch (err) {
      console.error('Error querying cars:', err);
    } finally {
      await mongoose.connection.close();
      console.log('\nConnection closed');
    }
  })
  .catch(err => console.error('Connection Error:', err));
