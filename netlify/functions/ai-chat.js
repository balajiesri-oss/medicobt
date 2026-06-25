exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ type: "error", error: { message: "Method not allowed" } }),
    };
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        type: "error",
        error: { message: "Server is missing GROQ_API_KEY." },
      }),
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (e) {
    return {
      statusCode: 400,
      body: JSON.stringify({ type: "error", error: { message: "Invalid JSON body" } }),
    };
  }

  const { system, messages } = payload;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model:"llama-3.3-70b-versatile",
        max_tokens: 1000,
        messages: [
          ...(system ? [{ role: "system", content: system }] : []),
          ...(messages || []),
        ],
      }),
    });

    const data = await response.json();
    console.log("Groq response status:", response.status);
    console.log("Groq response data:", JSON.stringify(data));

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "error",
          error: { message: data.error?.message || "Groq API error" },
        }),
      };
    }

    const text = data.choices?.[0]?.message?.content || "";
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: [{ type: "text", text }],
      }),
    };
  } catch (err) {
    return {
      statusCode: 502,
      body: JSON.stringify({
        type: "error",
        error: { message: "Failed to reach Groq API: " + err.message },
      }),
    };
  }
};
