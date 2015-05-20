<?php

require_once('Microquery.php');
$foo = new Microquery();

if (isset($_REQUEST['table']) && !empty($_REQUEST['table'])) {
	$foo->setTable($_REQUEST['table']);
}

switch ($_REQUEST['action']) {
	case 'update-status':
		echo $foo->updateStatus();
		break;
	case 'truncate':
		$foo->truncate();
		break;
	case 'submit-question':
		echo $foo->getSubmitResult();
		break;
	case 'get-questions':
		echo $foo->getQuestions();
		break;
	case 'translate':
		$foo->translateTimes();
		break; 
}

?>
