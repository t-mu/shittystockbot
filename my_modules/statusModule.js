/*
	WHAT 
	Exports a function that can be called for randomized 
	status text parts to be used in a tweet. Uses tweetCecker
	module to prevent same pieces to be used too soon.
	
	WHY
	Generally to make the tweets totally random, opefully shitty and
	even contradicting. The idea is to post shitty advice afterall.
*/

var texts = require("../data/status_texts.json");
var tweetChecker = require("./tweetChecker.js");

var recentTweets = new tweetChecker();

var adviceTxt 		= texts.advice;
var commentsNeg 	= texts.comments.negative;
var commentsPos 	= texts.comments.positive;
var percentUp 		= texts.percentDirection.up;
var percentDown 	= texts.percentDirection.down;
var priceUp 		= texts.priceDirection.up;
var priceDown 		= texts.priceDirection.down;
var commentsPrice 	= texts.comments.price;
var modifiers 		= texts.modifiers;

module.exports = function() {

	Array.prototype.rand = function() {
    	return this[Math.floor(Math.random() * this.length)]
	}

	this.advice =  function(){
		return Promise.resolve( 
			recentTweets.contain( adviceTxt.rand().text, this.advice ) 
		);
	}

	this.comment =  function(percent){

		if (parseFloat(percent) < 0) {
			return Promise.resolve(
				recentTweets.contain( commentsNeg.rand().text, this.comment, percent )	
			);
		}
		else {
			return Promise.resolve(
				recentTweets.contain( commentsPos.rand().text, this.comment, percent ) 	
			);
		}
	}

	this.percentText = function(percent) {

		if (parseFloat(percent) < 0) {
			return Promise.resolve( percentDown.rand().text ); 	
		}
		else {
			return Promise.resolve( percentUp.rand().text )
		}
	}

	this.priceText = function(percent) {
		
		if (parseFloat(percent) < 0) {
			return Promise.resolve(	priceDown.rand().text );
		}
		else {
			return Promise.resolve( priceUp.rand().text );
		}
	}

	this.modifiers = function() {
		return Promise.resolve( modifiers.rand() );
	}

	this.commentsPrice = function(percent) {

		if (parseFloat(percent) < 0) {
			return Promise.resolve(	commentsPrice.down.rand().text );
		}
		else {
			return Promise.resolve(	commentsPrice.up.rand().text );
		}
		
	}


}
