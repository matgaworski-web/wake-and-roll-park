const token = process.env.CLOUDFLARE_API_TOKEN;

async function checkZone(zoneName) {
  const res = await fetch(`https://api.cloudflare.com/client/v4/zones?name=${zoneName}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!data.result || data.result.length === 0) {
    console.log(`Zone not found for ${zoneName}`);
    return;
  }
  const zone = data.result[0];
  console.log(`Zone: ${zone.name} | Status: ${zone.status} | ID: ${zone.id}`);
  console.log(`Nameservers: ${zone.name_servers.join(', ')}`);

  // Check DNS records
  const dnsRes = await fetch(`https://api.cloudflare.com/client/v4/zones/${zone.id}/dns_records`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const dnsData = await dnsRes.json();
  console.log(`DNS Records (${dnsData.result.length}):`);
  for (const r of dnsData.result) {
    console.log(` - [${r.type}] ${r.name} -> ${r.content} (proxied: ${r.proxied})`);
  }
}

async function main() {
  await checkZone('wakeandrollpark.pl');
  console.log('---');
  await checkZone('wakeandroll.pl');
  console.log('---');
  const accountId = '26e9a9b548af169e0537cc7c404ed827';
  const pagesRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/wakeandrollpark/domains`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const pagesData = await pagesRes.json();
  console.log('Pages custom domains:');
  console.log(JSON.stringify(pagesData.result, null, 2));
}

main().catch(console.error);
