import process from 'process';

console.log("=== FRONTEND ENVIRONMENT CHECK ===");
console.log(`Node Version: ${process.version}`);
console.log(`Platform: ${process.platform}`);
console.log(`Arch: ${process.arch}`);

console.log("=== ENVIRONMENT VARIABLES ===");
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`VITE_API_URL: ${process.env.VITE_API_URL || 'Not Set'}`);

console.log("=== NOTE ===");
console.log("If using Vite proxy, ensure vite.config.ts is configured correctly.");
console.log("==================================");
