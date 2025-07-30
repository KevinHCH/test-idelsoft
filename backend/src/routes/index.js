import DB from "../db/index.js"
import { streamEmailGeneration, generateEmailContent } from "../ai.js"

export default async function routes(fastify, options) {
  fastify.get("/ping", async (request, reply) => {
    return "pong\n"
  })

  fastify.get("/emails", async (request, reply) => {
    try {
      const emails = await DB.getAllEmails()
      return { emails }
    } catch (error) {
      fastify.log.error(error)
      reply.code(500).send({ error: "Failed to fetch emails" })
    }
  })

  fastify.get("/emails/:id", async (request, reply) => {
    try {
      const { id } = request.params
      const email = await DB.getEmailById(id)

      if (!email) {
        return reply.code(404).send({ error: "Email not found" })
      }

      return { email }
    } catch (error) {
      fastify.log.error(error)
      reply.code(500).send({ error: "Failed to fetch email" })
    }
  })

  fastify.post("/emails", async (request, reply) => {
    try {
      const { to, cc, bcc, subject, body } = request.body

      if (!to || !subject || !body) {
        return reply.code(400).send({
          error: "Missing required fields: to, subject, body",
        })
      }

      const email = await DB.createEmail({ to, cc, bcc, subject, body })
      reply.code(201).send({ email })
    } catch (error) {
      fastify.log.error(error)
      reply.code(500).send({ error: "Failed to create email" })
    }
  })

  fastify.put("/emails/:id", async (request, reply) => {
    try {
      const { id } = request.params
      const { to, cc, bcc, subject, body } = request.body

      const existingEmail = await DB.getEmailById(id)
      if (!existingEmail) {
        return reply.code(404).send({ error: "Email not found" })
      }

      const email = await DB.updateEmail(id, { to, cc, bcc, subject, body })
      return { email }
    } catch (error) {
      fastify.log.error(error)
      reply.code(500).send({ error: "Failed to update email" })
    }
  })

  fastify.delete("/emails/:id", async (request, reply) => {
    try {
      const { id } = request.params

      const existingEmail = await DB.getEmailById(id)
      if (!existingEmail) {
        return reply.code(404).send({ error: "Email not found" })
      }

      await DB.deleteEmail(id)
      reply.code(204).send()
    } catch (error) {
      fastify.log.error(error)
      reply.code(500).send({ error: "Failed to delete email" })
    }
  })

  fastify.post("/ai/generate-email", async (request, reply) => {
    try {
      const { prompt, recipientInfo } = request.body

      if (!prompt) {
        return reply.code(400).send({ error: "Prompt is required" })
      }

      const { assistantType, stream } = await streamEmailGeneration(
        prompt,
        recipientInfo
      )
      reply.header("Content-Type", "text/event-stream")
      reply.header("Cache-Control", "no-cache")
      reply.header("Connection", "keep-alive")
      reply.raw.write(
        `data: ${JSON.stringify({
          type: "assistant_type",
          data: assistantType,
        })}\n\n`
      )

      console.log("Sent assistant type:", assistantType)
      console.log("Starting streaming generation...")
      let buffer = ""
      let lastSubject = ""
      let lastBody = ""
      let hasStreamedSubject = false
      let hasStreamedBody = false

      for await (const chunk of stream) {
        console.log("Received chunk:", JSON.stringify(chunk))

        if (chunk.text) {
          buffer += chunk.text
          console.log("Current buffer:", buffer)
          const subjectMatch = buffer.match(/"subject"\s*:\s*"([^"]*)"/)
          if (
            subjectMatch &&
            subjectMatch[1] &&
            subjectMatch[1] !== lastSubject
          ) {
            lastSubject = subjectMatch[1]
            console.log("Found subject:", lastSubject)
            if (!hasStreamedSubject || lastSubject.length > 0) {
              reply.raw.write(
                `data: ${JSON.stringify({
                  type: "subject",
                  data: lastSubject,
                })}\n\n`
              )
              hasStreamedSubject = true
            }
          }

          const bodyMatch = buffer.match(/"body"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/)
          if (bodyMatch && bodyMatch[1] && bodyMatch[1] !== lastBody) {
            lastBody = bodyMatch[1].replace(/\\"/g, '"').replace(/\\n/g, "\n")
            console.log("Found body:", lastBody)
            if (!hasStreamedBody || lastBody.length > 0) {
              reply.raw.write(
                `data: ${JSON.stringify({
                  type: "body",
                  data: lastBody,
                })}\n\n`
              )
              hasStreamedBody = true
            }
          }

          try {
            let cleanBuffer = buffer.trim()
            if (cleanBuffer.startsWith("```json")) {
              cleanBuffer = cleanBuffer.replace(/^```json\s*/, "")
            }
            if (cleanBuffer.endsWith("```")) {
              cleanBuffer = cleanBuffer.replace(/\s*```$/, "")
            }

            if (cleanBuffer.startsWith("{") && cleanBuffer.endsWith("}")) {
              const emailData = JSON.parse(cleanBuffer)
              if (emailData.subject && emailData.subject !== lastSubject) {
                reply.raw.write(
                  `data: ${JSON.stringify({
                    type: "subject",
                    data: emailData.subject,
                  })}\n\n`
                )
                lastSubject = emailData.subject
              }

              if (emailData.body && emailData.body !== lastBody) {
                reply.raw.write(
                  `data: ${JSON.stringify({
                    type: "body",
                    data: emailData.body,
                  })}\n\n`
                )
                lastBody = emailData.body
              }
            }
          } catch (parseError) {}
        }
      }

      if (!hasStreamedSubject || !hasStreamedBody) {
        console.log(
          "No content generated via streaming, using fallback generation..."
        )

        try {
          const { generateEmailContent } = await import("../ai.js")
          const fallbackResult = await generateEmailContent(
            prompt,
            recipientInfo
          )

          if (!hasStreamedSubject && fallbackResult.subject) {
            console.log("Sending fallback subject:", fallbackResult.subject)
            reply.raw.write(
              `data: ${JSON.stringify({
                type: "subject",
                data: fallbackResult.subject,
              })}\n\n`
            )
          }

          if (!hasStreamedBody && fallbackResult.body) {
            console.log("Sending fallback body:", fallbackResult.body)
            reply.raw.write(
              `data: ${JSON.stringify({
                type: "body",
                data: fallbackResult.body,
              })}\n\n`
            )
          }
        } catch (fallbackError) {
          console.error("Fallback generation failed:", fallbackError)
        }
      }

      console.log("Sending completion signal")
      reply.raw.write(`data: ${JSON.stringify({ type: "complete" })}\n\n`)
      reply.raw.end()
    } catch (error) {
      fastify.log.error("AI generation error:", error)
      console.error("Detailed error:", error)

      if (!reply.sent) {
        try {
          reply.raw.write(
            `data: ${JSON.stringify({
              type: "error",
              data: "Failed to generate email content",
            })}\n\n`
          )
          reply.raw.end()
        } catch (writeError) {
          console.error("Error writing error response:", writeError)
          // If we can't write to the stream, try regular error response
          if (!reply.sent) {
            reply.code(500).send({ error: "Failed to generate email content" })
          }
        }
      }
    }
  })

  fastify.post("/ai/generate-email-simple", async (request, reply) => {
    try {
      const { prompt, recipientInfo } = request.body

      if (!prompt) {
        return reply.code(400).send({ error: "Prompt is required" })
      }

      const result = await generateEmailContent(prompt, recipientInfo)

      return result
    } catch (error) {
      fastify.log.error("AI generation error:", error)
      console.error(error)
      reply.code(500).send({ error: "Failed to generate email content" })
    }
  })
}
