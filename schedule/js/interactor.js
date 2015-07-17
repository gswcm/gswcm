//-- Window scroll event handler
$.fn.scrollEnd = function(callback, timeout) {
	$(this).scroll(function(){
		var $this = $(this);
		if ($this.data('scrollTimeout')) {
			clearTimeout($this.data('scrollTimeout'));
		}
		$this.data('scrollTimeout', setTimeout(callback,timeout));
	});
};
//-- Smooth scrolling to 'position'
function smoothScrollTo(position) {
	$(document.body).animate({
		scrollTop: position,
		duration: 10
	});
}
function getInstructorInfo(container) {
	if(localStorage.getItem('sched.param(mini)') === '0') {
		return container.html();
	}
	else {
		var title = container.find('b:eq(0)').text().trim();
		var email = container.find('a:eq(0)').text().trim();
		var phone = container.find('a:eq(1)').text().trim();		container.find('a').remove();
		container.find('b').remove();
		var info = container.text().trim();
		return (title + '\n' + email + '\n' + info + '\n' + phone).trim();
	}
}
function updateLocationInfo(locMap,mapHTML,foundLocal) {
	var mini = localStorage.getItem('sched.param(mini)');
	for(var tdIndex=0, tc = locMap.td.length; tdIndex < tc; tdIndex++) {
		var locText = locMap.td[tdIndex].text().trim().split(/\s+/);
		locMap.td[tdIndex].empty().append($('<a>').attr('href','#').click(function(){return false;}).css('cursor','pointer').text(locText[0]));
		if(locText.length > 1) {
			locMap.td[tdIndex].find('a').after($('<span>').text(' ' + locText[1]));
		}
		if(mini === '0') {
			locMap.td[tdIndex].find('a').addClass('tooltip').tooltipster({
				content: $(mapHTML),
				theme: 'tooltipster-light',
				interactive: true,
				delay: 0,
				arrow: true,
				onlyOne: true,
				trigger: 'click',
				autoClose: true,
				functionReady: function(origin,tooltip){
					$(tooltip)
						.css({'background':'transparent','border':'none','padding':'0px 0px'})
						.click(function(){
							$('.tooltip').tooltipster('hide');
						})
						.find('.modal-dialog').css({'margin':'0px'});
				}
			});
		}
		else {
			locMap.td[tdIndex].find('a').attr('title',locMap.buildingData.mini);
		}
	}
}
function updateInstructorInfo(nameMap, text, foundLocal) {
	var mini = localStorage.getItem('sched.param(mini)');
	var tdIndexInstructor = nameMap.tdIndexInstructor;
	var lname = nameMap.lname;
	var name = nameMap.name;
	for(var tdIndex=0, tc = nameMap.td.length; tdIndex < tc; tdIndex++) {
		var td = nameMap.td[tdIndex];
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
	$('a[href="#"]:contains("Top")').next('a').each(function(){
		if(this.nextSibling && this.nextSibling.nodeType === 3) {
			this.nextSibling.remove();
		}
		$(this).text('RAIN Homepage').attr({'href':'https://rain.gsw.edu','target':'_blank'});
	})
	//-- Move general info into a DIV with class name genInfo
	var genInfoTemp = $('<div>').append($('#topOfThePage').nextUntil('a[name="A"]').detach());
	//console.log(genInfoTemp[0].outerHTML);
	$('#topOfThePage').after(
		$('<div class="filter-genInfo filter-all filter-shown">').html(
			'<a href="#" onclick="localStorage.clear();location.reload();return false;" style="float:right;">Refresh data</a>' +
			genInfoTemp.find('h2:eq(0)')[0].outerHTML +
			genInfoTemp.find('h2:eq(1)')[0].outerHTML +
			genInfoTemp.find('table:eq(0)')[0].outerHTML +
			'<div style="background:#E9EBF1;">' + genInfoTemp.find('table:eq(1) b')[0].outerHTML + '</div>' +
			'<p>' + genInfoTemp.find('table:eq(2) a').attr('target','_blank')[0].outerHTML + '</p>' +
			'<div style="background:#E9EBF1;">'	+ genInfoTemp.find('table:eq(3) tr:eq(0) td:eq(0)').html() + '</div>' +
			'<div style="margin:2em auto;">' + genInfoTemp.find('table:eq(3)').parent().next()[0].outerHTML + '</div>' +
			genInfoTemp.find('table:eq(4)').css('width','100%')[0].outerHTML +
			'<div style="margin:2em auto;">' + genInfoTemp.find('table:eq(5) tr:eq(0) td:eq(0)').not('hr').html().replace(/<hr>/,'') + '</div>'
		)
	)
	//-- Generate filter button from menuButton div and filter dialog
	var filterContent = $('<div style="padding:auto 20px;width:800px;margin-top:3px;" id="filterPanel">')
		.append($('<p style="color:rgb(0, 0, 153)">').html('Select items do be displayed/hidden. Please notice that <b>day-of-the-week</b> selection requires <b>exact</b> match (logical \'AND\'), e.g. to display Monday-Wednesday classes you have to check both "M" and "W" and nothing else. Do not combine "Online" offering with any other "days". Make sure to <u>untick</u> \'Any\' before specifying day filtering.'))
		.append($('<input type="checkbox" id="cb_hideGenInfo">'))
		.append($('<label for="cb_hideGenInfo">').text('Hide general information').css('margin-right','3em'))
		.append($('<input type="checkbox" id="cb_hideClosedSections">'))
		.append($('<label for="cb_hideClosedSections">').text('Hide "Closed" sections').css('margin-right','3em'))
		.append($('<input type="checkbox" id="cb_showM" data-val="M" data-type="dow">').prop('disabled',true))
		.append($('<label for="cb_showM">').text('M'))
		.append($('<input type="checkbox" id="cb_showT" data-val="T" data-type="dow">').prop('disabled',true))
		.append($('<label for="cb_showT">').text('T'))
		.append($('<input type="checkbox" id="cb_showW" data-val="W" data-type="dow">').prop('disabled',true))
		.append($('<label for="cb_showW">').text('W'))
		.append($('<input type="checkbox" id="cb_showR" data-val="R" data-type="dow">').prop('disabled',true))
		.append($('<label for="cb_showR">').text('R'))
		.append($('<input type="checkbox" id="cb_showF" data-val="F" data-type="dow">').prop('disabled',true))
		.append($('<label for="cb_showF">').text('F'))
		.append($('<input type="checkbox" id="cb_showS" data-val="S" data-type="dow">').prop('disabled',true))
		.append($('<label for="cb_showS">').text('S'))
		.append($('<input type="checkbox" id="cb_showO" data-val="O" data-type="dow" title="Combined with \'Practicum\' courses">').prop('disabled',true))
		.append($('<label for="cb_showO">').text('Online'))
		.append(
			$('<input type="checkbox" id="cb_showAny">')
			.css('margin-left','1em')
			.change(function(){
				$(this).parent().find('input[data-type="dow"]').prop('disabled',this.checked);
			})
			.prop('checked','true')
		)
		.append($('<label for="cb_showAny">').text('Any'))
		.append($('<button>').css({'float':'right','margin-top':'-5px'}).text('Apply').click(function(){
			//-- Clean up previous settings for 'filter-hidden' and 'filter-shown' classes
			$('.filter-hidden').removeClass('filter-hidden');
			$('.filter-shown').removeClass('filter-shown');
			//-- Handling dayes-of-the-week
			var dowItems = $(this).parent().find('input:not(#cb_showAny)[data-type="dow"]:checked');
			var dowSelector = '';
			if($(this).parent().find('input#cb_showAny').prop('checked') === false) {
				dowItems.each(function(){
					dowSelector += $(this).attr('data-val') + ' ';
				})
				if(dowSelector !== '') {
					$('.filter-all:not(.filter-genInfo):not(.filter-dow-' + dowSelector.trim().replace(/\s+/g,'-') + ')').addClass('filter-hidden');
				}
				else {
					$('.filter-all:not(.filter-genInfo)').addClass('filter-hidden');
				}
			}
			//-- General info div
			if($(this).parent().find('input#cb_hideGenInfo')[0].checked) {
				$('.filter-genInfo').addClass('filter-hidden');
			}
			//-- Closed sections
			if($(this).parent().find('input#cb_hideClosedSections')[0].checked) {
				$('.filter-closedSection').addClass('filter-hidden');
			}
			$('.filter-all:not(.filter-hidden)').addClass('filter-shown').show();
			$('.filter-hidden').hide();
			//-- Hide empty tables
			$('font > table').each(function(index){
				var entriesToHideOrShow = $(this);
				if($(this).find('tr.filter-shown').length === 0) {
					entriesToHideOrShow.hide()
				}
				else {
					entriesToHideOrShow.show()
				}
			})
			//-- Scroll to stored position
			if($(window).data('topRow') !== null) {
				smoothScrollTo($(window).data('topRow').offset().top);
			}
		}).button())
	$('#menuButton').text('Filter').button().draggable();
	$('#menuButton').css({'position':'fixed','left':'50%'}).addClass('tooltip').tooltipster({
		trigger: 'click',
		arrow: false,
		content: filterContent,
		theme: 'tooltipster-noir',
		speed: 100,
		interactive: true
	});

	//-- Mapping between instructor's name and table-row where this instructor is listed
	nameMap = {};
	//-- Mapping between location code and map data in HTML
	locMap = {};
	//-- Iterate through tables (each subject letter is associated with a table)
	var numOfTables = $("font > table").length;
	$("font > table").each(function(table_index){
		//-- Skip certain tables if needed (!== 12 for 'T')
		if(table_index < 0) {
			return true;
		}
		//-- Discover table layout to find indeces of 'td' where course description and instructor name are stored
		var tdIndexStatus = -1;
		var tdIndexCRN = -1;
		var tdIndexSubj = -1;
		var tdIndexTitle = -1;
		var tdIndexDays = -1;
		var tdIndexLoc = -1;
		var tdIndexInstructor = -1;
		var trLength = $(this).find("tr:eq(0) th").length;
		$(this).find("tr:eq(0) th").each(function(th_index){
			var th_data = $(this).text().toLowerCase().trim();
			if(th_data === '' && tdIndexStatus == -1) {
				tdIndexStatus = th_index;
			}
			else if(th_data === 'crn' && tdIndexCRN == -1) {
				tdIndexCRN = th_index;
			}
			else if(th_data === 'subj code' && tdIndexSubj == -1) {
				tdIndexSubj = th_index;
			}
			else if(th_data === 'title' && tdIndexTitle == -1) {
				tdIndexTitle = th_index;
			}
			else if(th_data === 'days' && tdIndexDays == -1) {
				tdIndexDays = th_index;
			}
			else if(th_data === 'location' && tdIndexLoc == -1) {
				tdIndexLoc = th_index;
			}
			else if(th_data === 'instructor' && tdIndexInstructor == -1) {
				tdIndexInstructor = th_index;
			}
		});
		//-- Iterate through all table rows
		$(this).find("tr:gt(0)").each(function(tr_index){
			var tr = $(this);
			var days = tr.find("td:eq(" + tdIndexDays + ")").text().trim();
			var subj = tr.find("td:eq(" + tdIndexSubj + ")").text().trim();
			var numb = tr.find("td:eq(" + (tdIndexTitle-1) + ")").text().trim();
			var desc = tr.find("td:eq(" + tdIndexTitle + ")").text().trim();
			var CRN = tr.find("td:eq(" + tdIndexCRN + ")").text().trim();
			//-- Conditionally assign classes that will be used for filtering
			//-- Day of the week
			if(days !== '') {
				tr.addClass('filter-dow-' + days.replace(/\s+/gi,'-'))
			}
			else {
				tr.addClass('filter-dow-O')
			}
			//-- Closed section
			if(tr.find("td:eq(" + tdIndexStatus + ")").text().trim() === 'C') {
				tr.addClass('filter-closedSection');
				if(tr.next().find("td:eq(" + tdIndexSubj + ")").text().trim() === '') {
					tr.next().addClass('filter-closedSection');
				}
			}
			tr.addClass('filter-all filter-shown');
			//-- Process non-empty 'subject' entries
			if(subj === "") {
				if(tr.prev().find('td').length === tr.find('td').length) {
					var prevSubj = tr.prev().find("td:eq(" + tdIndexSubj + ")").text().trim();
					var prevCRN = tr.prev().find("td:eq(" + tdIndexCRN + ")").text().trim();
					var prevNumb = tr.prev().find("td:eq(" + (tdIndexTitle-1) + ")").text().trim();
					tr.find("td:eq(" + tdIndexTitle + ")").text('Lab session for \'' + prevSubj + ' ' + prevNumb + '\' (CRN:' + prevCRN + ')');
				}
				else {
					tr.find("td:eq(" + tdIndexTitle + ")").text('Lab session for hidden course');
				}
			}
			else if(subj.length >= 3) {
				var anchor = subj + '_' + numb;
				tr.attr({'href':'#'+anchor,'name':anchor,'data-crn':CRN}).find("td:eq(" + tdIndexTitle + ")").empty().append($('<a href="#">').text(desc).click(function(){
					if(!(tr.next().is(':visible')) || tr.next().find('td').length > 1) {
						window.history.pushState(null,anchor,'#'+anchor);
					}
					if(tr.next().find('td').length == 1) {
						tr.next().toggle('fast').toggleClass(tr.attr('class'));
					}
					else {
						tr.after($("<tr>").append($("<td colspan='" + trLength + "' style='border: 1px solid black;'>")));
						var container = tr.next().addClass(tr.attr('class')).find('td');
						var keyDesc = "sched.desc(" + anchor + ")";

						if(localStorage.getItem(keyDesc) === null) {
							$.get("raintaker.php?term=" + localStorage.getItem('sched.param(term)') + "&subj=" + subj + "&numb=" + numb, function(data){
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
													coursePrereqHTML += '<a href="' + currentNode.href.replace(document.domain,'rain.gsw.edu') + '" target="_blank">' + currentNode.text + '</a>';
												}
												else {
													coursePrereqHTML += '<span style="color:blue; cursor:not-allowed;">' + currentNode.text + '</span>';
												}
											}
											currentNode = currentNode.nextSibling;
										}
									}
									else {
										coursePrereqHTML = '<span>Restrictions may apply. More details can be found <a href="' +
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
			//-- Location pre-processing
			var loc = tr.find("td:eq(" + tdIndexLoc + ")").text().trim().split(" ")[0];
			if(!(loc in locMap)) {
				locMap[loc] = {};
				locMap[loc].td = [];
			}
			locMap[loc].td.push(tr.find("td:eq(" + tdIndexLoc + ")"));
			//-- Instructor name pre-processing
			var td = tr.find("td:eq(" + tdIndexInstructor + ")");
			var name = td.text().trim();
			if(!(name in nameMap)) {
				nameMap[name] = {};
				nameMap[name].td = [];
			}
			nameMap[name].td.push(td);
		});
	});
	//-- Location post-processing
	var buildingData = getBuildingData();
	for(key in locMap) {
		(function(loc){
			if(loc in buildingData) {
				locMap[loc].buildingData = buildingData[loc];
				if(localStorage.getItem('sched.location(' + loc + ')') === null) {
					$.get('raintaker.php?location',function(data){
						var clearData = data.replace(/[<]img\s+src=["]image[/](directions|car|bike|walk)[.]png["].+[/][>]/gi,'');
						var mapHTML = $($.parseHTML(clearData)).find('div#' + buildingData[loc].maxi + ' div.modal-dialog').each(function(){$(this).find('.modal-header,.modal-footer').remove();})[0].outerHTML;
						localStorage.setItem('sched.location(' + loc + ')',mapHTML);
						updateLocationInfo(locMap[loc],mapHTML,false);
					})
				}
				else {
					updateLocationInfo(locMap[loc],localStorage.getItem('sched.location(' + loc + ')'),true);
				}
			}
		})(key);
	}
	//-- Instructor name post-processing
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
			nameMap[name].name = name;
			if(localStorage.getItem(keyName) === null) {
				$.get('raintaker.php?name=' + lname, function(data){
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
					updateInstructorInfo(nameMap[name], localStorage.getItem(keyName),false);
				});
			}
			else {
				updateInstructorInfo(nameMap[name], localStorage.getItem(keyName),true);
			}
		})(key);
	}
	//-- Scroll to URL anchor (if defined)
	if(window.location.hash !== "") {
		var urlTarget = window.location.hash.split('#')[1];
		if(urlTarget.match('^[0-9]{4}$') !== null) {
			if($('tr[data-crn=' + urlTarget + ']').length > 0) {
				$(window).scrollTop($('tr[data-crn=' + urlTarget + ']').offset().top);
			}
		}
		else if(urlTarget.match('^[A-Z]{2,4}_[0-9]{1,4}[ABCLHJWMXK]?$') !== null) {
			if($('tr[name=' + urlTarget + ']').length > 0) {
				$(window).scrollTop($('tr[name=' + urlTarget + ']:eq(0)').offset().top);
			}
		}
		else if(urlTarget.match('^[A-Z]$') !== null) {
			$(window).scrollTop($('a[name=' + urlTarget + ']:eq(0)').offset().top);
		}
	}
	$(window).scrollEnd(function(){
		var winTop = $(window).scrollTop();
		var scrollDomain = $('.filter-shown:not(.filter-genInfo)');
		if(scrollDomain.first().offset().top - winTop > 20) {
			$(window).data('topRow',null);
			return;
		}
		var $prev = null;
		scrollDomain.each(function(index){
			var distToThis = $(this).offset().top - winTop; //-- positive value if $(this) is fully visible on window
			var distToPrev = ($prev === null) ? -100 : $prev.offset().top - winTop;
			if(distToThis > 0 && distToPrev < 0) {
				$(window).data('topRow', (Math.abs(distToThis) < Math.abs(distToPrev)) ? $(this) : $prev);
				return false;
			}
			$prev = $(this);
		})
		if($(window).data('topRow') !== null) {
			smoothScrollTo($(window).data('topRow').offset().top);
		}
	},1000);
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
	$(window).data('topRow',null);
	$.get('raintaker.php?schedterm=' + localStorage.getItem('sched.param(term)'), function(data){
		//http://jsfiddle.net/MCSyr/273/
		scheduleProcessor(data);
		$('#menuButton').repeat(1000).toggleClass('ui-state-hover').wait(50).toggleClass('ui-state-hover');
	});
})
