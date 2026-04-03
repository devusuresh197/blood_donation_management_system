export function sendError(response, error, status = 500) {
  response.status(status).json({
    success: false,
    message: error.message || "Unexpected server error",
  });
}

export function buildSearchClause(search, fields) {
  if (!search) {
    return { clause: "", params: [] };
  }

  const likeValue = `%${search}%`;
  const clause = ` AND (${fields.map((field) => `${field} LIKE ?`).join(" OR ")})`;
  const params = fields.map(() => likeValue);
  return { clause, params };
}
