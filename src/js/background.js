//GLOBAL 
var user;
var contactDATA;

//run this only when extension first load (with browser start). Otherwise, you get duplicate database
var db = null;
var db = openDatabase("SMSHAREDB", "0.3", "user credentials and connection status", 200000);

var rotation = 0;
var timeoutID ;

/*
 * I N I T I A L I S A T I O N
 */
readUser(preparePopup);


/*
  //React when a browser action's icon is clicked.
  //@DRAGON : il faut d'abord faire le setPopup null (la haut) pour que cet event soit fired

	chrome.browserAction.setPopup({
			popup: '' // Empty string means no popup. 
	 });
 
	chrome.browserAction.onClicked.addListener(function(tab) {
		//read user
	});
*/

function preparePopup(){
	var userP = this;
	log("Inside preparePopup method");
	if(! userP){
		changePopupToRegister();
		return false;
	}
	
	user = userP ;
	log("User is setup "+user.login)
	if(user.status == constant.status.CONNECTED)
	{
		var rememberMe = localStorage["rememberMe"];
		if (!rememberMe || rememberMe == 'false') {
			changePopupToRegister();
		}else{
			changePopupToDefault();
			getGoogleContacts();
            checkClientStatus(user);
			//schedule another check
        	scheduleCheckClientStatusRQ();
		}
		
	}else{
		changePopupToRegister();
	}
}

function changePopupToDefault(){
	//chrome.tabs.getSelected(null, function(tab) { 
	chrome.browserAction.setPopup({
	  popup: 'popup.html' // Empty string means no popup. 
	}); 
	//});
}

function changePopupToRegister(){
	chrome.browserAction.setPopup({
	  popup: 'register2.html' // Empty string means no popup. 
	}); 
}




function getGoogleContacts(){
	
	log("get google contact for user : login : "+user.login+" passwd : "+user.passwd);
	
	//Non seulement, il faut encoder les caratères réservés, par exemple ; -> %3B mais en plus il faut encoder le % lui même en %25
	 var tmpLogin = encodeURIComponent(encodeURIComponent(user.login));
	 var tmpPasswd = encodeURIComponent(encodeURIComponent(user.passwd));
	//var authContactMenuContentUrl = CONTACTS_MENU_CONTENT_URL + "/" + user.login + "/" + user.passwd ; 
	var authContactMenuContentUrl = CONTACTS_MENU_CONTENT_URL + "/" + tmpLogin + "/" + tmpPasswd ; 
	
	//dataType : "text", Si tu mets ça dans ton ajax : t'auras des problème d'encoding qui te feront perdre des heures :'(
	//http://forum.springsource.org/showthread.php?p=321061#post321061
	$.ajax({
		url : authContactMenuContentUrl,
		dataType:"json",
		success : function(data) {
			
			contactDATA = data;	
			
		}
	});
}




function clearContactDATA(){
   contactDATA = [ {
					'nick':'error',
					'phones':['407']
				   }
	  			 ];
}


/**
 * public & private call
 */
function stopTimeout()
{
	log("clearing timeout "+timeoutID);
	window.clearTimeout(timeoutID);
	timeoutID = null;
}



function scheduleCheckClientStatusRQ()
{
	if(!timeoutID)
	{
		log("timeout == null or false, scheduling a new timeout ");
		timeoutID = window.setTimeout(startRequest, CHECK_STATUS_DELAY);	
	}
}

function startRequest()
{
	if(timeoutID)
	{
		animateFlip();

		//Check status
		readUser(checkClientStatusCB);
		
		//schedule Another check
	    timeoutID = window.setTimeout(startRequest, CHECK_STATUS_DELAY);
	}
}

function checkClientStatusCB(){
	var dbUser = this;
	checkClientStatus(dbUser);
}

function checkClientStatus(dbUser){
	
    if(!dbUser || dbUser.status != constant.status.CONNECTED){
    	log("dbUser null or not connected, skip check status http request "+dbUser.status);
    	return false;
    }
    
	var req = new XMLHttpRequest();
	
	req = new XMLHttpRequest();
	//req.onreadystatechange = readCheckClientStatusResponse;
	req.onreadystatechange = readCheckClientStatusResponseSwitch;
	//Non seulement, il faut encoder les caratères réservés, par exemple ; -> %3B mais en plus il faut encoder le % lui même en %25
	var tmpLogin = encodeURIComponent(encodeURIComponent(user.login));
	var tmpPasswd = encodeURIComponent(encodeURIComponent(user.passwd));
	
	//var checkURL = CHECK_CLIENT_STATUS_SERVICE_URL + "/" + encodeURIComponent(user.login) + "/" + encodeURIComponent(user.passwd) ;
	var checkURL = CHECK_CLIENT_STATUS_SERVICE_URL + "/" + tmpLogin + "/" + tmpPasswd ;
	log("user.login="+user.login+" user.passwd"+user.passwd+" checkURL = "+ checkURL);
	req.open("GET",checkURL,true);
	
	//req.send("");
	req.send(null);
	 	
	return false;
}

function readCheckClientStatusResponseSwitch() {
	if (this.readyState == 4) {
		if(this.responseXML) {
			var info = this.responseXML.firstChild;
			var status = info.getElementsByTagName('status');
			if(status && status[0])	{
				//Le text cdata est considéré comme un noeud
				var statusData = status[0].firstChild.nodeValue;

				switch (statusData){
					case constant.status.DISCONNECTED :
						chrome.browserAction.setBadgeText({ text: constant.CLIENT_DISCONNECTED_BADGE });	
						chrome.browserAction.setTitle({	title: constant.CLIENT_DISCONNECTED_TOOLTIP });
						break;
						
					case constant.status.CONNECTED :
						chrome.browserAction.setBadgeText({ text: '' });
						chrome.browserAction.setTitle({	title: constant.NORMAL_TOOLTIP	});
						break;

					case constant.status.UNAUTHORIZED :
						changePopupToRegister();
						user.status = constant.status.UNAUTHORIZED;
						persistUser(user);
						stopTimeout();
						break;
						
					case constant.status.NOT_FOUND :
						chrome.browserAction.setBadgeText({ text: constant.CLIENT_DISCONNECTED_BADGE });	
						chrome.browserAction.setTitle({ title: constant.CLIENT_NOT_FOUND_TOOLTIP });
						break;
				}
			}
		}
		//var strText = req.responseText;
	  	//var xmlReep = req.responseXML;
		return false;
	}
}




function animateFlip() {
	  var animationFrames = 36;
	  var animationSpeed = 10; // ms
	  
	  
	  rotation += 1/animationFrames;
	  drawIconAtRotation();

	  if (rotation <= 1) {
	    setTimeout("animateFlip()", animationSpeed);
	  } else {
	    rotation = 0;
	    drawIconAtRotation();
	   /* chrome.browserAction.setBadgeText({
	      text: unreadCount != "0" ? unreadCount : ""
	    });
	    
	    chrome.browserAction.setBadgeBackgroundColor({color:[208, 0, 24, 255]});
	    */
	  }
	}


function drawIconAtRotation() {
	
	var canvas = document.getElementById('canvas');
	var loggedInImage = document.getElementById('logged_in');
	var canvasContext = canvas.getContext('2d');
	  
	  canvasContext.save();
	  canvasContext.clearRect(0, 0, canvas.width, canvas.height);
	  canvasContext.translate(
	      Math.ceil(canvas.width/2),
	      Math.ceil(canvas.height/2));
	  canvasContext.rotate(2*Math.PI*ease(rotation));
	  canvasContext.drawImage(loggedInImage,
	      -Math.ceil(canvas.width/2),
	      -Math.ceil(canvas.height/2));
	      
	  canvasContext.restore();

	  chrome.browserAction.setIcon({imageData:canvasContext.getImageData(0, 0,
	      canvas.width,canvas.height)});
	}


function ease(x) {
	  return (1-Math.sin(Math.PI/2+x*Math.PI))/2;
	}


/**
 * N O T  U S E D
 */
function showRegisterWindow(){
	window.open("register.html","","width=500px, height=500px,resizable");
}

/**
  * N O T  U S E D
  * CONTENT SCRIPT
  */
chrome.extension.onRequest.addListener(
  function(request, sender, sendResponse) {
    log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");
    if (request.mystatus == "200")
    {
	    //save then 
	    sendResponse({farewell: "goodbye"});
    }
    else
      sendResponse({}); // snub them.
  });

