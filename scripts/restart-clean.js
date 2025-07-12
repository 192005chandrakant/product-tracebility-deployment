#!/usr/bin/env node

/**
 * Clean Restart Script
 * This script kills existing processes and restarts the application cleanly
 */

const { execSync, spawn } = require('child_process');

console.log('🧹 Clean Restart for Product Traceability\n');

// Function to run commands safely
const runCommand = (command, description) => {
  try {
    console.log(`📋 ${description}...`);
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed`);
    return true;
  } catch (error) {
    console.log(`⚠️ ${description} failed: ${error.message}`);
    return false;
  }
};

// Function to kill processes on specific ports
const killPort = (port) => {
  try {
    console.log(`🔪 Killing processes on port ${port}...`);
    execSync(`npx kill-port ${port}`, { stdio: 'ignore' });
    console.log(`✅ Killed processes on port ${port}`);
    return true;
  } catch (error) {
    console.log(`⚠️ Could not kill processes on port ${port}: ${error.message}`);
    return false;
  }
};

// Main restart process
const main = async () => {
  console.log('🚀 Starting clean restart...\n');

  // Step 1: Kill existing processes
  console.log('🔪 Killing existing processes...');
  killPort(3000); // Frontend
  killPort(3001); // Frontend alternative
  killPort(5000); // Backend
  killPort(5001); // Backend alternative
  
  // Also try to kill Node.js processes
  try {
    execSync('taskkill /F /IM node.exe', { stdio: 'ignore' });
    console.log('✅ Killed all Node.js processes');
  } catch (error) {
    console.log('⚠️ Could not kill all Node.js processes');
  }

  // Step 2: Wait a moment for processes to fully terminate
  console.log('\n⏳ Waiting for processes to terminate...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Step 3: Start the backend server
  console.log('\n🚀 Starting backend server...');
  const backendProcess = spawn('npm', ['run', 'dev'], {
    cwd: './server',
    stdio: 'inherit',
    shell: true
  });

  // Step 4: Wait for backend to start
  console.log('⏳ Waiting for backend to start...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Step 5: Start the frontend
  console.log('\n🚀 Starting frontend...');
  const frontendProcess = spawn('npm', ['start'], {
    cwd: './client',
    stdio: 'inherit',
    shell: true
  });

  // Step 6: Monitor processes
  console.log('\n📊 Monitoring processes...');
  console.log('✅ Backend started in background');
  console.log('✅ Frontend started in background');
  
  console.log('\n🎉 Clean restart completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Wait for both servers to fully start');
  console.log('2. Open http://localhost:3000 or http://localhost:3001');
  console.log('3. Check that the 3D scene loads without errors');
  console.log('4. Test the login functionality');
  
  console.log('\n🔧 If you see errors:');
  console.log('1. Check the console for specific error messages');
  console.log('2. Ensure MongoDB is properly configured');
  console.log('3. Clear browser cache and refresh');
  
  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...');
    backendProcess.kill();
    frontendProcess.kill();
    process.exit(0);
  });
};

// Run the main function
main().catch(console.error); 