import { valueCaseInstance, emptyCaseInstance } from './index.js'

export default (typeName, caseNames) => {
    return {
        name: typeName,
        ...Object.fromEntries(
            caseNames.map(
                caseName => [ caseName, (...args) => 
                    args.length 
                        ? valueCaseInstance(typeName, caseName, args[0]) 
                        : emptyCaseInstance(typeName, caseName)
                ]
            )
        )
    }
}