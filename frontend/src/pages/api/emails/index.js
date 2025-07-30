const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001"

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const response = await fetch(`${BACKEND_URL}/emails`)
      const emails = await response.json()
      res.status(response.status).json(emails)
    } catch (error) {
      console.error("API Error:", error)
      res.status(500).json({ error: "Internal Server Error" })
    }
  } else if (req.method === "POST") {
    try {
      const response = await fetch(`${BACKEND_URL}/emails`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body),
      })
      const newEmail = await response.json()
      res.status(response.status).json(newEmail)
    } catch (error) {
      console.error("API Error:", error)
      res.status(500).json({ error: "Internal Server Error" })
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
