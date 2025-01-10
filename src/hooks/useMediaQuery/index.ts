
import { useEffect, useMemo, useState } from "react"
import getMediaQuerys, { GetMediaQuery, MediaQueryListEventModify } from "./utils/getMediaQuerys.utils"


const useMediaQuery = <T extends string>(query: GetMediaQuery<T>, watch: boolean = true) => {

    const InitialState = useMemo(() => getMediaQuerys(query), [JSON.stringify(query)])

    const [mediaQuerys, setMediaQuerys] = useState(InitialState)

    useEffect(() => {
        if (!InitialState || !watch) return

        InitialState !== mediaQuerys && setMediaQuerys(InitialState)

        /**
         * @description
         * Si multiples mediaQueries se ejecutan al mismo tiempo, primero se almacenaran en @stackMediaQuerys y unicamente en la primera ejecuccion se creara el @timeout .
         * Luego una vez se libere la @macrotask de los eventos stackeados, se ejecuta el callback del timeout (Siempre el timeout se encoloca luego de los eventos procesados en simultaneo.)
         */

        let stackMediaQuerys = [] as MediaQueryListEventModify[]
        let timeOut: number | null = null

        const onChange = (e: MediaQueryListEventModify) => {
            stackMediaQuerys.push(e)
            if (timeOut) return
            const setT = setTimeout(() => {
                timeOut = null
                setMediaQuerys(prev => {
                    const newStack = stackMediaQuerys.reduce((acc, current) => {
                        return {
                            ...acc,
                            [current.target.name]: current.target
                        }
                    }, prev)
                    stackMediaQuerys = []
                    return newStack
                });
            })
            // @ts-ignore
            timeOut = setT
        }

        for (const key in InitialState) {
            const media = InitialState[key]
            media.addEventListener("change", onChange as EventListener)
        }

        return () => {
            for (const key in InitialState) {
                const media = InitialState[key]
                media.removeEventListener("change", onChange as EventListener)
            }
            if (timeOut) clearTimeout(timeOut)
        }

    }, [InitialState, watch])

    return watch ? mediaQuerys : {} as typeof InitialState

}

 export {
    useMediaQuery
 }



