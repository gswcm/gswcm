<?php
$term = '201508';
if(isset($_GET['term']) and $_GET['term'] !== '') {
	$term = $_GET['term'];
}
$mini = '0';
if(isset($_GET['mini']) and $_GET['mini'] !== '') {
	$mini = $_GET['mini'];
}
$debug = '0';
if(isset($_GET['debug']) and $_GET['debug'] !== '') {
	$debug = $_GET['debug'];
}
$version = '1.0.1';
if(isset($_GET['ver']) and $_GET['ver'] !== '') {
	$version = $_GET['ver'];
}
?>
<html>
<head>
	<meta charset="utf-8">
	<title>GSW Schedule of Classes</title>
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<script type="text/javascript" src="https://code.jquery.com/jquery-1.11.0.js"></script>
	<script type="text/javascript" src="js/jquery.md5.js"></script>
	<script type="text/javascript" src="js/interactor_old.js"></script>
	<?php
		if($mini == '0') {
			echo <<< EOL
	<link rel="stylesheet" type="text/css" href="css/tooltipster.css" />
	<link rel="stylesheet" type="text/css" href="css/themes/tooltipster-shadow.css" />
	<link rel="stylesheet" type="text/css" href="css/themes/tooltipster-light.css" />
	<script type="text/javascript" src="js/jquery.tooltipster.min.js"></script>
	<script src="//fast.eager.io/KozO437RIl.js"></script>
	<script src="//cdn.jsdelivr.net/jquery.scrollto/2.1.0/jquery.scrollTo.min.js"></script>
EOL;
		}
	?>
	<script>
		function getTerm(){
			return '<?php echo $term; ?>';
		}
		function getMini(){
			return '<?php echo $mini; ?>';
		}
		function getDebug(){
			return '<?php echo $debug; ?>';
		}
		function getVersion(){
			return '<?php echo $version; ?>';
		}
	</script>
</head>
<body>
	<div id='topOfThePage'>
	</div>
</body>
</html>
