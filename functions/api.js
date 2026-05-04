/** @type {import('@cloudflare/workers-types').RequestHandler} */
export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  try {
    const targetUrl = 'https://api.uptimerobot.com/v2/getMonitors';
    const apiKey = 'ur3124949-1008203940969c70491a03f3';

    // Build form-encoded body from GET query params or POST body
    let formData;
    if (request.method === 'GET') {
      formData = new URLSearchParams(url.search);
    } else {
      const bodyText = await request.text();
      formData = new URLSearchParams(bodyText);
    }
    formData.set('api_key', apiKey);

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    };

    const upstreamResponse = await fetch(targetUrl, options);
    const responseData = await upstreamResponse.json();

    return new Response(JSON.stringify(responseData), {
      status: upstreamResponse.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60, s-maxage=300',
        'CDN-Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error.message);

    return new Response(JSON.stringify({
      error: 'Proxy request failed',
      message: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}