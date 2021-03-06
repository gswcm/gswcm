<?php

	//-- Error reporting function
	function error($message) {
		fwrite(STDERR, $message."\n");
	}
	//-- Function extracts username field from a record returned by $adldap->folder()->listing() function
	function get_cur_username($user) {
		return $user["samaccountname"][0];
	}
	function get_new_username($user) {
		return $user["uid"];
	}

	require_once(dirname(__FILE__) . '/adLDAP/src/adLDAP.php');
	try{
		//-- Open connection to AD server
		$adldap = new adLDAP();
		$adldap->connect();
		//-- Read list of user to be added from CSV file
		if(sizeof($argv) < 2 || !file_exists($argv[1]) || !is_readable($argv[1])) {
			error("Error: Need a readable CSV file as the 1st command-line argument.");
			exit();
		}
		$csvFile = $argv[1];
		$newUsers = array_map('str_getcsv', file($csvFile));
		$keys=array_shift($newUsers);
		foreach($newUsers as $i => $row) {
			$newUsers[$i] = array_combine($keys, $row);
		}
		echo "Info: Provided CSV file contains ".sizeof($newUsers)." new user record(s).\n";
		//-- Retrieve list of current users from AD server
		$curUsers = array_map('get_cur_username', $adldap->folder()->listing(array('People'), adLDAP::ADLDAP_FOLDER, true,'user'));
		unset($curUsers["count"]);
		echo "Info: Directory currently contains ".sizeof($curUsers)." user(s).\n";
		//-- Users not to be kept
		$lockedUsers = array(
			"simon.baev",
			"monique.daniels",
			"tanchik",
			"plz",
			"comelec",
			"mstest",
			"ay",
			"arvind.shah",
			"pi",
			"stutest",
			"sai.mukkavilli",
			"karen.cook",
			"john.stroyls",
			"linqiang.ge",
			"manoj.thapa",
			"kailash.ghimire",
			"chadwick.gugg",
			"testfac1",
			"plz_stu"
		);
		//-- Search through $curUsers and REMOVE users which are not in $newUsers
		$temp = array_map("get_new_username",$newUsers);
		foreach($curUsers as $user) {
			if(array_search($user,$temp) === FALSE && array_search($user,$lockedUsers) === FALSE) {
				echo "User '$user' is marked for removal\n";
				$adldap->user()->delete($user);
			}
		}
		//-- Add new users
		error_reporting(error_reporting() & ~E_NOTICE);
		$toIgnore = array("ttsatsin");
		$i=0;
		$maxUsersToBeAddedPerRun = 0;
		foreach($newUsers as $user) {
			$username=get_new_username($user);
			if(array_search($username,$curUsers) === FALSE) {
				//-- This user is not yet listed in the directory... Add him/her
				if($maxUsersToBeAddedPerRun > 0 && $i++ > $maxUsersToBeAddedPerRun) {
					break;
				}
				if(array_search($username,$toIgnore) === FALSE) {
					$toIgnore[] = $username;
					$result = $adldap->user()->create(
						array(
							"username"		=> $username,
							"logon_name"	=> $username."@gswcm.local",
							"firstname"		=> $user["fname"],
							"surname"		=> $user["lname"],
							"email"			=> $username."@radar.gsw.edu",
							"container"		=> array("People",$user["ou"]),
							"enabled" 		=> 1,
							"password" 		=> $user["passwd"],
							"department" 	=> $user["ou"],
							"display_name" => $user["fname"]." ".$user["lname"],
							"initials" 		=> $user["mname"],
							"description" 	=> $user["year"]." @ ".$user["majr"]
						)
					);
					if ($result == true) {
						$result=$adldap->group()->addUser("students",$username);
						printf("User %-10s was successfully added to the directory\n",$username);
					}
					else {
						error("Error: User '$username' was not added (".$adldap->getLastError().").\n");
					}
				}
			}
			else {
				//-- Otherwise... modify his/her "name" and "description"
				$result = $adldap->user()->modify(
					$username,
					array(
						"display_name" => $user["fname"]." ".$user["lname"],
						"description" 	=> $user["year"]." @ ".$user["majr"],
						"email"			=> $username."@radar.gsw.edu"
					)
				);
				if ($result == true) {
					$result=$adldap->group()->addUser("students",$username);
					printf("User %-10s was successfully updated in the directory\n",$username);
				}
				else {
					error("Error: User '$username' was not updated (".$adldap->getLastError().").\n");
				}
			}
		}
	}
	catch (adLDAPException $e) {
		error($e);
		exit();
	}
?>
