/*
	WHAT 
	Exports a function that can be used to post a status 
	to Twitter or mock a status into console.
	
	WHY
	For testing the system and actually tweeting the shitty advice
*/

var twit = require("twit");
var config = require("../config.js");

// set your twitter app keys and access tokens
var tweeter = new twit({
    consumer_key:         config.consumer_key
  , consumer_secret:      config.consumer_secret
  , access_token:         config.access_token
  , access_token_secret:  config.access_token_secret
});

module.exports = function(callback) {
	
	// Tweet some shitty advice 
	this.tweet = function(status) {

		if (status.length > 140) {
			callback(); 
		}
		else {
			tweeter.post('statuses/update', { status: status }, function(err, data, response) {
	  			if (err && err.code === 187) {
	  				callback(); 	// tweet too long -> get new tweet
	  			}
	  			else if (err && err.code != 187) {
	  				console.log(err) // TODO: log into file
	  			}
			});
		}
	}

	// mock the shitty advice for testing
	this.mock = function(status) {

		if (status.length > 140) {
			console.log("================  The tweet is too long! =================" + "\n" 
				+ "Tweet length: " + status.length + "\n" + status + "\n" + "New below:");
				callback();
		}
		console.log(status + "\n");
	}	
} 

