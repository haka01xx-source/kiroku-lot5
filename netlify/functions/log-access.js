// Netlify Function: log-access
// - POST: append a log entry (JSON) to GITHUB_REPO at path 'server-logs/access_logs.json'
// - GET: return the current logs JSON
// Requires Netlify env vars: GITHUB_TOKEN, GITHUB_REPO (owner/repo)

const GITHUB_API = 'https://api.github.com';

exports.handler = async function(event, context) {
  const method = event.httpMethod;
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO; // format: owner/repo
  const filePath = 'server-logs/access_logs.json';

  // optional admin secret to protect GET access
  const ADMIN_SECRET = process.env.ADMIN_SECRET || null;

  if(!repo || !token){
    return { statusCode: 500, body: JSON.stringify({ error: 'GITHUB_TOKEN or GITHUB_REPO not configured' }) };
  }

  const headers = { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' };
  const [owner, repoName] = repo.split('/');
  if(!owner || !repoName){
    return { statusCode: 500, body: JSON.stringify({ error: 'GITHUB_REPO must be owner/repo' }) };
  }

  async function getFile(){
    const url = `${GITHUB_API}/repos/${owner}/${repoName}/contents/${encodeURIComponent(filePath)}`;
    const r = await fetch(url, { headers });
    if(r.status === 404) return null;
    if(!r.ok) throw new Error('GitHub getFile failed: '+ r.status);
    return await r.json();
  }
  async function putFile(contentBase64, sha, message){
    const url = `${GITHUB_API}/repos/${owner}/${repoName}/contents/${encodeURIComponent(filePath)}`;
    const body = { message: message || 'Update access logs', content: contentBase64, branch: 'main' };
    if(sha) body.sha = sha;
    const r = await fetch(url, { method: 'PUT', headers: Object.assign({'Content-Type':'application/json'}, headers), body: JSON.stringify(body) });
    if(!r.ok) throw new Error('GitHub putFile failed: '+r.status);
    return await r.json();
  }

  try{
    if(method === 'GET'){
      // protect GET with ADMIN_SECRET if configured
      if(ADMIN_SECRET){
        const provided = (event.headers && (event.headers['x-admin-secret'] || event.headers['x-admin_secret'])) || null;
        if(!provided || provided !== ADMIN_SECRET){
          return { statusCode: 403, body: JSON.stringify({ error: 'forbidden' }) };
        }
      }
      const f = await getFile();
      if(!f) return { statusCode: 200, body: JSON.stringify([]), headers: { 'Content-Type': 'application/json' } };
      const content = Buffer.from(f.content, 'base64').toString('utf8');
      return { statusCode: 200, body: content, headers: { 'Content-Type': 'application/json' } };
    }

    if(method === 'POST'){
      let payload = {};
      try{ payload = JSON.parse(event.body); }catch(e){ return { statusCode: 400, body: JSON.stringify({ error: 'invalid json' }) }; }
      // minimal validation
      payload.ts = payload.ts || Date.now();
      payload.path = payload.path || '/';
      payload.ua = payload.ua || '';
      payload.ref = payload.ref || null;
      payload.accountId = payload.accountId || null;

      // fetch existing file
      const file = await getFile();
      let arr = [];
      let sha = null;
      if(file){
        sha = file.sha;
        try{ arr = JSON.parse(Buffer.from(file.content, 'base64').toString('utf8')); }catch(e){ arr = []; }
      }
      arr.push(payload);
      // keep last 5000
      if(arr.length > 5000) arr = arr.slice(arr.length - 5000);
      const contentBase64 = Buffer.from(JSON.stringify(arr, null, 2)).toString('base64');
      await putFile(contentBase64, sha, `Add access log @ ${new Date(payload.ts).toISOString()}`);
      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 405, body: JSON.stringify({ error: 'method not allowed' }) };
  }catch(err){
    console.error('log-access error', err);
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};