// Wrapper to start the actual server located in leaseease/server
// Use index.js (implements the API + proxy)
try {
  require('../leaseease/server/index.js');
} catch (err) {
  console.error('Failed to start inner server (leaseease/server/index.js):', err);
  process.exit(1);
}
