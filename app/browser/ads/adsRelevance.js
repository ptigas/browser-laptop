/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

 'use strict'

 const scoreAdsRelevance = (ads) => {
     const scores = {}
     const keys = Object.keys(ads)
     keys.forEach(key => {
         scores[key] = 1.0
     })
 
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

const sampleAd = (ads, scores) => {

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

module.exports = {
    scoreAdsRelevance,
    sampleAd
}