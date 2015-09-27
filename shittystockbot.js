// load node modules
var express = require("express");
// var fs = require("fs");
var request = require("request"); 
// var cheerio = require("cheerio"); // for web scraping (not in use atm)
// var app = express();
var util = require("util");
var OAuth = require("oauth").OAuth;

// include static files
var companies = require("./companies.json");
var texts = require("./status_texts.json");
var config = require("./config.js");



// Twitter module and settings
var twit = require("twit");

// twit module constuctor
var tweeter = new twit({
    consumer_key:         config.consumer_key
  , consumer_secret:      config.consumer_secret
  , access_token:         config.access_token
  , access_token_secret:  config.access_token_secret
});



// ===== Some yelper funcs ===== //

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
	}
	return stockName;
}





// ===== Get shitty stuff for a tweet ===== //  


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
function getShittyPercentDirection(percent) {

	if (parseFloat(percent) < 0) {
		return texts.percentDirection.down[getRandIndex( texts.percentDirection.down )].text;
	}
	else {
		return texts.percentDirection.up[getRandIndex( texts.percentDirection.up )].text;
	}
}

// Return random shitty direction from status_text.json
function getShittyPriceDirection(percent) {

	if (parseFloat(percent) < 0) {
		return texts.priceDirection.down[getRandIndex( texts.priceDirection.down )].text;
	}
	else {
		return texts.priceDirection.up[getRandIndex( texts.priceDirection.up )].text;
	}
}

// Return random shitty modifier from status_text.json
function getShittyModifier() {
	return texts.modifiers[getRandIndex( texts.modifiers )];
}

function getTweetTemplate() {

}




// ===== Check some stuff before constructing a new tweet ===== ///


// Request new status text part if recent tweets contain current part
function avoidSimilar(thing, callback) {

	return new Promise(function(resolve, reject){
		
		recentTweetsContain(thing).then(function(response){
				
			if (response === true) {
				// console.log("Recent tweets contain this substring: " + thing);
				resolve(callback(arguments[2]));
			}
			else if (response === false){
				// console.log("Recent tweets do not contain this substring: " + thing);
				resolve(thing);
			}
		});
	});	
}

// Check wether (20) latest tweets contain a specific string
function recentTweetsContain(subStr) {

	return new Promise(function(resolve, rejcet){

		getLatestTweets(20).then(function(response) {
			for (tweet of response) {
				if (tweet.text.includes(subStr)) {
					resolve(true);
				}
			}
			resolve(false);
		});
	});	
}






// ===== Fetching stuff from APIs ===== //


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
					shittystockbot();
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


// Return shittystockbot's latest tweets from twitter API
function getLatestTweets(amount) { 

	var url = "https://api.twitter.com/1.1/statuses/user_timeline.json?screen_name=porssivinkki&count=" + amount;
	
	oa = new OAuth("https://twitter.com/oauth/request_token",
	                 "https://twitter.com/oauth/access_token", 
	                 config.consumer_key, 
	                 config.consumer_secret, 
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





// ===== Generating the tweet ===== //


// Get a stockquote for a random company from companies.json
function getRandomStockQuote() {
	var company = JSON.parse( getCompanyFromJson( getRandIndex(companies) ) );
	return new Promise(function(resolve, reject){
		getStockQuoteBySymbol( company.symbol ).then(function(response) {
			resolve(response);
			// console.log(response);
		});
	}); 
}

// Generate a full blown twitter status from shitty text parts
function generateStatus(data) {

	var stockName = getStockNameBySymbol( data.Symbol );
	var percentChange = data.PercentChange;
	var price = data.LastTradePriceOnly;

	var comment = Promise.resolve(getShittyComment(percentChange));
	var modifier = Promise.resolve(getShittyModifier());
	var percentDirection = Promise.resolve(getShittyPercentDirection(percentChange));
	var priceDirection = Promise.resolve(getShittyPriceDirection(percentChange));
	var advice = Promise.resolve(getShittyAdvice());
	var hashtag = "#porssivinkki";

	var roundedPrice = function() {
								if (parseFloat(percentChange) < 0) {
									return Math.floor(price);
								}
								else {
									return Math.ceil(price);
								}	
							}

	return new Promise(function(resolve, reject){
		
		var template_1 = [	stockName, 
							modifier, 
							percentDirection,
							percentChange.replace(".",",").replace("%"," %."),
							advice
						];

		var template_2 = [	comment,
							stockName, 
							modifier, 
							percentDirection,
							percentChange.replace(".",",").replace("%"," %."),
							advice
						];

		var template_3 = [	stockName,
							priceDirection, 
							roundedPrice(),
							"euroon.", 
							advice
						];

		var template_4 = [	comment, 
							stockName,
							"nyt vain",
							price.replace(".",","),
							"euroa.",
							advice

						];

		var templates = [template_1, template_2, template_3, template_4];

		// Promise.all([	comment, 
		// 				stockName, 
		// 				modiefier, 
		// 				direction, 
		// 				" " + percentChange.replace(".",",").replace("%"," %."), 
		// 				advice, 
		// 				hashtag
		// 			])
		Promise.all( templates[getRandIndex(templates)] )
		.then(function(values){
			var status = "";
			for (value of values) {
				status = status + value + " ";
			}
			resolve(status + hashtag);	
		});
	});
}





// ===== Tweeting ===== //


// mock the shitty advice
function mockTweetStockAdvice(status) {

	if (status.length > 140) {
		console.log("================  The tweet is too long! =================" + "\n" 
			+ "Tweet length: " + status.length + "\n" + status);
	}
	console.log(status + "\n");
}


// Actually tweet the shitty advice 
function tweetStockAdvice(status) {

	if (status.length > 140) {
		shittystockbot(); 
	}
	else {
		tweeter.post('statuses/update', { status: status }, function(err, data, response) {
  			if (err && err.code === 187) {
  				shittystockbot();
  			}
  			else if (err && err.code != 187) {
  				console.log(err) // log into file
  			}
		});
	}
		
}



// ===== This is where the magic happens ===== //

// This is the shitty bot
function shittyStockBot() {
	getRandomStockQuote()
		.then(function(quote){ generateStatus(quote)
		.then(function(status){ mockTweetStockAdvice(status);
		// tweetStockAdvice(status);
		});
	});
}

// run the shitty bot
shittyStockBot();

for (var i = 0; i < 20; i++) {
	shittyStockBot()
};



