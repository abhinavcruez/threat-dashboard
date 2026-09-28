const fs = require('fs');
const file = 'C:/Users/AbhinavKS/Downloads/My workflow 5.json';
const data = JSON.parse(fs.readFileSync(file));

data.nodes.push({
  parameters: {
    method: 'POST',
    url: 'http://host.docker.internal:3001/webhook/n8n',
    sendBody: true,
    specifyBody: 'json',
    jsonBody: '={\n  "title": "{{$json.title}}",\n  "report": "{{$json.report}}",\n  "model": "{{$json.model}}",\n  "generated_at": "{{$json.generated_at}}",\n  "source_ip": "{{$(\'Edit Fields1\').item.json.value}}",\n  "attack_type": "{{$(\'Edit Fields1\').item.json.scenario}}"\n}',
    options: {}
  },
  type: 'n8n-nodes-base.httpRequest',
  typeVersion: 4.1,
  position: [864, -44],
  id: 'dashboard-webhook-node',
  name: 'Send to React Dashboard'
});

data.connections['Code in JavaScript'].main[0].push({
  node: 'Send to React Dashboard',
  type: 'main',
  index: 0
});

fs.writeFileSync('C:/Users/AbhinavKS/Downloads/My workflow 5_updated.json', JSON.stringify(data, null, 2));
console.log('Successfully updated workflow JSON.');
