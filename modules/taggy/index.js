module.exports = name => o => 
    Object.keys(o)
        .map( k => [k, o[k]] )
        .reduce(
            (p, [ k, ks ]) => {

                const of = value => {

                    const badValue =
                        ks.length > 0
                        && (
                            value == null
                            || typeof value != 'object'
                        )

                    if ( badValue ){
                        throw new TypeError(
                            k +' expects {'+ks.join(', ')+'} but received: ' 
                                + value
                        )
                    }

                    const missingValues = 
                        ks.filter(
                            k => !(k in value)
                        )

                    if( missingValues.length ){
                        throw new TypeError(
                            k + ' is missing expected values: '
                                + missingValues.join(',')
                        )
                    }

                    return Object.assign({ 
                        case: k
                        , type: name
                    }, ks.length == 0 
                        ? {} 
                        : { value }
                    )
                }

                p[k] = of

                return p
            }
            ,{}
        )
