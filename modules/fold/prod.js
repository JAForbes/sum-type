var Skip = {
  length: true
  ,prototype: true
  ,name: true
}

function I(a){
    return a
}

function getCases(T){
    return Object.getOwnPropertyNames(T)
        .filter(function(o){
            return o[0] == o[0].toUpperCase()
        })
        .filter(function(x){
            return !(x in Skip)
        })
}

module.exports = function(){
    var out = {
        fold: function prodFold(){
            return function prodFold$T(cases){
                return function prodFold$T$cases(x){
                    return cases[x.case](x.value)
                }
            }
        }

        ,bifold: function bifold(T){
            return function bifold$T(fb, fa){
                var caseNames =
                    getCases(T)

                // reverse because its customary to fold the failure first
                var ks = caseNames.slice().reverse()
                var kb = ks[0]
                var ka = ks[1]

                var cases = {}
                cases[ka] = fa
                cases[kb] = fb
                return out.fold (T) (cases)
            }
        }
        ,bimap: function bimap(T){
            return function bimap$T(fb, fa){
                return function(Ta){
                    return out.bifold (T)(
                        function(b){ 
                            return { case: Ta.case, type: T.name, value: fb(b) }
                        }
                        ,function(a){ 
                            return { case: Ta.case, type: T.name, value: fa(a) }
                        } 
                    )(Ta)
                }
            }
        }

        ,map: function map(T){
            return function bimap$T(fa){
                return out.bimap (T) (I, fa)
            }
        }
    }
    return out
}