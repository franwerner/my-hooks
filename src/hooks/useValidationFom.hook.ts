import { isString } from "my-utilities";
import { ChangeEvent, useCallback, useState } from "react";


type FieldValidationParams<T> = {
    fieldName: keyof T
    value: any
    currentState: FormValidation<T>
}

type HandlerValidatorForm<T> = (params: FieldValidationParams<T>) => string[] | string | undefined;


type FormValidation<T> = {
    [K in keyof T]: {
        value: T[K]
        errors: string[]
        hasError: boolean
    }
}

const initializeFormState = <T extends object>(initialValues: T) => {
    const formState = {} as FormValidation<T>;
    for (const key in initialValues) {
        const initialValue = initialValues[key];
        formState[key] = {
            value: initialValue,
            errors: [],
            hasError: false,
        }
    }
    return formState
}

const validateField = <T extends object>(
    validator: HandlerValidatorForm<T>,
    fieldParams: FieldValidationParams<T>
) => {
    const validationResult = validator(fieldParams)
    if (Array.isArray(validationResult)) {
        return validationResult
    } else if (isString(validationResult)) {
        return [validationResult]
    }
    return []
}

const useFormValidation = <T extends object>(initialValues: T, validator: HandlerValidatorForm<T>) => {

    const [form, setForm] = useState<FormValidation<T>>(() => initializeFormState(initialValues))

    const onChange = ({ target }: ChangeEvent<HTMLInputElement>) => {
        const { value, name } = target
        setForm((prev) => {
            const validationErrors = validateField(validator, {
                fieldName: name as keyof T,
                value,
                currentState: prev,
            })
            return {
                ...prev,
                [name]: {
                    value,
                    errors: validationErrors,
                    hasError: validationErrors.length > 0,
                },
            }
        })
    }

    const isFormIncomplete = () => {
        for (const key in form) {
            const fieldName = key as keyof T
            const validationErrors = validateField(validator, {
                fieldName,
                value: form[fieldName].value,
                currentState: form,
            })
            if (validationErrors.length > 0) return true
        }
    }

    const setValue = useCallback((property: keyof T, value: unknown) => {
        setForm((prev) => ({
            ...prev,
            [property]: {
                ...prev[property],
                value 
            }
        }))
    }, [])


    return {
        onChange,
        form,
        isFormIncomplete,
        setValue
    };
}

export {
    type FormValidation,
    type  HandlerValidatorForm
};
export default useFormValidation