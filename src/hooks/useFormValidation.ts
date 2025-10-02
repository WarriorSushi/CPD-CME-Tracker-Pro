import { useState, useCallback } from 'react';

/**
 * Generic form validation hook
 * Provides state and methods for managing form errors
 */
export function useFormValidation<T extends Record<string, any>>(
  initialErrors: Partial<T> = {}
) {
  const [errors, setErrors] = useState<Partial<T>>(initialErrors);
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  /**
   * Set error for a specific field
   */
  const setFieldError = useCallback((field: keyof T, error?: string) => {
    setErrors(prev => ({
      ...prev,
      [field]: error,
    }));
  }, []);

  /**
   * Clear error for a specific field
   */
  const clearFieldError = useCallback((field: keyof T) => {
    setErrors(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  /**
   * Mark field as touched (for showing validation on blur)
   */
  const setFieldTouched = useCallback((field: keyof T, isTouched = true) => {
    setTouched(prev => ({
      ...prev,
      [field]: isTouched,
    }));
  }, []);

  /**
   * Validate a single field with a validation function
   */
  const validateField = useCallback(
    (field: keyof T, value: any, validator: (value: any) => string | undefined) => {
      const error = validator(value);
      if (error) {
        setFieldError(field, error);
      } else {
        clearFieldError(field);
      }
      return !error;
    },
    [setFieldError, clearFieldError]
  );

  /**
   * Validate entire form with validation schema
   */
  const validateForm = useCallback(
    (values: T, validators: Partial<Record<keyof T, (value: any) => string | undefined>>) => {
      const newErrors: Partial<T> = {};
      let isValid = true;

      Object.keys(validators).forEach((key) => {
        const field = key as keyof T;
        const validator = validators[field];
        if (validator) {
          const error = validator(values[field]);
          if (error) {
            newErrors[field] = error as any;
            isValid = false;
          }
        }
      });

      setErrors(newErrors);
      return isValid;
    },
    []
  );

  /**
   * Reset all errors and touched state
   */
  const resetValidation = useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);

  /**
   * Get error for field only if touched (useful for inline validation)
   */
  const getFieldError = useCallback(
    (field: keyof T): string | undefined => {
      return touched[field] ? (errors[field] as string | undefined) : undefined;
    },
    [errors, touched]
  );

  return {
    errors,
    touched,
    setFieldError,
    clearFieldError,
    setFieldTouched,
    validateField,
    validateForm,
    resetValidation,
    getFieldError,
    hasErrors: Object.keys(errors).length > 0,
  };
}

/**
 * Common validation functions
 */
export const validators = {
  required: (fieldName: string) => (value: any) => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return `${fieldName} is required`;
    }
    return undefined;
  },

  minLength: (fieldName: string, min: number) => (value: string) => {
    if (value && value.length < min) {
      return `${fieldName} must be at least ${min} characters`;
    }
    return undefined;
  },

  maxLength: (fieldName: string, max: number) => (value: string) => {
    if (value && value.length > max) {
      return `${fieldName} must be no more than ${max} characters`;
    }
    return undefined;
  },

  number: (fieldName: string) => (value: string) => {
    if (value && isNaN(Number(value))) {
      return `${fieldName} must be a valid number`;
    }
    return undefined;
  },

  positiveNumber: (fieldName: string) => (value: string) => {
    const num = Number(value);
    if (value && (isNaN(num) || num <= 0)) {
      return `${fieldName} must be a positive number`;
    }
    return undefined;
  },

  email: (fieldName: string) => (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value && !emailRegex.test(value)) {
      return `${fieldName} must be a valid email address`;
    }
    return undefined;
  },

  combine: (...validatorFns: Array<(value: any) => string | undefined>) => (value: any) => {
    for (const validator of validatorFns) {
      const error = validator(value);
      if (error) return error;
    }
    return undefined;
  },
};
