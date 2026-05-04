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

    // Prepare the request options
    const options = {
      method: request.method,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    };

    // Add body for POST requests
    if (request.method === 'POST') {
      const bodyText = await request.text();
      const formData = new URLSearchParams(bodyText);
      formData.set('api_key', 'ur3124949-1008203940969c70491a03f3');
      options.body = formData.toString();
    }

    // Make the request to UptimeRobot API
    const upstreamResponse = await fetch(targetUrl, options);

    // Get response data
    const responseData = await upstreamResponse.json();

    // Return the response from UptimeRobot API
    return new Response(JSON.stringify(responseData), {
      status: upstreamResponse.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
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