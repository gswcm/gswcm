<?php
	if(isset($_GET['name'])) {
		$result = file_get_contents('https://gsw.edu/searchDirectory/employee/search.php?name=' . $_GET['name']);
	}
	else if(isset($_GET['subj']) and isset($_GET['numb']) and isset($_GET['term'])) {
		$result = file_get_contents('https://rain.gsw.edu/prod8x/bwckctlg.p_disp_course_detail?cat_term_in='.$_GET['term'].'&subj_code_in='.$_GET['subj'].'&crse_numb_in='.$_GET['numb']);
	}
	else if(isset($_GET['schedterm'])) {
		$result = file_get_contents('https://rain.gsw.edu/sched'.$_GET['schedterm'].'.htm');
	}
	else if(isset($_GET['location'])) {
		$result = file_get_contents('http://map.gsw.edu/index.html');
	}
	echo $result;
?>


