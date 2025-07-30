export async function streamAIGeneration(prompt, recipientInfo, callbacks) {
  const { onAssistantType, onSubject, onBody, onComplete, onError } = callbacks

  try {
    console.log("🚀 Starting AI generation stream...")
    console.log("📝 Prompt:", prompt)
    console.log("👤 Recipient info:", recipientInfo)

    const response = await fetch("/api/ai/generate-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: prompt,
        recipientInfo: recipientInfo || undefined,
      }),
    })

    console.log("📡 Response status:", response.status)
    console.log("📡 Response headers:", Object.fromEntries(response.headers))

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ HTTP ${response.status}: ${response.statusText}`)
      console.error(`❌ Error details: ${errorText}`)
      throw new Error(
        `Failed to generate email: ${response.status} ${response.statusText}`
      )
    }

    // Check if the response is actually a stream
    const contentType = response.headers.get("content-type")
    console.log("📄 Content-Type:", contentType)

    if (!contentType || !contentType.includes("text/event-stream")) {
      console.warn(
        "⚠️ Response is not a stream, falling back to regular response handling"
      )
      const data = await response.json()

      if (data.assistant_type) onAssistantType(data.assistant_type)
      if (data.subject) onSubject(data.subject)
      if (data.body) onBody(data.body)
      onComplete()
      return
    }

    console.log("✅ Stream detected, processing...")
    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    let buffer = ""
    let eventCount = 0

    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        console.log("🏁 Stream reader finished")
        break
      }

      const chunk = decoder.decode(value, { stream: true })
      console.log("📦 Raw chunk:", JSON.stringify(chunk))
      buffer += chunk

      const lines = buffer.split("\n")
      buffer = lines.pop() || ""

      for (const line of lines) {
        const trimmedLine = line.trim()
        console.log("📄 Processing line:", JSON.stringify(trimmedLine))

        if (!trimmedLine || trimmedLine.startsWith(":")) {
          continue
        }

        if (trimmedLine.startsWith("data: ")) {
          const dataStr = trimmedLine.slice(6)
          console.log("📊 Data string:", JSON.stringify(dataStr))

          if (dataStr === "[DONE]") {
            console.log("🏁 Stream ended with [DONE]")
            onComplete()
            return
          }

          try {
            const data = JSON.parse(dataStr)
            eventCount++
            console.log(`🎯 Event #${eventCount}:`, data)

            switch (data.type) {
              case "assistant_type":
                console.log("🤖 Assistant type:", data.data)
                onAssistantType(data.data)
                break

              case "subject":
                console.log("📧 Subject received:", data.data)
                onSubject(data.data)
                break

              case "body":
                console.log("📝 Body received:", data.data)
                onBody(data.data)
                break

              case "complete":
                console.log("✅ AI generation complete!")
                onComplete()
                return

              case "error":
                console.error("❌ Server error:", data.data)
                onError(new Error(data.data))
                return

              default:
                console.log("❓ Unknown SSE event type:", data.type, data)
            }
          } catch (parseError) {
            console.error("❌ Error parsing SSE data:", parseError)
            console.error("❌ Raw data:", JSON.stringify(dataStr))
          }
        }
      }
    }

    console.log("🏁 Stream processing completed")
    console.log(`📊 Total events processed: ${eventCount}`)
    onComplete()
  } catch (error) {
    console.error("❌ Error in streaming AI generation:", error)
    console.error("❌ Stack trace:", error.stack)
    onError(error)
  }
}
