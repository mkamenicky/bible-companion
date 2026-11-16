import {ValidationError} from '@/errors';

/**
 * Validation helpers shared by services and repositories.
 */
export type ValidationType = 'string' | 'date' | 'number';

/**
 * Validates an input value and throws a ValidationError when it is invalid.
 *
 * 'number' means a non-negative integer. Zero is allowed on purpose: Bible
 * verse ids start at 0 (Genesis 1:1), so "must be positive" checks are wrong.
 */
export function validateInput(value: unknown, type: ValidationType, fieldName: string): void {
    switch (type) {
        case 'string':
            if (typeof value !== 'string' || value.trim().length === 0) {
                throw new ValidationError(`${fieldName} must be a non-empty string`);
            }
            break;

        case 'date':
            if (!(value instanceof Date) || isNaN(value.getTime())) {
                throw new ValidationError(`${fieldName} must be a valid Date`);
            }
            break;

        case 'number':
            if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
                throw new ValidationError(`${fieldName} must be a non-negative integer`);
            }
            break;

        default:
            throw new ValidationError(`Invalid validation type: ${type}`);
    }
}
