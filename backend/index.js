import Fastify from "fastify"
import cors from "@fastify/cors"
import routes from "./src/routes/index.js"
import "dotenv/config"
const fastify = Fastify({
  logger: true,
})

await fastify.register(cors, {
  origin: ["http://localhost:3000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Accept", "Authorization", "Cache-Control"],
  exposedHeaders: ["Content-Type", "Cache-Control", "Connection"],
})

fastify.register(routes)

fastify.listen({ port: process.env.PORT || 3001 }, function (err, address) {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
  fastify.log.info(`Server listening on ${address}`)
})
