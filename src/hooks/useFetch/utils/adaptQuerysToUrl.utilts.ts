import { UseFetch } from ".."

const adaptQuerysToUrl = (querys: UseFetch.QueryParams = {}) => {
    let queryToString = ""
    for (const key in querys) {
        const value = querys[key]
        if (value !== undefined) {
            if (queryToString) {
                queryToString += `&${key}=${value}`
            } else {
                queryToString += `?${key}=${value}`
            }
        }
    }
    return queryToString
}

export default adaptQuerysToUrl