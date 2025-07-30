const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001"

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  try {
    const { prompt, recipientInfo } = req.body

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" })
    }

    console.log("🚀 Starting AI proxy stream for:", prompt)

    const backendResponse = await fetch(`${BACKEND_URL}/ai/generate-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({ prompt, recipientInfo }),
    })

    if (!backendResponse.ok) {
      console.error(
        "Backend error:",
        backendResponse.status,
        backendResponse.statusText
      )
      return res.status(backendResponse.status).json({
        error: "Backend AI service unavailable",
      })
    }

    console.log("✅ Proxying stream to frontend...")

    // Set SSE headers
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control",
    })

    const reader = backendResponse.body.getReader()
    const decoder = new TextDecoder()

    try {
      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          console.log("🏁 Backend stream ended")
          res.end()
          break
        }

        const chunk = decoder.decode(value, { stream: true })
        console.log("📦 Proxying chunk:", chunk)

        // Forward the chunk directly to the frontend
        res.write(chunk)
      }
    } catch (error) {
      console.error("❌ AI API Proxy Error:", error)

      if (!res.headersSent) {
        res.status(500).json({ error: "AI generation failed" })
      } else {
        // If we're in the middle of streaming, send an error event
        res.write(
          `data: ${JSON.stringify({
            type: "error",
            data: "Stream interrupted",
          })}\n\n`
        )
        res.end()
      }
    }
  } catch (error) {
    console.error("❌ AI API Proxy Error:", error)
    if (!res.headersSent) {
      res.status(500).json({ error: "AI generation failed" })
    }
  }
}
