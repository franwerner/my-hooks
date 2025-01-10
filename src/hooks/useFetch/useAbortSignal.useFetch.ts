import { useRef } from "react"

const useAbortSignal = () => {
    const ref = useRef<AbortController & { inUsed?: boolean }>({} as AbortController & { inUsed?: boolean })
    const abortSignal = () => {
        if (ref.current.abort && ref.current.inUsed && !ref.current.signal.aborted) {
            ref.current.abort("abort-cleanup")
        }
    }
    const setSignalUsed = (value: boolean) => {
        if (!ref.current.signal.aborted) {
            ref.current.inUsed = value
        }
    }
    const createSignal = () => {
        if (!ref.current.signal || ref.current.signal.aborted) {
            ref.current = new AbortController()
        }
    }
    const getSignal = () => ref.current

    return {
        setSignalUsed,
        abortSignal,
        createSignal,
        getSignal,
    }
}

export default useAbortSignal