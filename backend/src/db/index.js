import knex from "knex"

const db = knex({
  client: "sqlite3",
  connection: {
    filename: "./dev.sqlite3",
  },
  useNullAsDefault: true,
})

class DB {
  static async getAllEmails() {
    return db("emails").select("*").orderBy("created_at", "desc")
  }

  static async getEmailById(id) {
    return db("emails").where("id", id).first()
  }

  static async createEmail(data) {
    const [id] = await db("emails").insert(data)
    return this.getEmailById(id)
  }

  static async updateEmail(id, data) {
    await db("emails").where("id", id).update(data)
    return this.getEmailById(id)
  }

  static async deleteEmail(id) {
    return db("emails").where("id", id).del()
  }
}

export default DB
