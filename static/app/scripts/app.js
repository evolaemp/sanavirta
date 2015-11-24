/**
 * The god object.
 * 
 * Contains the only handler for document.ready.
 * 
 * @module
 * 
 * @requires jQuery
 * @requires app.*
 */
var app = (function() {
	
	"use strict";
	
	
	/**
	 * Class definition for the global controller.
	 * 
	 * @class
	 */
	var App = function() {
		var self = this;
		
		/**
		 * The currently active app.maps.Map instance.
		 * One instance throughout the life of the app instance.
		 * Inited in the document.ready handler.
		 */
		self.map = null;
	};
	
	/**
	 * Setups jQuery's ajax methods.
	 * (1) Makes these carry JSON.
	 * (2) Adds the csrf token.
	 */
	App.prototype.initAjax = function() {
		var self = this;
		
		$.ajaxSetup({
			beforeSend: function(xhr, settings) {
				if(!this.crossDomain) {
					xhr.setRequestHeader(
						'X-CSRFToken',
						self.getCookie('csrftoken')
					);
				}
			},
			contentType: 'application/json; charset=UTF-8',
			dataType: 'json'
		});
	};
	
	/**
	 * Gives cookies.
	 * 
	 * @param The cookie's name.
	 * @see https://docs.djangoproject.com/en/1.8/ref/csrf/#ajax
	 */
	App.prototype.getCookie = function(name) {
		var cookieValue = null;
		
		if (document.cookie && document.cookie != '') {
			var cookies = document.cookie.split(';');
			for (var i = 0; i < cookies.length; i++) {
				var cookie = jQuery.trim(cookies[i]);
				// Does this cookie string begin with the name we want?
				if (cookie.substring(0, name.length + 1) == (name + '=')) {
					cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
					break;
				}
			}
		}
		
		return cookieValue;
	};
	
	
	/**
	 * Init (before DOM ready).
	 */
	var appInstance = new App();
	
	
	/**
	 * Init (after DOM ready).
	 */
	$(document).ready(function() {
		appInstance.initAjax();
		
		appInstance.map = new app.maps.Map();
		if($('canvas').length > 0) {
			appInstance.map.initCanvas($('canvas').get(0));
			appInstance.map.initGlobe();
			appInstance.map.redraw();
		}
	});
	
	
	/**
	 * Module exports.
	 */
	return {
		getAppInstance: function() {
			return appInstance;
		}
	};
	
}());
