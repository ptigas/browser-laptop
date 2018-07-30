/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

 'use strict'
 const um = require('@brave-intl/bat-usermodel')
 const userFeatures = require('../../common/constants/userFeatures')
 //const adFeatures = require('../../common/constants/adFeatures')

 const notificationScore = (ads) => {
    const notificationWeights = um.getNotificationsModel()
    
    // TODO: ptigas
    // Features to add
    // - Last time since you last saw a notification
    // - Uninterrupted duration
    const featureVector = {}

    return um.notificationScore(featureVector, notificationWeights);
 }

const scoreAdsRelevance = (adsFeatures) => {
    const scores = []
    const model = um.getAdsRelevanceModel()

    let n = 0;
    for (let i = 0; i < adsFeatures.length; i++ ) {
        const score = um.logisticRegression(adsFeatures[i], model)
        
        if (score > 0.5) {
            n += 1
            scores.push(score)
        } else {
            scores.push(0)
        }
    }

    console.log(n + " ads got into the lottery")
 
    return scores
}

const logit = (x) => { return Math.log(x/(1-x))}

const explain = (featureVector) => {
    const model = um.getAdsRelevanceModel()
    const score = logit(um.logisticRegression(featureVector, model))
    
    const scores = {}
    let sum = 0.0
    const bias = model[0]
    for (let key of featureVector.keys()) {
        const v = model[key]*featureVector.get(key)
        if (v > 0.0) {
            scores[key] = (v+bias)/score
            sum += ((v+bias)/score)
        }
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

const updateState = (state, key, callback) => {
    state = validateState(state)
    return callback(state.getIn(key))
}

const vector2topic = (pageScore) => {
    const priorData = um.getPriorDataSync()
    const catNames = priorData.names
  
    const immediateMax = um.vectorIndexOfMax(pageScore)
    const immediateWinner = catNames[immediateMax]
    return immediateWinner
}

const categoryMatchScore = (adCategory, interest, entropy) => {
    // if entropy is very high then return no match
    if (entropy >= 0.4) {
        return 0.0
    }

    // the score depends on the level that the interest match with the category
    // if the interest is auto-cars and the ad is auto-cars it gets score 1
    // however if the ad is auto then it gets 0.5 because 
    // it matched only the high level category
    const hierarchy = interest.split('-')
    let score = 1.0
    for (let level=0; level < hierarchy.length; level++) {
        const topic = hierarchy[level]
        if (topic == adCategory) {
            break
        }
        score -= (1.0 / hierarchy.length)
    }
    
    return score
}

const extractAdFeature = (ad, userFeatureVector) => {
    let featureVector = new Map()

    featureVector.set(
        'intent_category_match', 
        categoryMatchScore(
            ad['category'], 
            vector2topic(userFeatureVector.get(userFeatures.INTENT)),
            userFeatureVector.get(userFeatures.INTENT_ENTROPY)
        )
    )

    featureVector.set(
        'short_term_category_match', 
        categoryMatchScore(
            ad['category'], 
            vector2topic(userFeatureVector.get(userFeatures.SHORT_INTEREST)),
            userFeatureVector.get(userFeatures.SHORT_INTEREST_ENTROPY)
        )
    )

    featureVector.set(
        'long_term_category_match', 
        categoryMatchScore(
            ad['category'], 
            vector2topic(userFeatureVector.get(userFeatures.LONG_INTEREST)),
            userFeatureVector.get(userFeatures.LONG_INTEREST_ENTROPY)
        )
    )

    featureVector.set(
        'winning_over_time_match',
        categoryMatchScore(
            ad['category'], 
            vector2topic(userFeatureVector.get(userFeatures.PAGE_SCORE_AVERAGE)),
            userFeatureVector.get(userFeatures.PAGE_SCORE_ENTROPY)
        )        
    )

    return featureVector
}

const extractAdsFeatures = (ads, userFeatureVector) => {

    let features = []
    
    console.log("FEATURES START")
    
    console.log("Intent: " + vector2topic(userFeatureVector.get(userFeatures.INTENT)) + " entropy: " + userFeatureVector.get(userFeatures.INTENT_ENTROPY))
    console.log("Short: " + vector2topic(userFeatureVector.get(userFeatures.SHORT_INTEREST)) + " entropy: " + userFeatureVector.get(userFeatures.SHORT_INTEREST_ENTROPY))
    console.log("Long: " + vector2topic(userFeatureVector.get(userFeatures.LONG_INTEREST)) + " entropy: " + userFeatureVector.get(userFeatures.LONG_INTEREST_ENTROPY))
    console.log("Winning: " + vector2topic(userFeatureVector.get(userFeatures.PAGE_SCORE_AVERAGE)) + " entropy: " + userFeatureVector.get(userFeatures.PAGE_SCORE_ENTROPY))

    for (let id in ads) {
        features.push(extractAdFeature(ads[id], userFeatureVector))
    }

    console.log("FEATURES END")

    return features
}

module.exports = {
    scoreAdsRelevance,
    sampleAd,
    extractAdsFeatures,
    explain
}