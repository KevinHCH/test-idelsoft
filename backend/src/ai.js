import { GoogleGenAI, Type } from "@google/genai"
import { z } from "zod"

const MODEL_ID = "gemini-2.5-flash"
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
})

// Response schemas for structured output using Google GenAI Type system
const assistantTypeSchema = {
  type: Type.OBJECT,
  properties: {
    type: {
      type: Type.STRING,
      enum: ["sales", "followup"],
      description: "Type of email assistant to use",
    },
  },
  required: ["type"],
}

const emailSchema = {
  type: Type.OBJECT,
  properties: {
    subject: {
      type: Type.STRING,
      description: "Email subject line",
    },
    body: {
      type: Type.STRING,
      description: "Email body content",
    },
  },
  required: ["subject", "body"],
}

const salesEmailSchema = {
  type: Type.OBJECT,
  properties: {
    subject: {
      type: Type.STRING,
      description: "Sales email subject line (concise and compelling)",
    },
    body: {
      type: Type.STRING,
      description:
        "Sales email body (maximum 40 words total, 7-10 words per sentence, include value proposition and call-to-action)",
    },
  },
  required: ["subject", "body"],
}

const followupEmailSchema = {
  type: Type.OBJECT,
  properties: {
    subject: {
      type: Type.STRING,
      description: "Follow-up email subject line (professional and contextual)",
    },
    body: {
      type: Type.STRING,
      description:
        "Follow-up email body (polite, brief, includes context from previous interaction)",
    },
  },
  required: ["subject", "body"],
}

// Zod schemas for validation
export const emailZodSchema = z.object({
  subject: z.string().describe("Email subject line"),
  body: z.string().describe("Email body content"),
})

export const assistantTypeZodSchema = z.object({
  type: z
    .enum(["sales", "followup"])
    .describe("Type of email assistant to use"),
})

export const salesEmailZodSchema = z.object({
  subject: z
    .string()
    .describe("Sales email subject line (concise and compelling)"),
  body: z
    .string()
    .describe(
      "Sales email body (maximum 40 words total, 7-10 words per sentence, include value proposition and call-to-action)"
    ),
})

export const followupEmailZodSchema = z.object({
  subject: z
    .string()
    .describe("Follow-up email subject line (professional and contextual)"),
  body: z
    .string()
    .describe(
      "Follow-up email body (polite, brief, includes context from previous interaction)"
    ),
})

/**
 * Router Assistant - Classifies email requests and determines assistant type
 * @param {string} prompt - User's email generation request
 * @returns {Promise<string>} - Assistant type ('sales' | 'followup')
 */
export async function routeToAssistant(prompt) {
  const routerPrompt = `Classify this email request. Respond with exactly one word: "sales" or "followup"

Request: "${prompt}"

If it's about selling, pitching, or promoting something, respond: sales
If it's about following up, checking in, or reminding, respond: followup

Answer:`

  try {
    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: routerPrompt,
      config: {
        temperature: 0.1,
      },
    })

    console.log("🔍 Full Router Response:", JSON.stringify(response, null, 2))
    console.log("🔍 Response candidates:", response.candidates)

    const responseText = response.text?.trim().toLowerCase()
    console.log("📝 Router response text:", JSON.stringify(responseText))

    if (!responseText) {
      console.warn("⚠️ No response text from router, defaulting to followup")
      return "followup"
    }

    if (responseText.includes("sales")) {
      console.log("✅ Router classified as: SALES")
      return "sales"
    } else {
      console.log("✅ Router classified as: FOLLOWUP")
      return "followup"
    }
  } catch (error) {
    console.error("Router assistant error:", error)
    return "followup" // fallback
  }
}

/**
 * Sales Assistant - Generates concise sales emails using structured output
 * @param {string} prompt - User's sales email request
 * @param {string} recipientInfo - Additional context about recipient
 * @returns {Promise<{subject: string, body: string}>}
 */
export async function generateSalesEmail(prompt, recipientInfo = "") {
  const salesPrompt = `
Generate a concise sales email with SUBJECT and BODY based on the user's request.

STRICT REQUIREMENTS:
- Maximum 40 words total in the body
- Maximum 7-10 words per sentence
- Focus on value proposition
- Include a clear call-to-action
- Professional but friendly tone

Format your response EXACTLY like this:
SUBJECT: [your subject line]
BODY: [your email body]

User request: "${prompt}"
${recipientInfo ? `Recipient context: "${recipientInfo}"` : ""}
`

  try {
    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: salesPrompt,
      config: {
        temperature: 0.7,
      },
    })

    const responseText = response.text?.trim()
    console.log("Sales assistant response text:", responseText)

    if (!responseText) {
      throw new Error("Empty response from sales AI")
    }

    // Parse simple format
    const subjectMatch = responseText.match(/SUBJECT:\s*(.+)/i)
    const bodyMatch = responseText.match(/BODY:\s*(.+)/i)

    return {
      subject: subjectMatch?.[1]?.trim() || "Sales Opportunity",
      body:
        bodyMatch?.[1]?.trim() || "Thank you for your interest. Let's connect!",
    }
  } catch (error) {
    console.error("Sales assistant error:", error)
    return {
      subject: "Sales Opportunity",
      body: "Thank you for your interest. Let's connect!",
    }
  }
}

/**
 * Follow-up Assistant - Generates polite follow-up emails using structured output
 * @param {string} prompt - User's follow-up email request
 * @returns {Promise<{subject: string, body: string}>}
 */
export async function generateFollowupEmail(prompt) {
  const followupPrompt = `
Generate a polite, professional follow-up email with SUBJECT and BODY based on the user's request.

Guidelines:
- Polite and respectful tone
- Brief and to the point
- Include context from previous interaction
- Professional closing

Format your response EXACTLY like this:
SUBJECT: [your subject line]
BODY: [your email body]

User request: "${prompt}"
`

  try {
    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: followupPrompt,
      config: {
        temperature: 0.6,
      },
    })

    const responseText = response.text?.trim()
    console.log("Followup assistant response text:", responseText)

    if (!responseText) {
      throw new Error("Empty response from followup AI")
    }

    // Parse simple format
    const subjectMatch = responseText.match(/SUBJECT:\s*(.+)/i)
    const bodyMatch = responseText.match(/BODY:\s*(.+)/i)

    return {
      subject: subjectMatch?.[1]?.trim() || "Follow-up",
      body:
        bodyMatch?.[1]?.trim() ||
        "I wanted to follow up on our previous conversation.",
    }
  } catch (error) {
    console.error("Follow-up assistant error:", error)
    return {
      subject: "Follow-up",
      body: "I wanted to follow up on our previous conversation.",
    }
  }
}

/**
 * Stream AI Email Generation - Uses Google GenAI streaming
 * @param {string} prompt - User's email generation request
 * @param {string} recipientInfo - Additional context about recipient
 * @returns {Promise<{assistantType: string, stream: AsyncGenerator}>} - Streaming response
 */
export async function streamEmailGeneration(prompt, recipientInfo = "") {
  // Step 1: Determine assistant type
  const assistantType = await routeToAssistant(prompt)

  // Step 2: Create appropriate prompt based on assistant type
  let systemPrompt
  if (assistantType === "sales") {
    systemPrompt = `
Generate a concise sales email based on the user's request.

STRICT REQUIREMENTS:
- Maximum 40 words total in the body
- Maximum 7-10 words per sentence
- Focus on value proposition
- Include a clear call-to-action
- Professional but friendly tone

User request: "${prompt}"
${recipientInfo ? `Recipient context: "${recipientInfo}"` : ""}

Format the response as JSON with "subject" and "body" fields.
`
  } else {
    systemPrompt = `
Generate a polite, professional follow-up email based on the user's request.

Guidelines:
- Polite and respectful tone
- Brief and to the point
- Include context from previous interaction
- Professional closing

User request: "${prompt}"

Format the response as JSON with "subject" and "body" fields.
`
  }

  // Step 3: Create streaming response with JSON format instruction
  const stream = await ai.models.generateContentStream({
    model: MODEL_ID,
    contents: systemPrompt,
    config: {
      maxOutputTokens: assistantType === "sales" ? 150 : 200,
      temperature: assistantType === "sales" ? 0.7 : 0.6,
    },
  })

  return {
    assistantType,
    stream,
  }
}

/**
 * Generate Email (Non-streaming) - For simple API requests using structured output
 * @param {string} prompt - User's email generation request
 * @param {string} recipientInfo - Additional context about recipient
 * @returns {Promise<{assistantType: string, subject: string, body: string}>}
 */
export async function generateEmailContent(prompt, recipientInfo = "") {
  // Determine assistant type
  const assistantType = await routeToAssistant(prompt)

  // Generate content based on assistant type using structured output
  let emailData
  if (assistantType === "sales") {
    emailData = await generateSalesEmail(prompt, recipientInfo)
  } else {
    emailData = await generateFollowupEmail(prompt)
  }

  return {
    assistantType,
    subject: emailData.subject,
    body: emailData.body,
  }
}
