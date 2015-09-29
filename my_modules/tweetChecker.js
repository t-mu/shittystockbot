var config = require("../config.js");
var OAuth = require("oauth").OAuth;



// ===== Check some stuff before constructing a new tweet ===== ///

module.exports = function() {

	// Check wether (20) latest tweets contain a specific string
	this.contain = function(string, callback) {

		return new Promise(function(resolve, rejcet){

			getLatestTweets(20).then(function(response) {
				for (tweet of response) {
					if (tweet.text.includes(string)) {
						resolve(callback(arguments[2]));
					}
				}
				resolve(string);
			});
		});	
	}

	// Fetch a specific amount of shittystockbot's latest tweets from twitter API
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
					console.log("ERROR: " + data);
					reject(Error("ERROR!"));
				}

			});
		});
	}

}