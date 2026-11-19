class AppError extends Error {
  constructor(message, status = 500, code = 'INTERNAL_ERROR', details) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
class BadRequestError extends AppError {
  constructor(message = 'Solicitud inválida', details) { super(message, 400, 'BAD_REQUEST', details); }
}
class UnauthorizedError extends AppError {
  constructor(message = 'No autenticado') { super(message, 401, 'UNAUTHORIZED'); }
}
class ForbiddenError extends AppError {
  constructor(message = 'No tienes permiso para esta acción') { super(message, 403, 'FORBIDDEN'); }
}
class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado') { super(message, 404, 'NOT_FOUND'); }
}

module.exports = { AppError, BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError };
