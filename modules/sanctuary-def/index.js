module.exports = function($){
    return {
        toNullaryType: function(T){
            return $.NullaryType(
                T.name
                , ''
                , x => 
                    x != null
                    && x.type == T.name
                    && x.case in T
                    && x.case[0].toUpperCase() == x.case[0]
            )
        }
    }
}
