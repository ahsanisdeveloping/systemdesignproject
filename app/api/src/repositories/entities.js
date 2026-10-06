// SQL identifiers come only from this internal allowlist, never request data.
const definitions = {
  users: { columns: "id, name, email, created_at", fields: ["name", "email"] },
  organizations: { columns: "id, name, created_at", fields: ["name"] },
};

function entities(db, table) {
  const definition = definitions[table];
  if (!definition) throw new Error("Unknown entity table");
  const { columns, fields } = definition;
  return {
    async list({ limit, offset }) {
      return (await db.query(`SELECT ${columns} FROM ${table} ORDER BY created_at, id LIMIT $1 OFFSET $2`, [limit, offset])).rows;
    },
    async get(id) {
      return (await db.query(`SELECT ${columns} FROM ${table} WHERE id = $1`, [id])).rows[0];
    },
    async create(data) {
      const placeholders = fields.map((_, index) => `$${index + 1}`).join(", ");
      return (await db.query(`INSERT INTO ${table} (${fields.join(", ")}) VALUES (${placeholders}) RETURNING ${columns}`, fields.map(field => data[field]))).rows[0];
    },
    async update(id, data) {
      const supplied = fields.filter(field => Object.hasOwn(data, field));
      const assignments = supplied.map((field, index) => `${field} = $${index + 2}`).join(", ");
      return (await db.query(`UPDATE ${table} SET ${assignments} WHERE id = $1 RETURNING ${columns}`, [id, ...supplied.map(field => data[field])])).rows[0];
    },
    async remove(id) {
      return (await db.query(`DELETE FROM ${table} WHERE id = $1 RETURNING id`, [id])).rows[0];
    },
  };
}

module.exports = entities;
