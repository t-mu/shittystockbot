var express = require("express");
var fs = require("fs");
var request = require("request");
var cheerio = require("cheerio");
// var promise = require("promise")
var app = express();


var companies = require("./companies.json");
var texts = require("./status_texts.json");
var config = require("./config.js");

var util = require("util");
var OAuth = require("oauth").OAuth;


// Twitter module and settings

var twit = require("twit");

var tweeter = new twit({
    consumer_key:         'lLa03OyyvaHCLtzWFuDTBQJIl'
  , consumer_secret:      'x6UYIzO0OiHt04TCdMgUKSUPnoSrSVZpmDVjieECD3ydfZCQ3a'
  , access_token:         '3405822838-K00ij7isbMPrmWcLZM0yiHx0Uc0KGYExe3c8wWv'
  , access_token_secret:  'mLdPKDinQyGRbB7EozecHmsijY0x0EXA0w2WuscchZG0h'
});



// Stuff for handling company info

function getRandIndex(dataset) {
	return Math.floor(Math.random() * dataset.length);
}

function getCompanyFromJson(index) {
	return JSON.stringify({ "name": companies[index].name, "symbol": companies[index].symbol });	
}

function getCompanySymbol(company) {
	return company.symbol;
}

function getCompanyName(company) {
	return company.name;
}


// Get company's stockquote by symbol from yahoo API
function getStockQuoteBySymbol(symbol) {

	var url = "https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.quotes%20where%20symbol%20in%20(%22" + 
			symbol + 
			"%22)&format=json&diagnostics=true&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=";	


	return new Promise(function(resolve, reject) {

		request(url, "utf8", function (error, response, body) {

			if (!error && response.statusCode === 200) {

				var stockQuery = JSON.parse(body);		
				
				var parsedQuote = stockQuery.query.results.quote;

				if (parsedQuote.Change === null) {
					getRandomStockQuote();
				}
				else {
					resolve(parsedQuote);
				}
			}
			else {
				console.log(error);
				//TODO: log errors to file
			}
		});
	});
} 


// Get a stockquote for a random company from companies.json
function getRandomStockQuote() {
	var company = JSON.parse( getCompanyFromJson( getRandIndex(companies) ) );
	return new Promise(function(resolve, reject){
		getStockQuoteBySymbol( company.symbol ).then(function(response) {
			resolve(response);
		});
	}); 
}

// Generate a full blown twitter status from shitty blocks
function generateStatus(data) {

	var stockName = getStockNameBySymbol( data.Symbol );
	var percentChange = data.PercentChange;

	return new Promise(function(resolve, reject){
		
		var comment = Promise.resolve(getShittyComment(percentChange));
		var modiefier = Promise.resolve(getShittyModifier());
		var direction = Promise.resolve(getShittyDirection(percentChange));
		var advice = Promise.resolve(getShittyAdvice());
		var hashtag = " #porssivinkki";

		Promise.all([	comment, 
						stockName, 
						modiefier, 
						direction, 
						" " + percentChange.replace(".",",").replace("%"," %."), 
						advice, 
						hashtag
					])
		.then(function(values){
			var status = "";
			for (value of values) {
				status = status + value;
			}
			resolve(status);	
		});
	});
}



// Get value from JSON by key
// TODO: Remove as unnecessary???
function getValueByKey(data, key) {
	return data[key]
}

// Get correctly formatted company name from companies.json
function getStockNameBySymbol(symbol) {
	var stockName = "";

	for (var i = 0; i < companies.length; i++) {
		if (companies[i].symbol === symbol) {
			stockName = companies[i].name;
		} 
	};

	return stockName;
}





// ===== Get shitty stuff for tweet ===== //  


// Return random shitty advice from status_text.json
function getShittyAdvice() {
	var advice = texts.advice[getRandIndex( texts.advice )].text;
	return new Promise(function(resolve, reject){
		avoidSimilar(advice, getShittyAdvice).then(function(res){
			resolve(res);
		});	
	});
}

// // Return random shitty comment from status_text.json
function getShittyComment(percent) {

	if (parseFloat(percent) < 0) {
		var negComment = texts.comments.negative[getRandIndex( texts.comments.negative )].text;
		return new Promise(function(resolve, reject){
			avoidSimilar(negComment, getShittyComment, percent).then(function(res){
				resolve(res);
			});	
		});
	}
	else {
		var posComment = texts.comments.positive[getRandIndex( texts.comments.positive )].text;
		return new Promise(function(resolve, reject){
			avoidSimilar(posComment, getShittyComment, percent).then(function(res){
				resolve(res);
			});	
		});
	}
}

// Return random shitty direction from status_text.json
function getShittyDirection(percent) {

	if (parseFloat(percent) < 0) {
		return texts.direction.down[getRandIndex( texts.direction.down )].text;
	}
	else {
		return texts.direction.up[getRandIndex( texts.direction.up )].text;
	}
}

// Return random shitty modifier from status_text.json
function getShittyModifier() {
	return texts.modifiers[getRandIndex( texts.modifiers )];
}

// 
function avoidSimilar(thing, callback) {

	return new Promise(function(resolve, reject){
		resolve(
			recentTweetsContain(thing).then(function(response){
				
				if (response === true) {
					// console.log("Recent tweets contain this substring: " + thing);
					return callback(arguments[2]);
				}
				else if (response === false){
					// console.log("Recent tweets do not contain this substring: " + thing);
					return thing;
				}

			})
		);
	});
	
}


// ===== Some other functions ===== //


// Return latest tweets
function getLatestTweets(amount) { 

	var url = "https://api.twitter.com/1.1/statuses/user_timeline.json?screen_name=porssivinkki&count=" + amount;
	
	oa = new OAuth("https://twitter.com/oauth/request_token",
	                 "https://twitter.com/oauth/access_token", 
	                 config.consumerKey, 
	                 config.consumerSecret, 
	                 "1.0A", "http://localhost:3000/oauth/callback", "HMAC-SHA1");

	return new Promise(function(resolve, reject) {

		oa.get(url, config.accessToken, config.accessTokenSecret, function(error, data) {
		  
			if (!error) {
				res = JSON.parse(data)

		 		resolve(res);
			}
			else {
				reject(Error("ERROR!"));
			}

		});
	});
}

// Check wether latest tweets contain a specific string
function recentTweetsContain(subStr) {

	return new Promise(function(resolve, rejcet){

		resolve(
			getLatestTweets(10).then(function(response) {

				for (tweet of response) {
					if (tweet.text.includes(subStr)) {
						return true;
					}
				}
				return false;
			})
		);

	});	
}


function mockTweetStockAdvice(status) {

	if (status.length > 140) {
		console.log("================  The tweet is too long! =================" + "\n" 
			+ "Tweet length: " + status.length + "\n" + status);
	}

	console.log(status);
}

function tweetStockAdvice(status) {

	if (status.length > 140) {
		getRandomStockQuote();
	}

	else {

		tweeter.post('statuses/update', { status: status }, function(err, data, response) {
  			if (err && err.code === 187) {
  				getRandomStockQuote();
  			}
  			else if (err && err.code != 187) {
  				console.log(err) // log into file
  			}

  			console.log(data);
		});
	}
		
}


getRandomStockQuote().then(function(quote){
	generateStatus(quote).then(function(status){
		// mockTweetStockAdvice(status);
		tweetStockAdvice(status);
	});
});





