import { useRef } from "react"
const useDelay = () => {
    const ref = useRef<number | undefined>(undefined)
    const cleanDelay = () => {
        clearTimeout(ref.current)
    }
    const createDelay = (cb: () => void, delay: number = 0) => {
        cleanDelay()
        if (delay == 0){
            cb()
        }else {
            const setTime = setTimeout(cb, delay) as unknown as number
            ref.current = setTime
        }
    }
    return {
        createDelay,
        cleanDelay
    }
}

export default useDelay