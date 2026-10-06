class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  let error = err;
  if (!(error instanceof ApiError)) {
    if (err.type === "entity.parse.failed") {
      error = new ApiError(400, "INVALID_JSON", "Invalid request");
    } else if (err.type === "entity.too.large") {
      error = new ApiError(413, "PAYLOAD_TOO_LARGE", "Request body exceeds 100kb");
    } else if (err.code === "23505") {
      const messages = {
        users_email_unique: "A user with this email already exists",
        organization_members_pkey: "This organization membership already exists",
      };
      const message = messages[err.constraint] || "This resource already exists";
      error = new ApiError(409, "CONFLICT", message);
    } else if (err.code === "23503") {
      error = new ApiError(422, "INVALID_REFERENCE", "The referenced user or organization does not exist");
    } else if (["23514", "23502", "22P02"].includes(err.code)) {
      error = new ApiError(422, "VALIDATION_ERROR", "The supplied data violates a database constraint");
    } else if (["ECONNREFUSED", "ECONNRESET", "ETIMEDOUT", "53300", "57P01", "57014"].includes(err.code)
      || /^08/.test(err.code || "") || /connection timeout|timeout exceeded when trying to connect/i.test(err.message || "")) {
      error = new ApiError(503, "DATABASE_UNAVAILABLE", "Database temporarily unavailable");
    } else if (Number.isInteger(err.status) && err.status >= 400 && err.status < 500) {
      error = new ApiError(err.status, "INVALID_REQUEST", "Invalid request");
    } else {
      error = new ApiError(500, "INTERNAL_ERROR", "Internal server error");
    }
  }
  if (error.status >= 500) {
    console.error("API request failed", { requestId: req.requestId, code: err.code || error.code });
  }
  res.status(error.status).json({
    error: {
      code: error.code,
      message: error.message,
      ...(error.details ? { details: error.details } : {}),
    },
    requestId: req.requestId,
  });
}

module.exports = { ApiError, errorHandler };
