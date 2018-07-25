const Immutable = require('immutable')
const um = require('@brave-intl/bat-usermodel')


const incrementalWeightedAverage = (state, key, item, weight) => {
    
    let previous = state.getIn(key)
    
    // it's undefined...
    if (!Immutable.List.isList(previous) || previous.length == 0 || isNaN(previous.getIn([0]))) {
      console.log("YOW")
      return state.setIn(key, Immutable.fromJS(item))
    }
  
    let v = Immutable.fromJS(
      item.map((a, i) => {
        return a + weight*(previous.getIn([i]) || 0)
      })
    )
    
    console.log(item)
    console.log(weight)
    console.log(v)
    console.log(JSON.stringify({key: key, val: v}))
  
    return state.setIn(key, v)
  }

let state = Immutable.Map() 
state = incrementalWeightedAverage(state, ['test'], [1,2,3,4], 1.0)
console.log(state)

state = incrementalWeightedAverage(state, ['test'], [1,2,3,4], 1.0)
console.log(state)

let test = new Array(10).fill(0)
console.log(Immutable.fromJS(test))

const adsList = (ads) => {
    let res = []
    for (let cat in ads['categories']) {
        const adsWithinCat = ads['categories'][cat]
        for (let id in adsWithinCat) {
            let ad = adsWithinCat[id]
            ad['category'] = cat
            res.push(ad)
        }
    }
    return res
}

let ads = um.getSampleAdFeed()

// console.log(adsList(ads))


const scoreAdsRelevance = (adsFeatures) => {
    const scores = []
    model = um.getAdsRelevanceModel()

    for (let i = 0; i < adsFeatures.length; i++ ) {
        scores.push(um.logisticRegression(adsFeatures[i], model))
    }
 
    return scores
}
 
 const normalize = (dic) => {
     let sum = 0.0
     const res = new Array()
     const keys = Object.keys(dic)

    keys.forEach( e => {
        sum += dic[e]
    })

    if (sum === 0.0) {
        return res
    }

    keys.forEach(e => {dic[e] = dic[e]/sum})

    return dic
}

const sampleAd = (scores) => {
    const normalizedScores = normalize(scores)
    const keys = Object.keys(scores)

    // roulette sampling
    let acc = 0
    let r = Math.random()
    for (let i=0; i<keys.length; i++) {
        acc += normalizedScores[keys[i]]
        if (acc > r) {
            return keys[i];
        }
    }

    return -1;
}

const categoryMatchScore = (adCategory, interest, entropy) => {
    // if entropy is very high then return no match
    if (entropy >= 0.8) {
        return 0.0
    }

    // the score depends on the level that the interest match with the category
    // if the interest is auto-cars and the ad is auto-cars it gets score 1
    // however if the ad is auto then it gets 0.5 because 
    // it matched only the high level category
    const hierarchy = interest.split('-')
    let score = 1.0
    console.log(interest + " " + hierarchy.length)
    for (let level in hierarchy) {
        const topic = hierarchy[level]
        console.log(topic)
        if (topic == adCategory) {
            break
        }
        score -= (1.0 / hierarchy.length)
    }

    console.log("ADS SCORE: " + score + " debug " + adCategory + " " + interest + " " + entropy)

    return score
}
const vector2topic = (pageScore) => {
    const priorData = um.getPriorDataSync()
    const catNames = priorData.names
  
    const immediateMax = um.vectorIndexOfMax(pageScore)
    const immediateWinner = catNames[immediateMax]
    return immediateWinner
}

function create_feature(dic) {
    const f = new Map()

    const keys = Object.keys(dic)
    keys.forEach( (item) => {
        f.set(item, dic[item])
    })

    return f
}
let features = []
features.push(create_feature({'short_term_category_match': 1, 'long_term_category_match':0, 'intent_category_match': 0}))
features.push(create_feature({'short_term_category_match': 1, 'long_term_category_match':0, 'intent_category_match': 0}))
features.push(create_feature({'short_term_category_match': 1, 'long_term_category_match':1, 'intent_category_match': 0}))

let scores = scoreAdsRelevance(features)
console.log(sampleAd(scores))

//console.log(vector2topic([1,2,3]))