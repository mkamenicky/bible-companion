import { ValidationError } from '@/errors';

/**
 * Validation utilities for repository operations
 */

export type ValidationType = 'string' | 'date' | 'number';

/**
 * Validates input parameters with proper type checking
 */
export function validateInput(value: unknown, type: ValidationType, fieldName: string): void {
  switch (type) {
    case 'string':
      if (!value || typeof value !== 'string' || value.trim().length === 0) {
        throw new ValidationError(`${fieldName} must be a non-empty string`);
      }
      break;

    case 'date':
      if (!(value instanceof Date) || isNaN(value.getTime())) {
        throw new ValidationError(`${fieldName} must be a valid Date`);
      }
      break;

    case 'number':
      if (typeof value !== 'number' || value <= 0 || !Number.isInteger(value)) {
        throw new ValidationError(`${fieldName} must be a positive integer`);
      }
      break;

    default:
      throw new ValidationError(`Invalid validation type: ${type}`);
  }
}

/**
 * Formats a Date object to ISO date string (YYYY-MM-DD)
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Gets the Monday of the current week for a given date
 */
export function getMondayOfWeek(date: Date): string {
  validateInput(date, 'date', 'date');

  const day = date.getDay();
  const monday = new Date(date);
  monday.setDate(date.getDate() - ((day + 6) % 7));
  return formatDate(monday);
}
