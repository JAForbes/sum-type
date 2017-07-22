module.exports = function PredicatedLibProd(){
    function SumType(name, cases){
      
      var type = 
        Object.keys(cases)
          .reduce(function(p, k){
            p[k] = function(value){
                return {
                  type: { name }
                  ,case: { name: k }
                  ,value: value
                }
              }

            return p
        }, { name: name })

      return type
    }

    return SumType
}
