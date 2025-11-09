const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/.env' });
const Car = require('./models/Car');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB — removing monthlyEstimates array field if present');
    try {
      const res = await Car.updateMany({ monthlyEstimates: { $exists: true } }, { $unset: { monthlyEstimates: '' } });
      console.log('Update result:', res);
      const count = await Car.countDocuments({ monthlyEstimates: { $exists: true } });
      console.log('Remaining docs with monthlyEstimates:', count);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      await mongoose.connection.close();
      console.log('Disconnected');
    }
  })
  .catch(err => console.error('Connection Error:', err));