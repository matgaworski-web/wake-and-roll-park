const token = process.env.CLOUDFLARE_API_TOKEN;
const VPS_IP = '57.131.192.232';

async function updateZoneDNS(zoneId, zoneName) {
  console.log(`Updating DNS for ${zoneName} (${zoneId})...`);
  const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  
  // Delete old CNAMEs for root and www
  for (const r of data.result) {
    if (r.type === 'CNAME' && (r.name === zoneName || r.name === `www.${zoneName}`)) {
      console.log(`Deleting CNAME ${r.name}...`);
      await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${r.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
    }
  }

  // Add or update A records for root and www
  const names = [zoneName, `www.${zoneName}`];
  for (const name of names) {
    const existing = data.result.find(r => r.type === 'A' && r.name === name);
    if (existing) {
      console.log(`Updating A record for ${name}...`);
      await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${existing.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'A',
          name: name,
          content: VPS_IP,
          proxied: true,
          ttl: 1
        })
      });
    } else {
      console.log(`Creating A record for ${name} -> ${VPS_IP} (proxied: true)...`);
      const createRes = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'A',
          name: name,
          content: VPS_IP,
          proxied: true,
          ttl: 1
        })
      });
      const created = await createRes.json();
      console.log(`Created: ${created.success ? 'OK' : JSON.stringify(created.errors)}`);
    }
  }
}

async function main() {
  await updateZoneDNS('d467b061581f1883be0d949cf6700aef', 'wakeandrollpark.pl');
  await updateZoneDNS('f75d705b7ed1cb0d69ff8efc37e015a7', 'wakeandroll.pl');
  console.log('DNS configuration updated successfully.');
}

main().catch(console.error);
