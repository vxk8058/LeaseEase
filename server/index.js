// Wrapper to start the actual server located in leaseease/server
try {
  require('../leaseease/server/server.js');
} catch (err) {
  console.error('Failed to start inner server (leaseease/server/server.js):', err);
  process.exit(1);
}
