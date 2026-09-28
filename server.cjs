const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const DB_FILE = path.join(__dirname, 'incidents.json');

// Load existing incidents or start with empty array
let incidents = [];
if (fs.existsSync(DB_FILE)) {
    incidents = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

// 1. Endpoint for n8n to POST new AI Threat Reports
app.post('/webhook/n8n', (req, res) => {
    const data = req.body;
    console.log("🚨 Received new alert from n8n:", data.title);
    
    // Format the incoming n8n data for the React dashboard
    const newIncident = {
        id: 'INC-' + Date.now(),
        timestamp: data.generated_at,
        ip: data.source_ip || 'Unknown',
        type: data.attack_type || 'Malicious Activity',
        severity: data.severity || 'High',
        mitre: data.mitre || 'Unknown',
        status: 'Blocked',
        aiSummary: data.report
    };

    // Add to the top of the list, keep only last 50
    incidents.unshift(newIncident);
    if (incidents.length > 50) incidents.pop();

    // Save to local file
    fs.writeFileSync(DB_FILE, JSON.stringify(incidents, null, 2));

    res.status(200).send({ success: true });
});

// 2. Endpoint for React Dashboard to GET the data
app.get('/api/incidents', (req, res) => {
    res.json(incidents);
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(`🛡️ Threat Dashboard Server Running!`);
    console.log(`📡 Dashboard API: http://localhost:${PORT}/api/incidents`);
    console.log(`🔗 n8n Webhook URL: http://host.docker.internal:${PORT}/webhook/n8n`);
    console.log(`========================================\n`);
});
