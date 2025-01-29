import { isFunction, isObject } from "my-utilities"
import { useEffect, useRef, useState } from "react"
import useAbortSignal from "./useAbortSignal.useFetch"
import "./utils/adaptParamsToUrl.utilts"
import adaptParamsToUrl from "./utils/adaptParamsToUrl.utilts"
import adaptQuerysToUrl from "./utils/adaptQuerysToUrl.utilts"
import { useDelay } from "../useDelay.hooks"

declare namespace UseFetch {
    interface SuccessResponse<T> {
        success?: true
        status?: number | string
        result?: T
    }

    interface FailedResponse<U> {
        success?: false
        status?: number | string
        result_error?: U
    }

    type Response<T = any, U = any> = Omit<SuccessResponse<T> & FailedResponse<U>, "success"> & { success?: boolean }

    type QueryParams = { [key: string]: string | number | undefined | null | boolean }

    interface Props<T = any, U = any,> extends Omit<RequestInit, "signal" | "body"> {
        target?: string,
        basename?: string
        query?: QueryParams,
        onSuccess?: (response: Required<SuccessResponse<T>>) => void
        onFailed?: (response: Required<FailedResponse<U>>) => void
        body?: { [key: string]: any }
        delay?: number,
        params?: QueryParams
    }
    type SetRequestProps<T, U> = Omit<Partial<Props<T, U>>, "target" | "basename">
}

/**
 * T = Valores success.
 * U = Valores failed
 * Esto no permite definir que recibira tanto onSuccess y onFailed.
 * la propiedad `result` recibira una combinacion de estos 2 tipos.
 */

/**
 * @is_mounting : Garantiza que el componente se encuentre montado. Esto evita que la lógica (como actualizaciones de estado) 
 * se ejecute fuera del contexto correcto en casos donde el fetch falle, se aborte o se intente actualizar el estado tras el desmontaje.
 * 
*/

const useFetch = <T extends object = {}, U extends object = {}>({
    ...request
}: UseFetch.Props<T, U>) => {
    const { abortSignal, createSignal, setSignalUsed, getSignal } = useAbortSignal()
    const { createDelay, cleanDelay } = useDelay()

    const ref = useRef({ is_mounting: true, request_id: 0 })

    const [isLoading, setLoading] = useState<boolean>(false)
    const [response, setResponse] = useState<UseFetch.Response<T, U>>({
        result: undefined,
        result_error: undefined,
        success: undefined,
        status: undefined
    })
    const setRequest = (props: UseFetch.SetRequestProps<T, U> = {}) => {
        const currentProps = { ...request, ...props }
        const { target = "/", query, onSuccess, onFailed, body = {}, params = {}, delay, method = "GET", basename = "", ...rest } = currentProps
        const contextID = ++ref.current.request_id
        abortSignal()
        createDelay(async () => { //Si es 0, se ejecuta todo de manera sincrona.
            createSignal()
            {
                const concatTarget = `${adaptParamsToUrl(params, basename + target)}${adaptQuerysToUrl(query)}`.replaceAll("//", "/")
                try {
                    setLoading(true)
                    setSignalUsed(true)
                    const res = await fetch(concatTarget, {
                        ...rest,
                        ...(method.toLowerCase() === "get" ? {} : { body: JSON.stringify(body) }),
                        signal: getSignal().signal,
                        method
                    })
                    const json = await res.json() //Si la señal se aborta, inclusive despues de que el fetch se resuelvan esto se ejectura de manera sincrona y dara error.
                    if (!res.ok) throw {
                        status: res.status,
                        result_error: json,
                    }
                    const response: Required<UseFetch.SuccessResponse<T>> = {
                        status: res.status,
                        success: true,
                        result: json,
                    }
                    if (!ref.current.is_mounting || ref.current.request_id !== contextID) return
                    isFunction(onSuccess) && onSuccess(response)
                    setResponse({
                        ...response,
                        result_error: undefined
                    })
                } catch (error: unknown) {
                    if (!ref.current.is_mounting || ref.current.request_id !== contextID) return
                    const isFailedResponse = (isObject(error) ? error : {}) as Required<UseFetch.FailedResponse<U>>
                    const response: Required<UseFetch.FailedResponse<U>> = {
                        result_error: isFailedResponse.result_error ?? {},
                        status: isFailedResponse.status ?? 500,
                        success: false
                    }
                    isFunction(onFailed) && onFailed(response)
                    setResponse({
                        ...response,
                        result: undefined
                    })
                }
                finally {
                    if (!ref.current.is_mounting || ref.current.request_id !== contextID) return
                    setSignalUsed(false)
                    setLoading(false)
                }
            }
        }, delay)

    }

    const clearSideEffects = () => {
        abortSignal()
        cleanDelay()
    }

    useEffect(() => {
        ref.current.is_mounting = true
        return () => {
            ref.current.is_mounting = false
            clearSideEffects()
        }
    }, [])

    return {
        isLoading,
        response,
        setRequest,
        clearSideEffects
    }
}

export type { UseFetch }

export {
    useFetch
}




