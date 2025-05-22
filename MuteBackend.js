console.log("✅ Replit backend is booting...");

const express = require('express');
const axios = require('axios');
const app = express();
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // GitHub PAT from Replit secrets

// Parse JSON bodies
app.use(express.json());

// Endpoint to receive Discord interactions
app.post('/', async (req, res) => {
  const interaction = req.body;

  // Reply to Discord's PING to verify the endpoint (type 1 → type 1)
  if (interaction.type === 1) {
    return res.json({ type: 1 });
  }

  // Button click interaction (type 3)
  if (interaction.type === 3) {
    // The custom_id we set on the button (e.g. "mute_ItemName")
    const customId = interaction.data.custom_id; 
    // Extract the key to append (strip the "mute_" prefix)
    const itemKey = customId.replace(/^mute_/, '');

    try {
      // GitHub repository details
      const owner = 'whiteisuwu';
      const repo = 'Rapvalues';
      const path = 'muted_items.json';
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

      // 1. GET current contents and SHA of muted_items.json
      const getRes = await axios.get(apiUrl, {
        headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
      });
      const fileData = getRes.data;
      const contentBuffer = Buffer.from(fileData.content, 'base64');
      let json = JSON.parse(contentBuffer.toString() || '{}');

      // 2. Update the JSON (add the item key)
      // (Assume the JSON is an object mapping keys to true; adjust if it's an array)
      json[itemKey] = true;

      // 3. PUT updated content back to GitHub
      const updatedContent = Buffer.from(JSON.stringify(json, null, 2)).toString('base64');
      await axios.put(apiUrl, {
        message: `Add "${itemKey}" to muted_items`,
        content: updatedContent,
        sha: fileData.sha
      }, {
        headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
      });
    } catch (err) {
      console.error('GitHub API error:', err.response ? err.response.data : err.message);
    }

    // Respond to Discord - send a message back (ephemeral reply)
    return res.json({
      type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
      data: {
        content: `🔇 Muted item \`${itemKey}\`.`,
        flags: 1 << 6  // Make the message ephemeral (only visible to the clicker)
      }
    });
  }

  // Default: do nothing
  res.sendStatus(200);
});

// A GET route to test the endpoint is live
app.get('/', (req, res) => {
  res.send('Interaction endpoint active');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
