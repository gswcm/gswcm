<?php
$term = '201508';
if(isset($_GET['term']) and $_GET['term'] !== '') {
	$term = $_GET['term'];
}
?>
<html>
<head>
	<meta charset="utf-8">
	<title>GSW Schedule of Classes</title>
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<script type="text/javascript" src="https://code.jquery.com/jquery-1.11.0.js"></script>
	<script>
		function updateInstructorInfo(nameMap, name, text, foundLocal) {
			var tdIndexInstructor = nameMap[name].tdIndexInstructor;
			var lname = nameMap[name].lname;
			//console.log(name + ' | ' + foundLocal + ' | ' + lname + ' | ' + tdIndexInstructor + ' | ' + nameMap[name].rows.length);
			for(var rowIndex=0, tc = nameMap[name].rows.length; rowIndex < tc; rowIndex++) {
				var tr = nameMap[name].rows[rowIndex];
				var td = tr.find("td:eq(" + tdIndexInstructor + ")");
				td.attr('title', text);
				if(text.indexOf('No results were found') !== 0) {
					td
					.empty()
					.append(
						$('<a>')
						.attr('href','https://gsw.edu/searchDirectory/employee/search.php?name=' + lname)
						.attr('target','_blank')
						.text(name)
					);
				}
			}
		};
		$(window).load(function(){
			var term = <?php echo $term; ?>;
			var cnt = 0;
			$("body").load("raintaker.php?schedterm=" + term,function(){
				$("img").each(function(){
					var temp = $(this).attr('src');
					$(this).attr('src', 'https://rain.gsw.edu/' + temp);
				});
				$('title').after($("<a href='#'>").css('float','right').click(function(){localStorage.clear();location.reload();return false;}).text('Refresh data'));
				//-- Mapping between instructor's name and table-row where this instructor is listed
				nameMap = {};
				//-- Iterate through tables (each subject letter is associated with a table)
				$("font > table").each(function(table_index){
					if(table_index < 0) {
						return true;
					}
					//-- Discover table layout to find indeces of 'td' where course description and instructor name are stored
					var tdIndexTitle = 4;
					var tdIndexInstructor = 12;
					var tdIndexSubj = 2;
					var trLength = $(this).find("tr:eq(0) th").length;
					$(this).find("tr:eq(0) th").each(function(th_index){
						var th_data = $(this).text().toLowerCase().trim();
						if(th_data === 'title') {
							tdIndexTitle = th_index;
						}
						else if(th_data === 'instructor') {
							tdIndexInstructor = th_index;
						}
						else if(th_data === 'subj code') {
							tdIndexSubj = th_index;
						}
					});
					//-- Iterate through all table rows
					$(this).find("tr:gt(0)").each(function(tr_index){
						var subj = $(this).find("td:eq(" + tdIndexSubj + ")").text().trim();
						//-- Store refernce to table row
						var tr = $(this);
						//-- Retrieve course information and replace course 'title' by a link to RAIN
						var numb = tr.find("td:eq(" + (tdIndexTitle-1) + ")").text().trim();
						var desc = tr.find("td:eq(" + tdIndexTitle + ")").text().trim();
						if(subj !== "" && subj.length >= 3) {
							var anchor = subj + '_' + numb;
							if(tr_index >= 0) {
								tr.find("td:eq(" + tdIndexTitle + ")").empty().append($("<a>").attr({'href':'#'+anchor,'name':anchor}).text(desc).click(function(){
									if(tr.next().find('td').length == 1) {
										tr.next().toggle('fast');
									}
									else {
										tr.after($("<tr>").append($("<td colspan='" + trLength + "' style='border: 1px solid black;'>")));
										var container = tr.next().find('td');
										var keyDesc = "sched.desc(" + anchor + ")";

										if(localStorage.getItem(keyDesc) === null) {
											$.get("raintaker.php?term=" + term + "&subj=" + subj + "&numb=" + numb, function(data){
												localStorage.setItem(
													keyDesc,$(data).find("table.datadisplaytable tr td.ntdefault").each(function(){
														$(this).find('a').each(function(){
															if($(this).attr('href').trim().indexOf('p_disp_catalog_syllabus') > 0) {
																$(this).hide();
															}
															else {
																$(this).attr('href', this.href.replace(document.domain,'rain.gsw.edu'))
															}
														})
													}).html()
												);
												container.append(localStorage.getItem(keyDesc));
											});
										}
										else {
											container.append(localStorage.getItem(keyDesc));
										}
									}
									return false;
								}));
							}
							else {
								//-- old solution to add links to course names -- not in use now, kept here for reference
								tr.find("td:eq(" + tdIndexTitle + ")").empty().append($('<a>').attr({'href':'#'}).text(desc).click(function(){
									window.location.assign(
										"https://rain.gsw.edu/prod8x/bwckctlg.p_disp_course_detail" +
										"?cat_term_in=" + term +
										"&subj_code_in=" + subj +
										"&crse_numb_in=" + numb
									);
								}));
							}
						}
						//-- Populate map that binds instructor's name with owning 'tr'
						var name = tr.find("td:eq(" + tdIndexInstructor + ")").text().trim();
						//-- Associate references to table and row to instructor's name
						if(!(name in nameMap)) {
							nameMap[name] = {};
							nameMap[name].rows = [];
						}
						nameMap[name].rows.push(tr);
						nameMap[name].tdIndexInstructor = tdIndexInstructor;
					});
				});
				//-- Examine populated map and update referred rows of course table
				for(key in nameMap) {
					(function(name){
						var keyName = "sched.name(" + name + ")";
						var lname = name;
						var fname = '';
						if(name.split(',').length > 1) {
							lname = name.split(",")[0].trim();
							fname = name.split(",")[1].trim();
						}
						nameMap[name].lname = lname;
						if(localStorage.getItem(keyName) === null) {
							$.get('raintaker.php?name=' + lname, function(data){
								var blocks = $(data).find("p");
								if(blocks.length == 1) {
									localStorage.setItem(keyName, blocks.text());
								}
								else {
									var initialsNotFound = true;
									blocks.each(function(p_index){
										var fullname = $(this).find('b:eq(0)').text().trim();
										var email = $(this).find('a:eq(0)').text().trim();
										var nameparts = fullname.split(" ",4);
										for(var i=0, tot=nameparts.length-1; i<tot; i++) {
											if(nameparts[i].indexOf(fname.substring(0,1)) === 0) {
												localStorage.setItem(keyName, $(this).text());
												initialsNotFound = false;
												return false;
											}
										}
										if(initialsNotFound === true && email.split('@')[1] === 'gsw.edu' && email.indexOf(fname.substring(0,1).toLowerCase()) === 0) {
											localStorage.setItem(keyName, $(this).text());
											initialsNotFound = false;
											return false;
										}
									});
									if(initialsNotFound === true) {
										localStorage.setItem(keyName, blocks.first().text());
									}
								}
								updateInstructorInfo(nameMap, name, localStorage.getItem(keyName),false);
							});
						}
						else {
							updateInstructorInfo(nameMap, name, localStorage.getItem(keyName),true);
						}
					})(key);
				}
			});
		})
	</script>
</head>
</html>
