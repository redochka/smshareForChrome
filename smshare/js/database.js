var bkPage = chrome.extension.getBackgroundPage();
var db = bkPage.db;

/**
 * successCB : call back method to call when database operation success
 */
function readUser(successCB){
	
	log("in database.js");
	
	if(!db)
	{
	    log("Failed to connect to database.");
	    return false;
	}

	db.transaction(
	        function(tx) {
	            tx.executeSql("SELECT * FROM USER WHERE STATUS=?", [constant.status.CONNECTED], 
	    	            function(tx, result){
	            			log("Select query executed sucessfuly");
    	            		if(result.rows.length > 0)
    	            		{
		            			var user = getUserFromResultSet(result);
		            			successCB.call(user);
    	            		}else{
			                	log("table user vide !");
			                	successCB.call(null);
    	            		}
	            		},
	                	function(tx,error){
	            			log("sql error message : "+error.message+" code : "+error.code);
		                	log("we prepare the table user here. ");
		                	createTableUser(tx);
		                	successCB.call(null);
		                })	
	         });
}


function createTableUser(tx){
	//tx.executeSql("CREATE TABLE USER (LOGIN TEXT, PASSWD TEXT, EMAIL TEXT, STATUS INTEGER)", [], null, null);
	tx.executeSql("CREATE TABLE USER (LOGIN TEXT, PASSWD TEXT, EMAIL TEXT, STATUS INTEGER)", [],
					function(){
						log("Création de la table USER ok");
					},
					function(){
						log("Création de la table USER ko");
					});
}

/**
 * http://openbit.co.uk/?p=135
 */
function persistUser(user){
	deleteAllUser();
	insertUser(user);
}


function insertUser(newUser){
	
	if(!db)
	{
	    log("Failed to connect to database.");
	    return false;
	}
	
	db.transaction(function(tx) {
		log("Going to persist user with login : "+newUser.login + " passwd : " + newUser.passwd + "email : "+newUser.email);
		tx.executeSql('INSERT INTO USER (LOGIN, PASSWD, EMAIL,STATUS) VALUES (?, ?, ?, ?)',[newUser.login, newUser.passwd, newUser.email, newUser.status],
			function(){
				log("insertion ok");
			},
			function(){
				log("insertion ko");
				createTableUser(tx);
			});	
	});
}



function deleteAllUser(){
	if(!db)
	{
	    log("Failed to connect to database.");
	    return false;
	}
	db.transaction(function(tx) {
			tx.executeSql('DELETE FROM USER',[],
        			function(){
						log("suppression ok");
    				},
        			function(){
    					log("suppression KO !!");
	            	});
			});
}

function getUserFromResultSet(result){
	user = {
			 status: result.rows.item(0)['STATUS'],
			 login : result.rows.item(0)['LOGIN'],
			 passwd: result.rows.item(0)['PASSWD']
  		   };
	
	return user;
}