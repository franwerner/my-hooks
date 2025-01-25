import { isFunction } from "my-utilities";
import { useEffect } from "react";

interface UseKeyBoard {
    isActive?: boolean //ayudamos a que se evite el uso cuando el componente donde es utilizado no esta activo.
    type?: "keydown" | "keypress" | "keyup"
    action?: (e: KeyboardEvent) => void
    key?: string[]
    code?: string[]
    altKey?: boolean
    shiftKey?: boolean
    ctrlKey?: boolean
    preventDefault?: boolean
}


const useKeyboard = ({
    type = "keydown",
    action,
    key = [],
    code = [],
    isActive = true,
    altKey,
    ctrlKey,
    shiftKey,
    preventDefault
}: UseKeyBoard) => {

    useEffect(() => {

        if (!isActive) return

        const processAction = (e: KeyboardEvent) => {

            preventDefault && e.preventDefault()

            if (altKey && !e.altKey || ctrlKey && !e.ctrlKey || shiftKey && !e.shiftKey) return

            if (key.includes(e.key.toLocaleLowerCase()) || code.includes(e.code.toLocaleLowerCase())) {
                isFunction(action) && action(e)
            }
        }

        window.addEventListener(type, processAction)

        return () => {
            window.removeEventListener(type, processAction)
        }

    }, [isActive])


}

export { useKeyboard }
export type { UseKeyBoard }

