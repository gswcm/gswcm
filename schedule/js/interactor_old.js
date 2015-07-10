function getInstructorInfo(container) {
	if(localStorage.getItem('sched.param(mini)') === '0') {
		return container.html();
	}
	else {
		var title = container.find('b:eq(0)').text().trim();
		var email = container.find('a:eq(0)').text().trim();
		var phone = container.find('a:eq(1)').text().trim();
		container.find('a').remove();
		container.find('b').remove();
		var info = container.text().trim();
		return (title + '\n' + email + '\n' + info + '\n' + phone).trim();
	}
}
function updateInstructorInfo(nameMap, name, text, foundLocal) {
	var mini = localStorage.getItem('sched.param(mini)');
	var tdIndexInstructor = nameMap[name].tdIndexInstructor;
	var lname = nameMap[name].lname;
	for(var rowIndex=0, tc = nameMap[name].rows.length; rowIndex < tc; rowIndex++) {
		var tr = nameMap[name].rows[rowIndex];
		var td = tr.find("td:eq(" + tdIndexInstructor + ")");
		if(text.indexOf('No results were found') === -1) {
			var a = $('<a>').attr('href','https://gsw.edu/searchDirectory/employee/search.php?name=' + lname)
				.attr('target','_blank')
				.text(name);
			if(mini === '0') {
				a.addClass('tooltip').tooltipster({
					content: $(text),
					theme: 'tooltipster-light',
					interactive: true
				});
			}
			else {
				a.attr('title',text);
			}
			td.empty().append(a);
		}
		else {
			td.attr('title','No record found in the directory');
			if(mini === '0') {
				td.addClass('tooltip').tooltipster({theme: 'tooltipster-light'});
			}
			if(localStorage.getItem('sched.param(debug)') !== '0') {
				console.log('Employee directory has no record for \'' + lname + '\'');
			}
		}
	}
};
function scheduleProcessor(data) {
	$('#topOfThePage').after($(data));
	$("img").each(function(){
		var temp = $(this).attr('src');
		$(this).attr('src', 'https://rain.gsw.edu/' + temp);
	});
	$('title').after($("<a href='#'>").css('float','right').click(function(){localStorage.clear();location.reload();return false;}).text('Refresh data'));
	//-- Mapping between instructor's name and table-row where this instructor is listed
	nameMap = {};
	//-- Check if schedule data have changed
	//console.log($("font > table").length);
	//-- Iterate through tables (each subject letter is associated with a table)
	$("font > table").each(function(table_index){
		//-- Skip certain tables if needed
		if(table_index < 0) {
			return true;
		}
		//-- Discover table layout to find indeces of 'td' where course description and instructor name are stored
		var tdIndexTitle = 4;
		var tdIndexInstructor = 12;
		var tdIndexSubj = 2;
		var tdIndexCRN = 1;
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
			else if(th_data === 'CRN') {
				tdIndexCRN = th_index;
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
			var CRN = tr.find("td:eq(" + tdIndexCRN + ")").text().trim();
			if(subj !== "" && subj.length >= 3) {
				var anchor = subj + '_' + numb;
				tr.find("td:eq(" + tdIndexTitle + ")").empty().append($("<a>").attr({'href':'#'+anchor,'name':anchor,'data-crn':CRN}).text(desc).click(function(){
					if(!(tr.next().is(':visible')) || tr.next().find('td').length > 1) {
						window.history.pushState(null,anchor,'#'+anchor);
					}
					if(tr.next().find('td').length == 1) {
						tr.next().toggle('fast');
					}
					else {
						tr.after($("<tr>").append($("<td colspan='" + trLength + "' style='border: 1px solid black;'>")));
						var container = tr.next().find('td');
						var keyDesc = "sched.desc(" + anchor + ")";

						if(localStorage.getItem(keyDesc) === null) {
							$.get("raintaker_old.php?term=" + localStorage.getItem('sched.param(term)') + "&subj=" + subj + "&numb=" + numb, function(data){
								var courseDescContainer = $(data).find("table.datadisplaytable tr td.ntdefault").first();
								if(courseDescContainer.length > 0) {
									var courseDescText = courseDescContainer.contents().filter(function(){
										return this.nodeType === 3;
									})[0].nodeValue;
									var courseDescHTML = '<span>' + courseDescText + '</span>';
									var coursePrereqHTML = '';
									var currentNode = courseDescContainer.contents().filter(function(){
										return (this.nodeName === 'SPAN') && (this.textContent.indexOf('Prerequisites') > -1)
									})[0];
									if(typeof currentNode !== 'undefined') {
										while(currentNode.nextSibling !== null) {
											if((currentNode.nodeType === 3) && (currentNode.nodeValue !== '\n')) {
												coursePrereqHTML += '<span>' + currentNode.nodeValue + '</span>';
											}
											else if(currentNode.nodeType === 1 && currentNode.nodeName === 'A') {
												var targetParts = currentNode.text.split(' ');
												if(targetParts[0].length > 3)  {
													coursePrereqHTML += '<a href="' + currentNode.href.replace(document.domain,'rain.gsw.edu') + '">' + currentNode.text + '</a>';
												}
												else {
													coursePrereqHTML += '<span style="color:blue; cursor:not-allowed;">' + currentNode.text + '</span>';
												}
											}
											currentNode = currentNode.nextSibling;
										}
									}
									else {
										coursePrereqHTML = '<span>Details can be found <a href="' +
										'https://rain.gsw.edu/prod8x/bwckctlg.p_disp_course_detail?' +
										'cat_term_in=' + localStorage.getItem('sched.param(term)') +
										'&subj_code_in=' + subj +
										'&crse_numb_in=' + numb +
										'" target="_blank">here</a></span>'
									}
									var P1 = '<h3 style="margin: 0px auto;">Course Description:</h3>' + courseDescHTML;
									var P2 = '<h3 style="margin: 0px auto;">Course Prerequisites:</h3>' + coursePrereqHTML;
									localStorage.setItem(keyDesc, P1 + '<p>' + P2);
								}
								else {
									localStorage.setItem(keyDesc,'<h3 style="color:red;text-align: center;margin: 0.5em auto;">Error: cannot access RAIN to retrieve course description</h3>');
								}
								container.append($('<div style="margin: 1em;">').html(localStorage.getItem(keyDesc)));
							});
						}
						else {
							container.append($('<div style="margin: 1em;">').html(localStorage.getItem(keyDesc)));
						}
					}
					return false;
				}));
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
				$.get('raintaker_old.php?name=' + lname, function(data){
					var blocks = $(data).find("p");
					if(blocks.length == 1) {
						localStorage.setItem(keyName, getInstructorInfo(blocks));
					}
					else {
						var initialsNotFound = true;
						blocks.each(function(p_index){
							var fullname = $(this).find('b:eq(0)').text().trim();
							var email = $(this).find('a:eq(0)').text().trim();
							var nameparts = fullname.split(" ",4);
							for(var i=0, tot=nameparts.length-1; i<tot; i++) {
								if(nameparts[i].indexOf(fname.substring(0,1)) === 0) {
									localStorage.setItem(keyName, getInstructorInfo($(this)));
									initialsNotFound = false;
									return false;
								}
							}
							if(initialsNotFound === true && email.split('@')[1] === 'gsw.edu' && email.indexOf(fname.substring(0,1).toLowerCase()) === 0) {
								localStorage.setItem(keyName, getInstructorInfo($(this)));
								initialsNotFound = false;
								return false;
							}
						});
						if(initialsNotFound === true) {
							localStorage.setItem(keyName, getInstructorInfo(blocks.first()));
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
	//-- Scroll to URL anchor (if defined)
	var urlParts = (window.location.href).split('#',2);
	if(urlParts.length > 1) {
		var urlTarget = urlParts[1];
		if(urlTarget.match('^[0-9]{4}$') !== null) {
			if($('a[data-crn=' + urlTarget + ']').length > 0) {
				$(window).scrollTo($('a[data-crn=' + urlTarget + ']').trigger('click'));
			}
		}
		else if(urlTarget.match('^[A-Z]{2,4}_[0-9]{1,4}[ABCLHJWMXK]?$') !== null) {
			if($('a[name=' + urlTarget + ']').length > 0) {
				$(window).scrollTo($('a[name=' + urlTarget + ']:eq(0)').trigger('click'));
			}
		}
		else if(urlTarget.match('^[A-Z]$') !== null) {
			$(window).scrollTo($('a[name=' + urlTarget + ']:eq(0)'));
		}
	}
}
$(window).load(function(){
	//-- Minimalistic interface and version control
	var mini = getMini();
	var version = getVersion();
	if(localStorage.getItem('sched.param(mini)') !== mini || localStorage.getItem('sched.param(version)') !== version) {
		localStorage.clear();
		console.log('Local storage cleared')
	}
	localStorage.setItem('sched.param(mini)', mini);
	localStorage.setItem('sched.param(version)', version);
	//-- Debug flag: if enabled via GET ver=1
	localStorage.setItem('sched.param(debug)', getDebug());
	//-- Strore schedule term in localStorage
	localStorage.setItem('sched.param(term)', getTerm());
	//-- Load data from RAIN schedule
	$.get('raintaker_old.php?schedterm=' + localStorage.getItem('sched.param(term)'), function(data){
		//http://jsfiddle.net/MCSyr/273/
		scheduleProcessor(data);
	});
})
