// Netlify Function: cek username Roblox (proxy, karena API Roblox tidak bisa dipanggil langsung dari browser/CORS)
// Taruh di: netlify/functions/roblox-check.js  (Node 18+)
// Endpoint: /.netlify/functions/roblox-check?u=USERNAME

const headers = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

exports.handler = async (event) => {
  const u = ((event.queryStringParameters || {}).u || "").trim();
  if (!/^[A-Za-z0-9_]{3,20}$/.test(u)) {
    return { statusCode: 400, headers, body: JSON.stringify({ found: false, error: "invalid" }) };
  }

  try {
    const r = await fetch("https://users.roblox.com/v1/usernames/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usernames: [u], excludeBannedUsers: true }),
    });
    if (!r.ok) throw new Error("roblox " + r.status);
    const user = ((await r.json()).data || [])[0];
    if (!user) return { statusCode: 200, headers, body: JSON.stringify({ found: false }) };

    let avatar = "";
    try {
      const t = await fetch(
        "https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=" +
          user.id + "&size=150x150&format=Png&isCircular=true"
      );
      avatar = (((await t.json()).data || [])[0] || {}).imageUrl || "";
    } catch (_) {}

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        found: true,
        id: user.id,
        name: user.name,
        displayName: user.displayName,
        avatar,
      }),
    };
  } catch (e) {
    return { statusCode: 502, headers, body: JSON.stringify({ found: false, error: "upstream" }) };
  }
};
