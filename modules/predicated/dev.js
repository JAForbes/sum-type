function PredicatedLibDev(toString, handleError){

    function SumType(name, cases){

      var type =
        Object.keys(cases)
          .reduce(function(p, k){
            var predicate =
              cases[k]

            p[k] = function(value){
              if( !predicate(value) ){
                return handleError({
                  case: k
                  ,predicate: predicate
                  ,value: value
                  ,message: 'Value: '
                    + toString(value)
                    + ' did not satisfy the constraint for '
                    + name+'.'+k
                    + ': '
                    + toString(predicate)
                })
              } else {
                function instance$toString(){
                  return name+'.'+k+'('+ (value) +')'
                }
                return {
                  type: name
                  ,case: k
                  ,value: value
                  ,toString: instance$toString
                  ,inspect: instance$toString
                }
              }
            }

            return p
        }, { name: name })

      return type
    }

    return SumType
}

module.exports = PredicatedLibDev