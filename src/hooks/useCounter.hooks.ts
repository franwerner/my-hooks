import { isFunction } from "my-utilities"
import { useEffect, useState } from "react"

interface UseCounterProps {
    hours?: number
    minutes?: number
    seconds?: number,
    milliseconds?: number
    type?: "increment" | "decrement",
    stop?: boolean,
    step?: number,
    onFinish?: () => void,
}

const hourInSeconds = 3600
const minuteInSeconds = 60

const ensureGreaterThanZero  = (n = 0) => n <= 0 ? 0 : n

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

    /**
  * Los valores de tiempo proporcionados no deben cambiar entre los renderizados.
  * Utilizar una expresión como `expired_at - Date.now()` es incorrecto, ya que en cada renderizado
  * el valor de `calculateSeconds` se recalcularía, lo que podría llevarlo a ser siempre
  * mayor o menor que `count`, haciendo que el contador no funcione como se espera.
  * 
  * Para evitar este problema, es necesario que los valores no cambian en cada renderizado.
  * Si pueden cambiar, unicamente si los valores proporcionados son mediante un estado, el cual mantiene el valor statico entre renderizados.
  */

    const hoursToSeconds = ensureGreaterThanZero (hours) * hourInSeconds
    const minutesToSeconds = ensureGreaterThanZero (minutes) * minuteInSeconds
    const millisecondsToSeconds = ensureGreaterThanZero (milliseconds) / 1000
    const calculateSeconds = (hoursToSeconds + minutesToSeconds + ensureGreaterThanZero (seconds) + millisecondsToSeconds)
    const [count, setCount] = useState(type == "decrement" ? calculateSeconds : 0)

    const hoursResidue = Math.floor(count / hourInSeconds)
    const minutesResidue = Math.floor((count % hourInSeconds) / minuteInSeconds)
    const secondsResidue = Math.floor((count % hourInSeconds) % minuteInSeconds)

    useEffect(() => {
        if (stop) return
        const interval = setInterval(() => {

            const nextCount = type === "decrement" ? count - verifyStep : count + verifyStep
            let currentCount = 0
            if (nextCount <= 0 || nextCount >= calculateSeconds) {
                clearInterval(interval)
                isFunction(onFinish) && onFinish()
                currentCount = type === "decrement" ? 0 : calculateSeconds

            } else {
                currentCount = nextCount
            }

            setCount(currentCount)
        }, verifyStep * 1000)
        return () => clearInterval(interval)
    }, [stop, count, type, step])

    const resetCounter = () => {
        setCount(type == "decrement" ? calculateSeconds : 0)
    }


    return {
        hours: hoursResidue,
        minutes: minutesResidue,
        seconds: secondsResidue,
        isFinish: count <= 0 || count >= calculateSeconds,
        resetCounter
    }
}

export {
    type UseCounterProps
}
export {
    useCounter
}