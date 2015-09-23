var express = require("express");
var fs = require("fs");
var request = require("request");
var cheerio = require("cheerio");
var promise = require("promise")
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

	request(url, "utf8", function (error, response, body) {

		if (!error && response.statusCode === 200) {

			var stockQuery = JSON.parse(body);		
			
			var parsedQuote = stockQuery.query.results.quote;

			if (parsedQuote.Change === null) {
				getRandomStockQuote();
			}

			// else {
			// 	tweetStockAdvice(generateStatus(parsedQuote));
			// }

			else {
				mockTweetStockAdvice( generateStatus( parsedQuote ) );
			}
		
		}
		else {
			console.log(error);
			//TODO: log errors to file
		}

	});

} 


// Get a stockquote for a random company from companies.json
function getRandomStockQuote() {
	var company = JSON.parse( getCompanyFromJson( getRandIndex(companies) ) );
	return getStockQuoteBySymbol( company.symbol );
}


// Get value from JSON by key
function getValueByKey(data, key) {
	return data[key]
}


function getStockNameBySymbol(symbol) {
	var stockName = "";

	for (var i = 0; i < companies.length; i++) {
		if (companies[i].symbol === symbol) {
			stockName = companies[i].name;
		} 
	};

	return stockName;
}

// Generate tweet
function generateStatus(data) { //TODO: make into a function
	var stockName = getStockNameBySymbol( getValueByKey(data, "Symbol") );
	var percentage = getValueByKey(data, "Change");
	
		// return promise???



	var status = 	getShittyComment() + 
					stockName + 
					getShittyModifier() + 
					getShittyDirection() + " " +
					percentage.replace(".",",") + " %." + 
					getShittyAdvice() + 
					" #porssivinkki";
	
	// TODO: Add hashtags into status

	return status;
}


function getShittyAdvice() {
	return texts.advice[getRandIndex( texts.advice )].text;
}

function getShittyComment(change) {
	if (change < 0) {
		return texts.comments.negative[getRandIndex( texts.comments.negative )].text;
	}
	else {
		return texts.comments.positive[getRandIndex( texts.comments.positive )].text;
	}
}

function getShittyDirection(change) {
	if (change < 0) {
		return texts.direction.down[getRandIndex( texts.direction.down )].text;
	}
	else {
		return texts.direction.up[getRandIndex( texts.direction.up )].text;
	}
	
}

function getShittyModifier() {
	return texts.modifiers[getRandIndex( texts.modifiers )];
}


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

function recentTweetsContain(advice) {

	getLatestTweets(10).then(function(response) {

		for (var i = 0; i < response.length; i++) {

			var tweet = response[i].text;

			if (tweet.includes(advice)) {
				return true;	
			}
		}
		return false;
	});
}

function hasSameAdvice(string, subString) {
	return string.includes(subString);
}



function mockTweetStockAdvice(status) {

	if (status.length > 140) {
		console.log("================  The tweet is too long! =================" + "\n" 
			+ "Tweet length: " + status.length + "\n" + status);
	}

	console.log(status);
}

// function tweetStockAdvice(status) {

// 	if (status.length > 140) {
// 		getRandomStockQuote();
// 	}

// 	else {

// 		tweeter.post('statuses/update', { status: status }, function(err, data, response) {
//   			if (err && err.code === 187) {
//   				getRandomStockQuote();
//   			}
//   			else if (err && err.code != 187) {
//   				console.log(err) // log into file
//   			}

//   			console.log(data);
// 		});
// 	}
		
// }



getRandomStockQuote();

// var test = getRandIndex(texts.direction.down);
// console.log(texts.advice[getRandIndex( texts.advice )].text)
// console.log(texts.comments.positive[getRandIndex( texts.comments.positive )].text)
// console.log(texts.direction.down[test].text);
// console.log(texts.modifiers[getRandIndex( texts.modifiers )]);





