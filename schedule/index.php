<?php
require_once './Mobile_Detect.php';
$detect = new Mobile_Detect;
$term = 'sched201508';
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
$version = '1.0.10';
if(isset($_GET['ver']) and $_GET['ver'] !== '') {
	$version = $_GET['ver'];
}
?>
<!--
<!DOCTYPE html>
-->
<html>
<head>
	<meta charset="utf-8">
	<title>GSW Schedule of Classes</title>
	<?php
	if($detect->isMobile() and !($detect->isTablet())) {
		echo '<meta name="viewport" content="width=640, maximum-scale=1">';
	}
	?>

	<script type="text/javascript" src="https://code.jquery.com/jquery-1.11.0.js"></script>
	<script type="text/javascript" src="js/jquery-ui.min.js"></script>
<!--
	<script type="text/javascript" src="js/jquery.ui.touch-punch.min.js"></script>
-->
	<script type="text/javascript" src="js/jquery-timing.min.js"></script>
	<script type="text/javascript" src="js/jquery.md5.js"></script>
	<script type="text/javascript" src="js/buildings.js"></script>
	<script type="text/javascript" src="js/interactor.js"></script>
	<script>
		function getDeviceType() {
			return '<?php echo ($detect->isMobile() ? ($detect->isTablet() ? 'tablet' : 'phone') : 'computer');?>';
		}
		function isMobile() {
			return <?php echo ($detect->isMobile() ? 'true' : 'false');?>;
		}

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
	<?php
		if($mini == '0') {
			echo <<< EOL
	<script type="text/javascript" src="js/jquery.tooltipster.min.js"></script>
	<script src="//fast.eager.io/KozO437RIl.js"></script>
	<link rel="stylesheet" type="text/css" href="css/tooltipster.css" />
	<link rel="stylesheet" type="text/css" href="css/themes/tooltipster-shadow.css" />
	<link rel="stylesheet" type="text/css" href="css/themes/tooltipster-light.css" />
	<link rel="stylesheet" type="text/css" href="css/themes/tooltipster-noir.css" />
	<link rel="stylesheet" type="text/css" href="css/themes/tooltipster-punk.css" />
EOL;
		}
	?>
	<link rel="stylesheet" type="text/css" href="css/jquery-ui.min.css" />
	<link rel="stylesheet" type="text/css" href="css/jquery-ui.structure.min.css" />
	<link rel="stylesheet" type="text/css" href="css/jquery-ui.theme.min.css" />
	<link rel="stylesheet" type="text/css" href="css/bootstrap-crop.css" />
	<link rel="stylesheet" type="text/css" href="css/interactor.css" />
</head>
<body>
	<a href name="#"></a>
	<div id='filterTrigger'></div>
	<div id='topOfThePage'></div>
</body>
</html>
