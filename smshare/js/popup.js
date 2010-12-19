// *************************************************************************************************************************
// *************************************************************************************************************************
//
// CREDITS 
// REST WS : http://github.com/jeremys/Simple-Rest-Client-Chrome-Extension/blob/master/simple-rest-client/requester.js
// iPod menu : http://www.barandis.com/dev/jquery/ddmenu/features.html
// 
// http://www.smshare.fr
// *************************************************************************************************************************
// *************************************************************************************************************************



//GLOBAL VARIABLE :

var leftLabel = chrome.i18n.getMessage('restant');

var bgPage = chrome.extension.getBackgroundPage();

var user = bgPage.user;


/**
 * @param num : weather the first fieldset or the second
 */
function setContactMenuContent(num){
	
	var menuContent = new Object();

	getContactFromData(bgPage.contactDATA, menuContent);

	$("#nav"+num).html(menuContent.ul);

	if(menuContent.backText){
		$('#nav'+num+' > ul').ddMenu({rootTitle: menuContent.rootTitle, duration: 250, backText:menuContent.backText});
	}else{
		$('#nav'+num+' > ul').ddMenu({rootTitle: menuContent.rootTitle, duration: 250});
	}
	

	//Éviter le display none sur le menu avant sa fabrication.
//	$('.inner').hide();//cacher le ddMenu
	$('#inner'+num).hide();//cacher le ddMenu

	//Moving elements : http://www.elated.com/articles/jquery-removing-replacing-moving-elements/
//	$("#share_menu_fieldset1 div.inner").append( $("#nav1") );
	$("#nav"+num).appendTo( "#inner"+num );
	
	
	
	//Change the loading img to a button and make it clickable
	$('#slidebottom'+num+' img').attr("src", "images/android_head2.png").addClass("contact-button");
	//$('#slidebottom1 img, #slidebottom2 img').addClass("contact-button");
	
	//OnClick show contact list (ddMenu)
	$('#slidebottom'+num+' img').click(function() {
		$(this).next().slideToggle('fast');
	});
	
	//Append clicked phone number to destination input, setup error page 
	if(menuContent.contactErrorPage)
	{
		addErrorBehavior(menuContent.contactErrorPage, num);	
	}
	else{
		addPhoneBehavior(num);	
	}
	
}


function getContactFromData(data, menuContent){
	if(!data){//NO DATA
		var a = $(document.createElement('a'));
//		a.html(chrome.i18n.getMessage("leaveUsMsg"));
		errorText = chrome.i18n.getMessage("noContactData");
		var li_ph = $(document.createElement('li'));
	//	li_ph.html(a);

		var ul = $(document.createElement('ul'));
		ul.append(li_ph);
		
		menuContent.ul = ul;
		menuContent.rootTitle = errorText;
		menuContent.contactErrorPage = CONTACTS_US_PAGE_URL;

    	return;
	}
	
		
	if(data.length == 1){//Looking for errors
		
		var nick = data[0].nick;
		if (nick == "error"){

			var errorText='';
			var a = $(document.createElement('a'));
			var errorCode = data[0].phones[0];
			log('errorCode='+errorCode);
			
			switch (errorCode){
				case constant.status.PROXY_AUTHENTICATION_REQUIRED :
					a.html(chrome.i18n.getMessage("goToOptPage"));
					errorText = chrome.i18n.getMessage("gmail407");
					break;
					
				case constant.status.UNAUTHORIZED :
					//UNAUTHORIZED gmail
					a.html(chrome.i18n.getMessage("goToOptPage"));
					errorText = chrome.i18n.getMessage("gmail401");
					break;
					
				case constant.status.NOT_FOUND :
					//UNAUTHORIZED smshare
					a = null;
					errorText = chrome.i18n.getMessage("reconnectionRequired");
					break;
					
				case constant.status.BAD_GATEWAY :
					a = null;
					errorText = chrome.i18n.getMessage("gmail502");
					break;
			}
			
			var li = $(document.createElement('li'));
			if(a){
				li.html(a);
			}

			var ul = $(document.createElement('ul'));
			ul.append(li);
			
			menuContent.ul = ul;
			menuContent.rootTitle = errorText;
			menuContent.contactErrorPage = "options.html";
			
	    	return;
		}
	}

	//root ul
	var ul = $(document.createElement('ul'));
	for(k = 0 ; k < data.length; k++){
		//var li = $(document.createElement('li'));
		var li = $('<li>');//Je croix que c'est plus lent que la création en js normal
		var span = $(document.createElement('span'));
		span.html(data[k].nick);
		
		var ul_c = $(document.createElement('ul'));
		for(j=0; j< data[k].phones.length ; j++)
		{
			var li_ph = $(document.createElement('li'));
			var a = $(document.createElement('a'));
			a.html(data[k].phones[j]);
			a.attr("href",data[k].phones[j]);
			
			li_ph.html(a);
			ul_c.append(li_ph);
		}
		
		li.append(span);
		li.append(ul_c);
		ul.append(li);
	}
	
	
	menuContent.ul = ul;
	menuContent.rootTitle = chrome.i18n.getMessage("chooseAContact");
	menuContent.backText  = chrome.i18n.getMessage("back");
}
	
	
function addPhoneBehavior(num){
	//Get the contact phone number
	$("#inner"+num+" a").click(function(e){
		$("#share_menu_fieldset"+num+" input[name=destination]").val($(this).attr("href"));
		$('#inner'+num).hide();
		e.preventDefault();
	});
}

function addErrorBehavior(page){
	$("#nav"+num+" a").click(function(e){
		$('#inner'+num).hide();
		e.preventDefault();
		window.open(page,'_newtab');
	});
}





//NOT USED : A VIRER APRES http://forum.springsource.org/showthread.php?p=321061#post321061
function getGoogleContacts2(user){
	
	var req = new XMLHttpRequest();
	
	 req = new XMLHttpRequest();
	 req.onreadystatechange = getGoogleContactsCB;
	 var authContactMenuContentUrl = CONTACTS_MENU_CONTENT_URL + "/" + user.login + "/" + user.passwd ;
	 req.open("GET",authContactMenuContentUrl, true);
	
	 //req.setRequestHeader("Content-Type", "text/plain; charset=UTF-8");
	 //req.setRequestHeader("Content-Type", "application/xml;charset=utf-8");
	 //req.setRequestHeader("Accept", "text/plain");

	 req.send("");
	 	
		 return false;
}

//NOT USED : A VIRER APRES http://forum.springsource.org/showthread.php?p=321061#post321061
function getGoogleContactsCB()
{
	if (this.readyState == 4) {
		if(this.responseXML){
			var info = this.responseXML.firstChild;
			var status = info.getElementsByTagName('status');
			
		}
		//var strText = req.responseText;
	  	//var xmlReep = req.responseXML;
		
		log(this.responseText);
		$("#nav").html(this.responseText);
		//TODO i18n
    	$('#nav > ul').ddMenu({rootTitle: 'Choose a contact',	duration: 250  });
    	
		
		return false;
	}
}









function partager(form) {

	if(user != null && user.status == "200"){
		sendNewShareLink(form);
	}else{
		//TODO : showNotification : "You are logged out, you must log in again before continue."
	}
}

//function sendNewShareLink(user, form) {
function sendNewShareLink(form) {
	
//	var req = new XMLHttpRequest();
//	req = new XMLHttpRequest();
//	req.onreadystatechange = readResponse;
//	req.open("POST", SHARE_SERVICE_URL, true);

//  req.setRequestHeader("Content-Type", "text/plain");
//  req.setRequestHeader("Content-Type", "application/xml;charset=utf-8");
//  req.setRequestHeader("Accept", "application/xml");

	var dest = $('#' + form + ' input[name="destination"]').val();
	var msg = $('#' + form + ' textarea').val();


	var smshareBean = new Object();
	
	var smshareUser = new Object();
	smshareUser.login = user.login; 
	smshareUser.passwd = user.passwd;
	smshareBean.user = smshareUser;  
	
	var smsBean = new Object();
	smsBean.destination = dest;
	smsBean.message = msg;
	smshareBean.smsBean = smsBean;
	
	log("sharing sms for the user : login : "+user.login+' passwd ' + user.passwd);
	
	/*
	xmlBody = '<smshare><sms><dst>' + dest + '</dst><msg>' + msg
			+ '</msg></sms><user><login>' + user.login + '</login><passwd>'
			+ user.passwd + '</passwd></user></smshare>';
	req.send(xmlBody);
	*/
	
	jQuery.ajax({
		'type' : 'POST',
		'url' : SHARE_SERVICE_URL,
		'contentType' : 'application/json',
		'data' : $.toJSON(smshareBean),
		'dataType' : 'json',
		'success' : readResponse });
	

	return false;
	
}

function readResponse(data, textStatus) {
		log(textStatus);
		$('#result').html("");
		if (data.status) {
			if (data.status == '200') {
				$('#result').append("<img src='images/ok.png' />");
				$('#result').append("<span>" + chrome.i18n.getMessage('smsSent')+ "</span>");

				// window.close();
				window.setTimeout(window.close, CLOSE_DELAY);

			} else if (data.status == '401') {
				// it means the server doesn't find the user in its db.
				// user must reconnect.
				var bgPage = chrome.extension.getBackgroundPage();
				bgPage.changePopupToRegister();

				$('#result').append("<img src='images/attention.gif' style='width:14px' />");
				$('#result').append("<span>" + chrome.i18n.getMessage('reconnectionRequired')+ "</span>");

			} else if (data.status == '500') {
				$('#result').append("<img src='images/attention.gif' style='width:14px' />");
				$('#result').append("<span>" + chrome.i18n.getMessage('error500')+ "</span>");
			}
		} else {
			$('#result').append("<img src='images/attention.gif' style='width:14px' />");
			$('#result').append("<span>" + chrome.i18n.getMessage('unknownError')+ "</span>");
		}

		$('#result').show();
		return false;
}





/* * * * * * * * * * * * * * * * * * * * * *  */
/* * * * * D O C U M E N T  R E A D Y * * * * */

$(function() { // JQUERY ON LOAD
	
	//Éviter le display none sur le menu avant sa fabrication. sinon les propriété css seront effacées et le dd menu verra height == 0 sur le deuxième menu
	$("#share_menu_fieldset1").hide();
	$("#share_menu_fieldset2").hide();
	
	
	//Which form (fieldset) to show :
	var options = restoreOption();
	
	log(options.defaultAction);

	if (options.defaultAction == "share") {
		toggleSig1("fast");
		//menu ipod js
		setTimeout("setContactMenuContent(1)",1000);
		setTimeout("setContactMenuContent(2)",3000);
	} else {
		toggleSig2("fast")
		//menu ipod js
		setTimeout("setContactMenuContent(2)",600);
//		setTimeout("setContactMenuContent(1)",3000);
	}
	
	
	// L A N G U A G E 
	translate();

	
	/* - - - - - - - - - - - - - - - - - - - - - - - - - */
	/* - - - - - F O N C T I O N N A L I T É - - - - - - */
	
	
	// $(".signin").click(function(e) {
	$("#sig1").click(function(e) {
		toggleSig1();
		// + fermer le deuxieme s'il est ouvert
		if ($("#smshareMenu2").hasClass("menu-open")) {
			toggleSig2();
		}
	
		e.preventDefault();
	});
	
	$("#sig2").click(function(e) {
		e.preventDefault();
		toggleSig2()
	
		if ($("#smshareMenu").hasClass("menu-open")) {
			toggleSig1();
		}
	});
	
	$("fieldset#signin_menu").mouseup(function() {
		return false;
	});
	
	
	
	
	
	$('#deconnex').click(
					function() {
						//var bgPage = chrome.extension.getBackgroundPage();
						bgPage.changePopupToRegister();
						deleteAllUser();
						bgPage.stopTimeout();
						bgPage.clearContactDATA();
						// TODO use html table for result
						$('#result').append("<img src='images/ok.png' style='float:none;' />");
						$('#result').append("<span>"+ chrome.i18n.getMessage('disconnected')+ "</span>");
						// window.close();
						window.setTimeout(window.close, CLOSE_DELAY);
					});
	
	$('#signinForm').submit(
					function(e) {
						var dest = $(
								'#signinForm input[name="destination"]')
								.val();
						var msg = $('#signinForm textarea')
								.val();
						if (dest == null || dest.length == 0) {
							$('#imgD').show();
							return false
						}
						if (msg == null || msg.length == 0) {
							$('#imgL').show();
							return false;
						}
						// VALIDATION OK
						partager("signinForm");
						e.preventDefault();
	
					});
	
	$('#newSmsForm').submit(
					function(e) {
						var dest = $(
								'#newSmsForm input[name="destination"]')
								.val();
						var msg = $('#newSmsForm textarea')
								.val();
						if (dest == null || dest.length == 0) {
							$('#imgD2').show();
							return false
						}
						if (msg == null || msg.length == 0) {
							$('#imgM').show();
							return false;
						}
						partager("newSmsForm");
						e.preventDefault();
					});
	
	/* - - - - - F O N C T I O N N A L I T É - - - - - - */
	/* - - - - - - - - - - - - - - - - - - - - - - - - - */
	
	// TODO DEPLACER
	// C O M M U N
	// select all desired input fields and attach tooltips to them
	
	$(".img4validation").tooltip({
	
		// place tooltip on the right edge
		// position: "center right",
		position : "center right",
	
		// a little tweaking of the position : vertical ,
		// horizontal
		offset : [ 0, 10 ],
	
		// use the built-in fadeIn/fadeOut effect
		effect : "fade",
	
		// custom opacity setting
		opacity : 0.7,
	
		// use this single tooltip element
		tip : '.tooltip'
	
	});
	
	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
	/* * * G E S T I O N   D E   L A   T A I L L E   D E S   S M S * * */
	
	/*
	$('#lien, #message').keyup(
			function() {
				var left = 160 - $(this).val().length;
				//Cut down the string
				if (left < 0) {
					left = 0;
					// Cut down the string
					$(this).val($(this).val().substr(0, 160));
				}
				
				$(this).next().text(leftLabel + left);
			});
	*/
	
	// Don't cut down the string
	$('#lien, #message').keyup(
			function() {
				var left = 160 - ($(this).val().length % 161);
				
				if($(this).val().length > 160){
					left = left -1;
				}
				
				//$(this).next().text(leftLabel + left);
				var nbMsg = Math.floor($(this).val().length / 161) + 1;
				//Math.floor(nbMsg)+1
				$(this).next().text(left+' : '+nbMsg);
			});
	
	/* * * G E S T I O N   D E   L A   T A I L L E   D E S   S M S * * */
	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
	
	});// Fin de jquery onLoad



/**
 * Get "default action" preference from localStorage.
 * The default action will used to determine which form to open by default when opening smshare popup.
 */
function restoreOption() {
	var options = new Object();

	var favorite = localStorage["defaultAction"];
	if (!favorite) {
		// share is defaultAction
		options.defaultAction = "share";
	} else {
		options.defaultAction = favorite;
	}

	return options;
}


function toggleSig1(fast) {
	// $("#sig1").toggleClass("menu-open");
	$("#smshareMenu").toggleClass("menu-open");
	if (fast) {
		$("fieldset#share_menu_fieldset1").toggle();
	} else {
		$("fieldset#share_menu_fieldset1").slideToggle("slow");
	}

	var textL = $('#lien').val();
	if (textL == null || textL == "" || textL.length == 0) {
		// mettre le lien dans le input :
		chrome.tabs.getSelected(null, function(tab) {
			getTinyURL(tab.url, function(tinyurl) {
				// Do something with tinyurl:
				$('#lien').val(tinyurl);
			});
		});
	}

}

function toggleSig2(fast) {
	
	// $("#sig2").toggleClass("menu-open");
	$("#smshareMenu2").toggleClass("menu-open");
	if (fast) {
		$("fieldset#share_menu_fieldset2").toggle();
	} else {
		$("fieldset#share_menu_fieldset2").slideToggle("slow");
	}
}



/**
 * Get tiny url
 * http://james.padolsey.com/javascript/create-a-tinyurl-with-jsonp/
 */
function getTinyURL(longURL, success) {

	var API = 'http://json-tinyurl.appspot.com/?url=', URL = API
			+ encodeURIComponent(longURL) + '&callback=?';

	$.getJSON(URL, function(data) {
		success && success(data.tinyurl);
	});

}


/**
 * translate each text to the browser language
 */
function translate(){
	$("#deconnex").html(chrome.i18n.getMessage("deconnex"));
	$("#sig1 > span").html(chrome.i18n.getMessage("shareLink"));
	$("label[for=destination]").html(chrome.i18n.getMessage("destinationLabel"));
	$("#imgD").attr("title",chrome.i18n.getMessage("destinationWarning"));
	$("#destination").attr("title",	chrome.i18n.getMessage("destinationLabel"));
	$("label[for=lien]").html(chrome.i18n.getMessage("lienLabel"));
	$("#imgL").attr("title",chrome.i18n.getMessage("lienWarning"));
	$("input[type=submit]").attr("value",chrome.i18n.getMessage("submit"));

	$("#sig2 > span").html(chrome.i18n.getMessage("composeSMS"));
	$("label[for=destination2]").html(chrome.i18n.getMessage("destinationLabel"));
	$("#imgD2").attr("title",chrome.i18n.getMessage("destinationWarning"));
	$("#destination").attr("title",chrome.i18n.getMessage("destinationLabel"));
	$("#imgM").attr("title",chrome.i18n.getMessage("lienWarning"));
}
