/* global before, after, describe, it */

require('../../../braveUnit')
const assert = require('assert')
const fakeAdBlock = require('../../../lib/fakeAdBlock')
const mockery = require('mockery')
const { scoreAdsRelevance, sampleAd } = require('../../../../../app/browser/ads/adsRelevance')

describe('adsRelevance test', function () {
  
  describe('schouldScoreAds', function () {
    it('generate scores and sample an ad', function () {        
        const ads = {
            'test1': 'yo',
            'test2': 'adfasdf'
        }

        const scores = scoreAdsRelevance(ads);
        assert.equal(scores['test1'], 1.0)
        assert.equal(scores['test2'], 1.0)
        assert.ok(["test1", "test2"].includes(sampleAd(ads, scores)))
    })
  })
})
