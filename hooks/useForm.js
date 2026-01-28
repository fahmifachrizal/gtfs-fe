// hooks/useForm.js - Form handling hook
import { useState, useCallback } from "react"

/**
 * Hook for form state management and validation
 */
export function useForm(initialValues = {}, validationSchema = {}) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const setValue = useCallback(
    (name, value) => {
      setValues((prev) => ({ ...prev, [name]: value }))

      // Clear error when user starts typing
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: "" }))
      }
    },
    [errors]
  )

  const setFieldError = useCallback((name, error) => {
    setErrors((prev) => ({ ...prev, [name]: error }))
  }, [])

  const setFieldTouched = useCallback((name, touched = true) => {
    setTouched((prev) => ({ ...prev, [name]: touched }))
  }, [])

  const resetForm = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
  }, [initialValues])

  const validate = useCallback(() => {
    const newErrors = {}

    Object.keys(validationSchema).forEach((field) => {
      const rules = validationSchema[field]
      const value = values[field]

      if (rules.required && (!value || value.toString().trim() === "")) {
        newErrors[field] = `${field} is required`
        return
      }

      if (
        value &&
        rules.minLength &&
        value.toString().length < rules.minLength
      ) {
        newErrors[
          field
        ] = `${field} must be at least ${rules.minLength} characters`
        return
      }

      if (
        value &&
        rules.maxLength &&
        value.toString().length > rules.maxLength
      ) {
        newErrors[
          field
        ] = `${field} must be no more than ${rules.maxLength} characters`
        return
      }

      if (value && rules.pattern && !rules.pattern.test(value)) {
        newErrors[field] = rules.message || `${field} format is invalid`
        return
      }

      if (rules.validate && typeof rules.validate === "function") {
        const error = rules.validate(value, values)
        if (error) {
          newErrors[field] = error
        }
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [values, validationSchema])

  const handleSubmit = useCallback(
    (onSubmit) => {
      return async (e) => {
        if (e) e.preventDefault()

        setIsSubmitting(true)

        // Mark all fields as touched
        const touchedFields = {}
        Object.keys(values).forEach((key) => {
          touchedFields[key] = true
        })
        setTouched(touchedFields)

        const isValid = validate()

        if (isValid) {
          try {
            await onSubmit(values)
          } catch (error) {
            console.error("Form submission error:", error)
          }
        }

        setIsSubmitting(false)
      }
    },
    [values, validate]
  )

  const getFieldProps = useCallback(
    (name) => ({
      value: values[name] || "",
      onChange: (e) => setValue(name, e.target.value),
      onBlur: () => setFieldTouched(name, true),
      error: touched[name] && errors[name],
      name,
    }),
    [values, errors, touched, setValue, setFieldTouched]
  )

  return {
    values,
    errors,
    touched,
    isSubmitting,
    setValue,
    setFieldError,
    setFieldTouched,
    resetForm,
    validate,
    handleSubmit,
    getFieldProps,
  }
}
