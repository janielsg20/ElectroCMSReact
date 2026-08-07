export abstract class ElectroCmsError extends Error {
  abstract readonly code: string;

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
  }
}

export class ValidationError extends ElectroCmsError {
  readonly code = 'VALIDATION_ERROR';
}

export class NotFoundError extends ElectroCmsError {
  readonly code = 'NOT_FOUND';
}

export class ConflictError extends ElectroCmsError {
  readonly code = 'CONFLICT';
}

export class PersistenceError extends ElectroCmsError {
  readonly code = 'PERSISTENCE_ERROR';
}

export class MigrationError extends ElectroCmsError {
  readonly code = 'MIGRATION_ERROR';
}
