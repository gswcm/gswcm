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
	<link rel="stylesheet" type="text/css" href="css/tooltipster.css" />
	<link rel="stylesheet" type="text/css" href="css/themes/tooltipster-shadow.css" />
	<link rel="stylesheet" type="text/css" href="css/themes/tooltipster-light.css" />
	<script type="text/javascript" src="https://code.jquery.com/jquery-1.11.0.js"></script>
	<script type="text/javascript" src="js/jquery.tooltipster.min.js"></script>
	<script type="text/javascript" src="js/interactor.js"></script>
	<script src="//fast.eager.io/KozO437RIl.js"></script>
	<script src="//cdn.jsdelivr.net/jquery.scrollto/2.1.0/jquery.scrollTo.min.js"></script>
	<script>
		function getTerm(){
			return <?php echo $term; ?>;
		}
	</script>
</head>
<body>
	<div id='topOfThePage'>
	</div>
</body>
</html>
