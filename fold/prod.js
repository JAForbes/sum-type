module.exports = function(){
    return {
        fold: function prodFold(T){ 
            return function prodFold$T(cases){
                return function prodFold$T$cases(x){
                    return cases[x.case.name](x.value)
                }
            }
        }
    }
}