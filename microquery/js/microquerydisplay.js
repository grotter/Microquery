MicroqueryDisplay = function () {
	var _refreshRate = 5000;
	var _table = "bigbang";
	var _moderated = false;
	var _isModerating = false;
	
	/**
     * Debug utility
	 * @param obj {Object} Generic object to log
	 * @private
	 */
	var _log = function (obj) {
		if (typeof(console) == "undefined") {
			if (typeof(dump) == "function") {
				dump(obj);
			} else {
				//alert(obj);
			}
		} else {
			console.log(obj);
		}
	}
	
	/**
     * Is the data returned from the server formatted correctly?
	 * @param data {Object} JSON data
	 * @returns {Boolean} Returns true if valid, false if not
	 * @private
	 */
	var _isValid = function (data) {
		if (typeof(data) == "undefined") return false;
		return true;
	}
	
	/**
     * Iterate results from server and prepend any new questions to our list
	 * @param data {Object} JSON data from the server
	 * @private
	 */
	var _onData = function (data) {
		// iterate data
		var i = data.length;
		
		while (i--) {
			var myId = "id_" + data[i].uid_question;
			
			// already in the list
			if ($("#" + myId).length > 0) continue;
            
			// skip if empty question
			if ($.trim(data[i].question) == "") continue;
            
			// skip if moderating and reject
			if (_moderated) {
				if (data[i].rejected == "1" || data[i].accepted == "0") {
					continue;
				}
			}

			// check for empty submitter
			var submitter = $.trim(data[i].submitter);
			if (submitter == "") submitter = "Anonymous";
			
			// create markup and prepend new question to our list
			$("ul").prepend("<li id='"+ myId +"'><h2>"+ submitter +" asks&hellip;</h2><div class='time_submit'>"+ data[i].time_submit +"</div><div class='question'>"+ data[i].question +"</div>" + _getModerationUI(data[i]) + "</li>");
			
			if (_isModerating) {
				// set up moderation interaction
				$("#moderation-ui-" + data[i].uid_question + " input").click(function () {
					var uid = parseInt($(this).siblings(".uid").text());
					
					if ($(this).val() == "1") {
						_updateStatus(uid, true);
					} else {
						_updateStatus(uid, false);
					}
				});
			}
			
			// do a fancy intro animation
			$("#" + myId).show("blind", {}, "slow");
		}
	}
	
	var _removeRejects = function (data) {
		var i = data.length;
		
		while (i--) {
			var myId = "id_" + data[i];
			
			// already removed
			if ($("#" + myId).length == 0) continue;
			
			// remove from DOM
			$("#" + myId).remove();
			
			/*
			// animate, then remove from DOM
			$("#" + myId).hide("blind", {}, "slow", function () {
				$("#" + myId).remove();
			});
			*/
		}
	}
	
	var _updateStatus = function (uid, display) {
		var accept = display ? "1" : "0";
		
		$.jsonp({
			timeout: _refreshRate - 1000,
			url: "/microquery/php/",
			callbackParameter: "callback",
			data: {
				table: _table,
				action: "update-status",
				uid_question: uid,
				accepted: accept 
			},
			success: function (data, textStatus) {
				if (display) {
					_log("show " + uid);
				} else {
					_log("hide " + uid);
				}
			},
			error: function (options, textStatus) {
				// oops, do nothing 
				_log(textStatus);
			}
		});
	}
	
	var _getModerationUI = function (data) {
		if (!_isModerating) return "";
		
		var accepted = (data.accepted == "1") ? "checked='checked'" : "";
		var rejected = (data.rejected == "1") ? "checked='checked'" : "";
		
		return "<div class='moderation-ui' id='moderation-ui-" + data.uid_question + "'><input type='radio' name='moderate-" +  data.uid_question + "' value='1' " + accepted + " /> Display <input type='radio' name='moderate-" +  data.uid_question + "' value='0' " + rejected + " /> Hide<div class='hide uid'>" + data.uid_question + "</div></div>";
	}
	
	/**
     * Poll the server for latest questions data
	 * @public
	 */
	this.updateList = function () {
		var isModerated = _moderated ? "1" : "0";
		
		$.jsonp({
			timeout: _refreshRate - 1000,
			url: "/microquery/php/",
			callbackParameter: "callback",
			data: {
				moderated: isModerated,
				table: _table,
				action: "get-questions"
			},
			success: function (data, textStatus) {
				_log(data);
				
				if (_isValid(data.questions)) {
					_onData(data.questions);
				}
				
				if (_moderated) {
					if (_isValid(data.rejects)) {
						_removeRejects(data.rejects);
					}
				}
			},
			error: function (options, textStatus) {
				// oops, do nothing 
				_log(textStatus);
			}
		});
	};
	
	this.setTable = function (str) {
		_table = str;
	}
	
	this.moderate = function (boo) {
		_moderated = boo;
	}
	
	/**
	 * @constructor
	 */
	this.initialize = function (moderating) {
		if (typeof(moderating) == undefined) moderating = false;
		
		if (moderating) {
			_isModerating = true;
			_moderated = false;
		}
		
		this.updateList();
		var foo = setInterval(this.updateList, _refreshRate);
	};
};
