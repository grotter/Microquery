<?php

$includePath = '/Library/Webserver/Documents/include/php/';
require_once($includePath . 'DatabaseUtil.php');
require_once($includePath . 'StringUtil.php');
require_once($includePath . 'phpmailer/class.phpmailer.php');

class Microquery {
	private $db;
	private $programmer_email = 'grotter@calacademy.org';
	private $debug = false;
	private $translate = 'm/d/y g:i A';
	private $table = 'bigbang';
	
	public function __construct () {
		$db = new DatabaseUtil('microquery');
		$this->db = $db->getConnection();
		if (!$this->db) $this->_error();
	}
	
	public function setTable ($str) {
		$this->table = $str;
	}
	
	private function getDBResource ($query) {
		$resource = mysql_query($query, $this->db);
		
		if (!$resource) {
			//db error
			if ($this->debug) {
				//display debugging info
				die($query . '<br>' . mysql_error());
			} else {
				//collect debugging info for programmer email
				ob_start();
				echo $query . "\n\n";
				echo mysql_error() . "\n\n";
				print_r($_REQUEST);
				print_r($_SERVER);
				$str = ob_get_contents();
				ob_end_clean();
				
				//send programmer email
				$mail = new PHPMailer();
				$mail->From = 'www@calacademy.org';
				$mail->FromName = 'California Academy of Sciences';
				$mail->Subject = 'Database Error';
				$mail->AddAddress($this->programmer_email);
				$mail->Body = $str;
				$mail->Send();
				
				//display a generic message to the user
				$this->_error();
			}
		} else {
			return $resource;
		}
	}
	
	private function _error () {
		die($this->_getJSON(array('dberror' => '1')));
	}
	
	private function _getJSON ($data) {
		header('Cache-Control: no-cache, must-revalidate');
		header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');
		header('Content-type: application/json');
		
		// prepend callback function if it looks like a JSONP request
		$callback = '';
		
		if (isset($_REQUEST['callback'])
			&& !empty($_REQUEST['callback'])) {
				$callback = $_REQUEST['callback'];
		}
		
		if (isset($_REQUEST['jsoncallback'])
			&& !empty($_REQUEST['jsoncallback'])) {
				$callback = $_REQUEST['jsoncallback'];
		}
		
		// do the encoding			
		$data = json_encode($data);
		
		if (empty($callback)) {
			return $data;
		}
		
		return $callback . '(' . $data . ');';
	}
	
	public function getSubmitResult () {
		$formData = StringUtil::getCleanArray($_REQUEST);
		$success = false;
		
		if (!empty($formData['question'])) {
			$now = time();
			$nowTranslated = date($this->translate, $now);
			
			$query = "INSERT INTO {$this->table}
						(
							submitter,
							question,
							time_submit,
							time_submit_translate
						)
						VALUES
						(
							'{$formData['submitter']}',
							'{$formData['question']}',
							$now,
							'$nowTranslated'
						)";
			
			$resource = $this->getDBResource($query);			
			$success = true;
		}
		
		return $this->_getJSON(array('success' => $success));
	}
	
	public function updateStatus () {
		$uid_question = intval($_REQUEST['uid_question']);
		$accepted = intval($_REQUEST['accepted']);
		
		if (empty($uid_question)) return;
		
		if ($accepted === 1) {
			$query = "UPDATE {$this->table} SET accepted = 1, rejected = 0 WHERE uid_question = $uid_question";
		} else {
			$query = "UPDATE {$this->table} SET accepted = 0, rejected = 1 WHERE uid_question = $uid_question";
		}
		
		$resource = $this->getDBResource($query);
		
		return $this->_getJSON(array(
        	'updated' => '1'
        ));
	}
	
	public function truncate () {
		$query = "TRUNCATE {$this->table}";
		$resource = $this->getDBResource($query);
		die('Questions successfully truncated&hellip;');
	}
	
	public function getQuestions () {
		// get good ones
		$where = '';
		
		if (isset($_REQUEST['moderated'])
			&& !empty($_REQUEST['moderated'])) {
			$where = 'WHERE accepted = 1 AND rejected = 0';
		}
			
		$arr = array();
		
		$query = "SELECT
						*
				    FROM
						{$this->table}
					$where
					ORDER BY
						time_submit
					DESC LIMIT 30";
					
		$resource = $this->getDBResource($query);
		
		while ($row = mysql_fetch_assoc($resource)) {
			$row['time_submit'] = date('g:i A', $row['time_submit']);
			$row['submitter'] = htmlentities($row['submitter']);
			$row['question'] = nl2br(htmlentities($row['question']));
			
			$arr[] = $row;
		}
		
		// get the rejects
		$rejects = array();
		$query = "SELECT uid_question FROM {$this->table} WHERE rejected = 1 ORDER BY time_submit DESC LIMIT 75";
		$resource = $this->getDBResource($query);
		
		while ($row = mysql_fetch_assoc($resource)) {
			$rejects[] = $row['uid_question'];
		}
		
        return $this->_getJSON(array(
        	'questions' => $arr,
			'rejects' => $rejects
        ));
	}
	
	public function translateTimes () {
		$query = "SELECT * FROM {$this->table}";
		$resource = $this->getDBResource($query);
		
		while ($row = mysql_fetch_assoc($resource)) {
			$translated = date($this->translate, $row['time_submit']);
			$update = "UPDATE {$this->table} SET time_submit_translate = '$translated' WHERE uid_question = {$row['uid_question']}";
			$resource2 = $this->getDBResource($update);
		}
		
		die('translated!');
	}
}

?>
