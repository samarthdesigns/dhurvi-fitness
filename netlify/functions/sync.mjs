// Netlify Function: Sync data via GitHub repo
// GET  /api/sync → pull gym-data.json from repo
// POST /api/sync → push merged gym-data.json to repo

const FILE_PATH = 'data/gym-data.json';

async function githubRequest(method, path, body = null) {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO; // e.g. "username/dhruvi-gym"

  if (!token || !repo) {
    throw new Error('GITHUB_TOKEN and GITHUB_REPO env vars required');
  }

  const opts = {
    method,
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'DhruviGymPlan'
    }
  };

  if (body) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }

  const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, opts);
  return { status: res.status, data: await res.json() };
}

export default async (request) => {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;

  if (!token || !repo) {
    return new Response(JSON.stringify({ error: 'GitHub not configured. Add GITHUB_TOKEN and GITHUB_REPO env vars.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // ============ PULL ============
  if (request.method === 'GET') {
    try {
      const { status, data } = await githubRequest('GET', FILE_PATH);

      if (status === 404) {
        // File doesn't exist yet — that's fine, return empty
        return new Response(JSON.stringify({ logs: [], settings: [], sha: null }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (status !== 200) {
        return new Response(JSON.stringify({ error: 'GitHub API error', details: data }), {
          status: 502,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Decode base64 content
      const content = JSON.parse(atob(data.content.replace(/\n/g, '')));
      return new Response(JSON.stringify({ ...content, sha: data.sha }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // ============ PUSH ============
  if (request.method === 'POST') {
    try {
      const { logs, settings, sha } = await request.json();

      const content = btoa(unescape(encodeURIComponent(
        JSON.stringify({ logs, settings, updatedAt: new Date().toISOString() }, null, 2)
      )));

      const body = {
        message: `sync: ${new Date().toISOString().split('T')[0]}`,
        content,
        branch: 'main'
      };

      // If we have the sha, it's an update. If not, it's a create.
      if (sha) body.sha = sha;

      const { status, data } = await githubRequest('PUT', FILE_PATH, body);

      if (status === 200 || status === 201) {
        return new Response(JSON.stringify({ success: true, sha: data.content.sha }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // sha mismatch = someone else pushed. Pull first, then retry.
      if (status === 409) {
        return new Response(JSON.stringify({ error: 'conflict', message: 'Data changed on another device. Pull first.' }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ error: 'GitHub push failed', details: data }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  return new Response('Method not allowed', { status: 405 });
};

export const config = {
  path: "/api/sync"
};
