const { ApiError } = require("./errors");

function invalid(field, message) {
  throw new ApiError(422, "VALIDATION_ERROR", "Request validation failed", [{ field, message }]);
}

function uuid(value, field) {
  if (typeof value !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
    invalid(field, "Must be a UUID");
  }
  return value.toLowerCase();
}

const validators = {
  name(value) {
    if (typeof value !== "string" || !value.trim() || value.trim().length > 200 || /[\u0000-\u001f\u007f]/.test(value)) {
      invalid("name", "Must be a nonblank string of at most 200 characters without control characters");
    }
    return value.trim();
  },
  email(value) {
    if (typeof value !== "string") invalid("email", "Must be an email address");
    const email = value.trim().toLowerCase();
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || /[\u0000-\u001f\u007f]/.test(email)) {
      invalid("email", "Must be an email address of at most 254 characters");
    }
    return email;
  },
  role(value) {
    if (!["owner", "admin", "developer"].includes(value)) invalid("role", "Must be owner, admin, or developer");
    return value;
  },
  user_id: (value) => uuid(value, "user_id"),
};

function body(req, fields, partial = false) {
  if (!req.is("application/json")) {
    throw new ApiError(415, "UNSUPPORTED_MEDIA_TYPE", "Use Content-Type: application/json");
  }
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) invalid("body", "Must be a JSON object");
  const keys = Object.keys(req.body);
  for (const key of keys) {
    if (!fields.includes(key)) invalid(key, "Unknown or read-only field");
  }
  if (!keys.length) invalid("body", "Provide at least one field");
  const result = {};
  for (const field of fields) {
    if (Object.hasOwn(req.body, field)) result[field] = validators[field](req.body[field]);
    else if (!partial) invalid(field, "This field is required");
  }
  return result;
}

function pagination(query) {
  for (const key of Object.keys(query)) {
    if (!["limit", "offset"].includes(key)) invalid(key, "Unknown query parameter");
  }
  const integer = (value, field, fallback, min, max) => {
    if (value === undefined) return fallback;
    if (typeof value !== "string" || !/^\d+$/.test(value) || !Number.isSafeInteger(Number(value))
      || Number(value) < min || Number(value) > max) invalid(field, `Must be an integer between ${min} and ${max}`);
    return Number(value);
  };
  return { limit: integer(query.limit, "limit", 20, 1, 100), offset: integer(query.offset, "offset", 0, 0, 1000000) };
}

module.exports = { body, uuid, pagination };
