//variable globale
var bkPage = chrome.extension.getBackgroundPage();
var user = bkPage.user;

// JQUERY ON LOAD
$(function() {

	/* L A N G U A G E */
	translate();

	// Restorer les options pour l'affichage:
	var options = restore_options();
	document.getElementById(options.defaultAction).checked = true;

	// Update GMAIL form with credential retrieved from the server 
	// The first parameter is accessible in the callback function by keyword this, second param here is the first param there. 
	readUser(updateGmailForm);

	// Lors du submit :
	$('#optionsForm').submit(function(e) {
		// on ne sauvegarde les préférences que si l'utilisateur est connecté.
		if (user && user.status == constant.status.CONNECTED) {
			postGmailCredentials();
		} else {
			// Update status to let user know that he has not writes.
			var message = chrome.i18n.getMessage('changeNotAllowded');
			showNotification("status", message);
		}

		e.preventDefault();
	});
});// FIN JQUERY ONLOAD

/**
 * Save on the server
 */
function postGmailCredentials() {

	// Send the request
	var gmailUser = new Object();

	gmailUser.gmailEmail = $("#gmailEmail").val();
	gmailUser.gmailPasswd = $("#gmailPasswd").val();
	//DON'T DO THAT HERE. $.toJSON will do it for you.
	//gmailUser.gmailEmail = encodeURIComponent($("#gmailEmail").val());
	//gmailUser.gmailPasswd = encodeURIComponent($("#gmailPasswd").val());
	var tmpLogin = encodeURIComponent(encodeURIComponent(user.login));
 	var tmpPasswd = encodeURIComponent(encodeURIComponent(user.passwd)); 
// 	var gmailAuthCredUrl = GMAIL_CREDENTIALS_URL + "/" + user.login + "/" + user.passwd;
	var gmailAuthCredUrl = GMAIL_CREDENTIALS_URL + "/" + tmpLogin + "/" + tmpPasswd;
	
	jQuery.ajax({
		'type' : 'POST',
		'url' : gmailAuthCredUrl,
		'contentType' : 'application/json',
		'data' : $.toJSON(gmailUser),
		'dataType' : 'json',
		'success' : postGmailCredentialsCallback
	});

	return false;

}

function postGmailCredentialsCallback(rep) {
	log("status : " + rep);
	
	if (rep == "200") {
		//Pas terrible le save ici, faudrait peut être faire deux boutons enregistré ? Ou enregistrer les options à la volée ?
		saveOptions();
		
		//update local contacts data
		//TODO : implement callback here, to show success message once contacts retrieved.
		bkPage.getGoogleContacts();
		
		// Update status to let user know options were saved.
		var message = chrome.i18n.getMessage('changeSaved');
		showNotification("status", message);
	} else if (rep == "500") {
		showNotification("status", chrome.i18n.getMessage('changeNotSaved'));
	}

}

/**
 * Saves options to localStorage.
 */
function saveOptions() {
	// http://blog.geekfg.net/2009/03/gerer-les-elements-input-radio-avec.html
	var selectedRadio = $('input[type=radio][name=defaultAction]:checked').attr('value');
	localStorage["defaultAction"] = selectedRadio;

	/*
	 * var select = document.getElementById("color"); var color =
	 * select.children[select.selectedIndex].value;
	 * localStorage["favorite_color"] = color;
	 */
}

/**
 * show a status message before it hides it.
 */
function showNotification(id, message) {
	var status = document.getElementById(id);
	status.innerHTML = message;
	$("#"+id).fadeIn(300);
	
	setTimeout(function() {
		$("#"+id).fadeOut(700);
	}, 1750);	
	
}


/**
 * show a status message before it hides it.
 */
function showSimpleNotification(id, message) {
	var status = document.getElementById(id);
	status.innerHTML = message;

	setTimeout(function() {
		status.innerHTML = "";
	}, 1750);
}



/**
 * Restores select box state to saved value from localStorage.
 */
function restore_options() {

	var options = new Object();

	var favorite = localStorage["defaultAction"];
	if (!favorite) {
		// share is defaultAction
		options.defaultAction = "share";
	} else {
		options.defaultAction = favorite;
	}
	return options;
	/*
	 * var select = document.getElementById("color"); for (var i = 0; i <
	 * select.children.length; i++) { var child = select.children[i]; if
	 * (child.value == favorite) { child.selected = "true"; break; } }
	 */
}

/**
 * http://blog.springsource.com/2010/01/25/ajax-simplifications-in-spring-3-0/
 */
function updateGmailForm() {

	var dbUser = this;
	
	if(!dbUser || dbUser.status != constant.status.CONNECTED){
		log("dbUser null or not connected, we'll not do http request. gmailForm will be empty");
		return false;
	}
		
	var tmpLogin = encodeURIComponent(encodeURIComponent(user.login));
	var tmpPasswd = encodeURIComponent(encodeURIComponent(user.passwd));
	 
	/*
	var authGmailCredUrl = GMAIL_CREDENTIALS_URL + 
					  	   "/"+ encodeURIComponent(user.login) + 
					  	   "/"+ encodeURIComponent(user.passwd);
	*/
	var authGmailCredUrl = GMAIL_CREDENTIALS_URL + 
	   "/"+ tmpLogin + 
	   "/"+ tmpPasswd;
	

	$.getJSON(authGmailCredUrl, {}, function(gmailCredentials) {

//		if (user) {
		if (gmailCredentials) {
			$("#gmailEmail").val(gmailCredentials.gmailEmail);
			$("#gmailPasswd").val(gmailCredentials.gmailPasswd);
		} else {
			console.log("walou");
		}
	});
}

function translate(){
	$("#logo").attr("title",chrome.i18n.getMessage("visitUs"));
	$("#optionsForm > p:first").html(chrome.i18n.getMessage("defaultFormOpts"));
	$("label[for=share]").html(chrome.i18n.getMessage("defaultFormOpt_share"));
	$("label[for=compose]").html(chrome.i18n.getMessage("defaultFormOpt_compose"));
	$("#p_credentials").html(chrome.i18n.getMessage("p_credentials"));
	$("#gmailEmailLabel").html(chrome.i18n.getMessage("gmailEmailLabel"));
	$("#gmailPasswdLabel").html(chrome.i18n.getMessage("gmailPasswdLabel"));
	$("#signin_submit").attr("value",chrome.i18n.getMessage("saveBtn"));
	$("iframe").attr("src",chrome.i18n.getMessage("supportPage"));
	$("#footer > a").attr("title",chrome.i18n.getMessage("visitUs"));
}
