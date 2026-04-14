// Vercel Serverless Function for Polar Checkout
// This keeps POLAR_ACCESS_TOKEN secure on the server side

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get credentials from Vercel environment variables
  const POLAR_ACCESS_TOKEN = process.env.POLAR_ACCESS_TOKEN;
  const POLAR_PRODUCT_ID = process.env.POLAR_PRODUCT_ID;

  if (!POLAR_ACCESS_TOKEN || !POLAR_PRODUCT_ID) {
    console.error('[checkout] Missing Polar credentials');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    // Create checkout session via Polar API
    const response = await fetch('https://api.polar.sh/v1/checkouts/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${POLAR_ACCESS_TOKEN}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        products: [POLAR_PRODUCT_ID],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[checkout] Polar API error:', response.status, errorText);
      return res.status(response.status).json({ error: 'Failed to create checkout' });
    }

    const data = await response.json();

    if (!data.url) {
      console.error('[checkout] No checkout URL in response');
      return res.status(500).json({ error: 'Invalid response from Polar' });
    }

    // Return checkout URL to client
    return res.status(200).json({ url: data.url });

  } catch (error) {
    console.error('[checkout] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
