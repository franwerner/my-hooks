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

type FormValidationErrors<T> = Partial<Record<keyof T, Array<string>>>

const useFormValidation = <T extends object>(initialValues: T, validatorConfig: ValidatorConfig<T>) => {

    const { liveValidation = true, validators, triggerValidation } = validatorConfig

    const [form, setForm] = useState<T>(() => initialValues)
    const [errors, setErrors] = useState<FormValidationErrors<T>>({})

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
        setErrors((prev) => ({
            ...prev,
            ...triggerErrors,
            [name]: error
        }))

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
        return {
            setErrors: () => setErrors(errors),
            hasError: Object.keys(errors).length > 0,
            errors
        }
    }

    return {
        onChange,
        setForm,
        form,
        errors,
        handlerValidationForm
    };
}

export { type FormValidationErrors }
export { useFormValidation };
