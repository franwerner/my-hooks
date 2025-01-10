import { isFunction } from "my-utilities"
import { useEffect, useState } from "react"

interface UseCounterProps {
    hours?: number
    minutes?: number
    seconds?: number,
    milliseconds?:number
    type?: "increment" | "decrement",
    stop?: boolean,
    step?: number,
    onFinish ?: () => void
}

const hourInSeconds = 3600
const minuteInSeconds = 60

const useCounter = ({
    minutes = 0,
    hours = 0,
    seconds = 0,
    milliseconds = 0,
    type = "increment",
    stop = false,
    step = 1,
    onFinish
}: UseCounterProps = {}) => {

    const verifyStep = step <= 1 ? 1 : step 

    const hoursToSeconds = Math.abs(hours) * hourInSeconds
    const minutesToSeconds = Math.abs(minutes) * minuteInSeconds
    const millisecondsToSeconds = Math.abs(milliseconds) / 1000
    const calculateSeconds = (hoursToSeconds + minutesToSeconds + Math.abs(seconds) + millisecondsToSeconds)
    const [count, setCount] = useState(type == "decrement" ? calculateSeconds : 0)

    const hoursResidue = Math.floor(count / hourInSeconds)
    const minutesResidue = Math.floor((count % hourInSeconds) / minuteInSeconds)
    const secondsResidue = Math.floor((count % hourInSeconds) % minuteInSeconds)
    
    useEffect(() => {
        if (stop) return
        const interval = setInterval(() => {
            setCount(prev => {

                const nextCount = type === "decrement" ? prev - verifyStep : prev + verifyStep
                if (nextCount <= 0 || nextCount >= calculateSeconds) {
                    clearInterval(interval)
                    isFunction(onFinish) && onFinish()
                    return type === "decrement" ? 0 : calculateSeconds
                    
                } else {
                    return nextCount
                }
            })
        }, verifyStep * 1000)
        return () => clearInterval(interval)
    }, [stop])

    const resetCounter = () => {
        setCount(type == "decrement" ? calculateSeconds : 0)
    }


    return {
        hours: hoursResidue,
        minutes: minutesResidue,
        seconds: secondsResidue,
        isFinish: count <= 0,
        resetCounter
    }
}

export {
    type UseCounterProps
}
export default useCounter