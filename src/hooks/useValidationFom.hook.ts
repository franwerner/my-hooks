import { ChangeEvent, useState } from "react";

type Validator<T> = (value: T[keyof T], form: T) => string[] | void

type Validators<T> = {
    [K in keyof T]?: Validator<T>
}
interface ValidatorConfig<T> {
    validators: Validators<T>
    liveValidation?: boolean,
    triggerValidation?: {
        [K in keyof T]?: Array<Exclude<keyof T, K>>
    }
}

/**
 * @implements
 * La idea de integrar `triggerValidation` es permitir la ejecución de validaciones que dependen de otras propiedades del formulario.
 * Por ejemplo, si tenemos un campo `password` y un campo `confirm_password`, se requiere que cuando el valor de `password` cambie, 
 * se valide automáticamente el campo `confirm_password` para verificar si ambas contraseñas coinciden.
 *
 * @example
 * const triggerValidation = {
 *   password: ['confirm_password'], // Cuando `password` cambia, se valida `confirm_password`
 * };
 * 
 * De esta manera, podemos especificar en el array de `triggerValidation` qué campos deben ser validados cuando otros campos cambian,
 * garantizando que las validaciones se realicen de manera coherente y en tiempo real, según las dependencias entre los campos del formulario.
 */

type SetValidationForm<T> = (name: keyof T, value: T[keyof T]) => { setError: () => void, removeError: () => void }

type FormValidationErrors<T> = Partial<Record<keyof T, Array<string>>>

const useFormValidation = <T extends object>(initialValues: T, validatorConfig: ValidatorConfig<T>) => {

    const { liveValidation = true, validators, triggerValidation } = validatorConfig

    const [form, setForm] = useState<T>(() => initialValues)
    const [errors, setErrors] = useState<{
        list: FormValidationErrors<T>,
        hasError: boolean
    }>({
        list: {},
        hasError: false
    })

    const updateForm = (name: keyof T, value: T[keyof T]) => {
        setForm((prev) => ({
            ...prev,
            [name]: value
        }))
    }

    const onChange = ({ target }: ChangeEvent<HTMLInputElement>) => {
        const { name: n, value: v } = target
        const name = n as keyof T
        const value = v as T[keyof T]

        generateErrors(name, value)
        updateForm(name, value)
    }

    const handlerTriggerValidation = (name: keyof T, currentState: T) => {
        const currentTrigger = triggerValidation && triggerValidation[name]
        const acc = {} as FormValidationErrors<T>
        if (!currentTrigger) return acc
        return currentTrigger.reduce((acc, current) => {
            const key = current as keyof T
            const currentValidator = validators[key]
            if (currentValidator) {
                const result = currentValidator(form[key], currentState)
                acc[key] = result ?? undefined
            }
            return acc
        }, acc)
    }

    const generateErrors = (name: keyof T, value: T[keyof T]) => {
        if (!liveValidation) return
        const currentState = { ...form, [name]: value }
        const currentValidator = validators[name]
        const error = currentValidator && currentValidator(value, currentState)
        const triggerErrors = handlerTriggerValidation(name, currentState)
        setErrors((prev) => {
            const list = {
                ...prev.list,
                ...triggerErrors,
                [name]: error
            }
            return {
                list,
                hasError: Object.entries(list).filter(([_, value]) => value).length > 0
            }
        })

    }

    const handlerValidationForm = () => {
        const entries = Object.entries(validators) as [keyof T, Validator<T>][]
        let errors = {} as FormValidationErrors<T>
        for (const [k, validators] of entries) {
            const key = k as keyof T
            const currentValue = form[key]
            const res = validators(currentValue, form)
            if (res) {
                errors[key] = res
            }
        }
        const hasError = Object.keys(errors).length > 0
        return {
            setErrors: () => {
                if (!hasError) return
                setErrors({ list: errors, hasError })
            },
            hasError,
            errors
        }
    }

    const setValidationForm: SetValidationForm<T> = (name, value) => {
        updateForm(name, value)
        return {
            setError: () => generateErrors(name, value),
            removeError: () => setErrors(prev => {
                const filter = Object.entries(prev.list).filter(([key, value]) => (key !== name) && value)
                return {
                    list: Object.fromEntries(filter) as FormValidationErrors<T>,
                    hasError: filter.length > 0
                }
            }),
        }
    }

    return {
        onChange,
        setForm: setValidationForm,
        form,
        errors,
        handlerValidationForm
    };
}

export type { FormValidationErrors, SetValidationForm }
export { useFormValidation };

/**
 * Falta refactorizar y crear las funciones fuera del hook, para ahorra recursos.
 */