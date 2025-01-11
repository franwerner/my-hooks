import { useEffect, useRef } from "react"
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
            const setTime = setTimeout(cb, delay * 1000) as unknown as number
            ref.current = setTime
        }
    }

    useEffect(()=>{
        return () => {
             cleanDelay()
        }
    },[])
    return {
        createDelay,
        cleanDelay
    }
}

export {
    useDelay
}