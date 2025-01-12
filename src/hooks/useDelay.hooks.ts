import {  useRef } from "react"
const useDelay = () => {
    const ref = useRef<number | undefined>(undefined)
    const cleanDelay = () => {
        if (ref.current === undefined) return
        clearTimeout(ref.current)
        ref.current = undefined
    }
    const createDelay = (cb: () => void, delay: number = 0) => {
        cleanDelay()
        if (delay == 0) {
            cb()
        } else {
            const setTime = setTimeout(cb, delay * 1000) as unknown as number
            ref.current = setTime
        }
    }

    return {
        createDelay,
        cleanDelay
    }
}

export {
    useDelay
}