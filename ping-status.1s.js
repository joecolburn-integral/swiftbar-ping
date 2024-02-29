#!/usr/bin/env /usr/local/bin/node
const { exec } = require("child_process");
const fs = require('fs');
const runningStatePath = '/tmp/ping-status-isRunning.txt';
const failureCountFilePath = '/tmp/ping-status-failureCount.txt';
let isRunning = true;
let ipAddress = "8.8.8.8";
let failureCount = 0;

const icons = {
  success: "🛜🟢|size=10",
  warning: "🛜🟠|size=10",
  error: "🛜🔴|size=10",
  paused: "🛜🔵|size=10",
};

function readIsRunning() {
  try {
    const state = fs.readFileSync(runningStatePath, 'utf8');
    return state.trim() === 'true';
  } catch (error) {
    return true;
  }
}

function writeIsRunning(state) {
  try {
    fs.writeFileSync(runningStatePath, state.toString(), 'utf8');
    console.log(`Successfully wrote isRunning=${state} to ${runningStatePath}`);
  } catch (error) {
    console.error(`Failed to write isRunning state: ${error.message}`);
  }
}

function readFailureCount() {
  try {
      const count = fs.readFileSync(failureCountFilePath, 'utf8');
      return parseInt(count, 10);
  } catch (error) {
      return 0;
  }
}

function writeFailureCount(count) {
  fs.writeFileSync(failureCountFilePath, count.toString(), 'utf8');
}

function display(status, failureCount = 0) {
  console.log(`${icons[status]} | dropdown=false`);
  console.log("---");
  console.log(`${isRunning ? 'Pause' : 'Run'} | bash='${process.env.SWIFTBAR_PLUGIN_PATH}' param1=${isRunning ? 'pause' : 'run'} terminal=false refresh=true`);
  console.log(
    `IP Address: ${ipAddress} | bash='$0' param1='changeIP' param2='TYPE_NEW_IP_HERE' terminal=false refresh=false`
  );
  console.log(`Down for ${failureCount} pings`);
}

function ping() {
  if (!isRunning) {
      display('paused');
      return;
  }

  let failureCount = readFailureCount();

  exec(`ping -c 1 ${ipAddress}`, (error, stdout, stderr) => {
      if (error) {
          failureCount++;
          writeFailureCount(failureCount);
          if (failureCount > 3) {
              display('error', failureCount);
          } else {
              display('warning', failureCount);
          }
      } else {
          failureCount = 0;
          writeFailureCount(failureCount);
          display('success', 0);
      }
  });
}

const args = process.argv.slice(2);
if (args.length > 0) {
  const command = args[0];
  if (command === "pause") {
    writeIsRunning(false);
  } else if (command === "run") {
    writeIsRunning(true);
  } else if (command === "changeIP" && args[1]) {
    ipAddress = args[1];
  }
  return;
}

isRunning = readIsRunning();

if (isRunning) {
  ping();
} else {
  display("paused");
}
