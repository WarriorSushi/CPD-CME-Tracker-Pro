import React, { useCallback } from 'react';
import { Input } from '../common/Input';

export interface FormFieldProps {
  /**
   * Field label
   */
  label: string;

  /**
   * Current field value
   */
  value: string;

  /**
   * Change handler
   */
  onChangeText: (text: string) => void;

  /**
   * Blur handler (for validation)
   */
  onBlur?: () => void;

  /**
   * Validation error message
   */
  error?: string;

  /**
   * Validation function - returns error message or undefined
   */
  validator?: (value: string) => string | undefined;

  /**
   * Enable real-time validation on change
   */
  validateOnChange?: boolean;

  /**
   * Callback when validation state changes
   */
  onValidationChange?: (isValid: boolean, error?: string) => void;

  /**
   * All other Input props
   */
  [key: string]: any;
}

/**
 * FormField - Input wrapper with integrated validation
 *
 * Features:
 * - Automatic validation on change/blur
 * - Error display
 * - Validation callback
 * - Passes through all Input props
 */
export const FormField = React.memo<FormFieldProps>(({
  label,
  value,
  onChangeText,
  onBlur,
  error,
  validator,
  validateOnChange = false,
  onValidationChange,
  ...inputProps
}) => {
  const handleChange = useCallback(
    (text: string) => {
      onChangeText(text);

      // Real-time validation if enabled
      if (validateOnChange && validator) {
        const validationError = validator(text);
        onValidationChange?.(!validationError, validationError);
      }
    },
    [onChangeText, validateOnChange, validator, onValidationChange]
  );

  const handleBlur = useCallback(() => {
    onBlur?.();

    // Validate on blur
    if (validator) {
      const validationError = validator(value);
      onValidationChange?.(!validationError, validationError);
    }
  }, [onBlur, validator, value, onValidationChange]);

  return (
    <Input
      label={label}
      value={value}
      onChangeText={handleChange}
      onBlur={handleBlur}
      error={error}
      {...inputProps}
    />
  );
});

FormField.displayName = 'FormField';
