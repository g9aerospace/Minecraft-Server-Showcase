const fs = require('fs');

// Function to read server configuration from a JSON file
function readServerConfig() {
  try {
    const rawData = fs.readFileSync('servers/928267278540242964.json');
    return JSON.parse(rawData);
  } catch (error) {
    console.error('Error reading server configuration:', error);
    return null;
  }
}

// JavaScript code to fetch MOTD from a Minecraft server
async function fetchMOTD() {
  const serverConfig = readServerConfig();

  if (!serverConfig) {
    console.error('Unable to read server configuration. Exiting.');
    return;
  }

  const { ip, port } = serverConfig;
  const apiUrl = `https://api.mcsrvstat.us/2/${ip}:${port}`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.online) {
      let motd;
      if (Array.isArray(data.motd)) {
        motd = data.motd.join(' ');
      } else if (typeof data.motd === 'object') {
        motd = data.motd.clean.join(' ');
      } else {
        motd = data.motd;
      }

      console.log(`MOTD: ${motd}`);
    } else {
      console.error('Server is offline or unreachable.');
    }
  } catch (error) {
    console.error('Error fetching MOTD:', error);
  }
}

// Fetch MOTD when the script is executed
fetchMOTD();
