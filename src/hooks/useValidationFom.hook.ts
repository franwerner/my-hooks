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
type FormValidationErrors<T> = Partial<Record<keyof T, Array<string>>>

type SetValidationForm<T> = (form: Partial<T>) =>  { errors: FormValidationErrors<T>, hasError: boolean } 

const listHasError = <T>(list: FormValidationErrors<T>) => Object.entries(list).filter(([_, value]) => value).length > 0

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

    const handlerTriggerValidation = (name: keyof T, currentState: T, omit: (keyof T)[] = []) => {
        const currentTrigger = triggerValidation && triggerValidation[name]
        const acc = {} as FormValidationErrors<T>
        if (!currentTrigger) return acc
        const omitTriggers = omit.length > 0 ? currentTrigger.filter(i => !omit.includes(i)) : currentTrigger
        return omitTriggers.reduce((acc, current) => {
            const key = current as keyof T
            const currentValidator = validators[key]
            if (currentValidator) {
                const result = currentValidator(currentState[key], currentState)
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
                hasError: listHasError(list)
            }
        })
        return error
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
            setErrors: () => setErrors({ list: errors, hasError }),
            hasError,
            errors
        }
    }

    const setValidationForm: SetValidationForm<T> = (newForm) => {
        setForm(prev => ({ ...prev, ...newForm }))

        const currentState = { ...form, ...newForm }
        let errors = {} as FormValidationErrors<T>
        let omits = Object.keys(newForm) as (keyof T)[]
        for (const k in newForm) {
            const key = k as keyof T
            const validator = validators[k]
            const value = newForm[key] as any
            const res = validator && validator(value, currentState)
            const trigger = handlerTriggerValidation(key, currentState, omits)
            errors = {
                ...errors,
                ...trigger,
                [k]: res,
            }
        }
        setErrors(prev => {
            const list = {
                ...prev.list,
                ...errors
            }
            return {
                list,
                hasError: listHasError(list)
            }
        })
        return {
            errors,
            hasError: listHasError(errors)
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