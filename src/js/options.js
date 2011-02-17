//variable globale
var bkPage = chrome.extension.getBackgroundPage();
var user = bkPage.user;

// JQUERY ON LOAD
$(function() {

	/* L A N G U A G E */
	translate();

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
			log("walou");
		}
	});
}

function translate(){
	$("#logo").attr("title",chrome.i18n.getMessage("visitUs"));	
	$("#p_credentials").html(chrome.i18n.getMessage("p_credentials"));
	$("#gmailEmailLabel").html(chrome.i18n.getMessage("gmailEmailLabel"));
	$("#gmailPasswdLabel").html(chrome.i18n.getMessage("gmailPasswdLabel"));
	$("#signin_submit").attr("value",chrome.i18n.getMessage("saveBtn"));
	$("iframe").attr("src",chrome.i18n.getMessage("supportPage"));
	$("#footer > a").attr("title",chrome.i18n.getMessage("visitUs"));
}
