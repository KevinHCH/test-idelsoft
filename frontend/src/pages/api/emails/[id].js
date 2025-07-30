const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001"

export default async function handler(req, res) {
  const { id } = req.query

  if (req.method === "GET") {
    try {
      const response = await fetch(`${BACKEND_URL}/emails/${id}`)
      const email = await response.json()
      res.status(response.status).json(email)
    } catch (error) {
      console.error("API Error:", error)
      res.status(500).json({ error: "Internal Server Error" })
    }
  } else if (req.method === "PUT") {
    try {
      const response = await fetch(`${BACKEND_URL}/emails/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body),
      })
      const updatedEmail = await response.json()
      res.status(response.status).json(updatedEmail)
    } catch (error) {
      console.error("API Error:", error)
      res.status(500).json({ error: "Internal Server Error" })
    }
  } else if (req.method === "DELETE") {
    try {
      const response = await fetch(`${BACKEND_URL}/emails/${id}`, {
        method: "DELETE",
      })
      res.status(response.status).end()
    } catch (error) {
      console.error("API Error:", error)
      res.status(500).json({ error: "Internal Server Error" })
    }
  } else {
    res.setHeader("Allow", ["GET", "PUT", "DELETE"])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
