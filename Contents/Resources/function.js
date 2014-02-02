/**
 * Copyright 2007,2008 いまり All rights reserved.
 * 
 * This file is part of nagareruCast.
 * 
 * nagareruCast is free software; you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation; either version 3 of the License, or (at your option) any later
 * version.
 * 
 * nagareruCast is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU General Public License for more
 * details.
 * 
 * You should have received a copy of the GNU General Public License along with
 * this program. If not, see <http://www.gnu.org/licenses/>.
 */

var resSize = toracast.width / 10;
var maxLine = 4;

function start() {

	init();
	tickTimer.ticking = true;
}

var resno;
var ngWord;
var favWord;
var resSpeed = 5;
function init() {

	print("preferences.res_speed.value:" + preferences.res_speed.value);
	resSpeed = preferences.res_speed.value;

	resno = 0;

	suppressUpdates();
	message.visible = false;

	//Posted by ﾊｧ    2008年01月06日 20:15
	reqTimer.interval = 10;
	/* 10秒未満無視 */
	if (preferences.reqInterval.value != null
			&& 10 <= eval(preferences.reqInterval.value)) {
		reqTimer.interval = eval(preferences.reqInterval.value);
	}

	reqTimer.ticking = true;

	toracast.width = eval(preferences.width.value);
	toracast.height = eval(preferences.height.value);

	rArrow.hOffset = toracast.width - 12;
	rArrow.vOffset = toracast.height - 4;
	rArrow.visible = false;

	lArrow.hOffset = 0;
	lArrow.vOffset = toracast.height - 4;
	lArrow.visible = false;

	title.data = preferences.title.value;
	title.size = eval(preferences.title_fontsize.value);
	title.vOffset = title.height;
	title.color = preferences.title_color.value;
	title.bgColor = preferences.title_bgcolor.value;

	resnop.data = "1000";
	resnop.size = title.size;
	resnop.hOffset = toracast.width;
	resnop.vOffset = toracast.height - 2;
	resnop.data = "0";

	if (preferences.ngword.value != null && 0 < preferences.ngword.value.length) {
		ngWord = preferences.ngword.value.split(",");
	}
	print("NG WORD:" + ngWord);

	if (preferences.regexp.value != null && 0 < preferences.regexp.value.length) {
		favWord = preferences.regexp.value.split(",");
	}
	print("FAVORITE WORD:" + favWord);

	resSize = eval(preferences.res_size.value);
	maxLine = eval(preferences.res_lane.value);

	selif.visible = false;

	request();
	resumeUpdates();
}

var stack = new Array();

var req = new XMLHttpRequest();
/* 重いですねー */
function request() {

	if (resnop.data == "1000") {
		reqTimer.ticking = false;
		alert("新スレの季節です");
	}

	/**/
	if (stack.length > 15) {
		return;
	}

	print("request");

	// I want to use thread!
	req.open("GET", preferences.threadUrl.value + preferences.resno.value
			+ "n-", false);

	req.send();

	/* all */
	var rows = req.responseText.split("\n");
	var tmprow = new Array();
	for (i = 0;i < rows.length; i++) {
		if (rows[i].match(regexp)) {
			tmprow.push(rows[i]);
		}

		if (rows[i].match("^</dl><br clear=\"all\">$")) {
			break;
		}
	}

	/**/
	while (res.length < tmprow.length) {
		var row = tmprow[res.length];

		var mes = baras(row);
		var mail = getMailAddress(row);
		var mess = new Message(res.length + 1, mes, mail);

		res.push(mess);
		stack.push(mess);

	}
}

/**
 * 行分解メソッド したらばのレス一行を対象としています。
 */
function baras(row) {
	if (null == row) {
		return;
	}

	var top = row.indexOf("<dd>");
	// var buttom = row.indexOf("<br><br>");
	var buttom = row.lastIndexOf("<br><br>");

	var tmp = row.substring(top + 4, buttom);
	// tmp=tmp.trim();

	// var brIndex=tmp.indexOf("<br>");
	// if (0 <= brIndex) {
	// tmp = tmp.substring(0, brIndex);
	// }

	/* BRの保存 */
	// print(tmp);
	while (0 <= tmp.indexOf("<br>")) {
		tmp = tmp.replace("<br>", "\n");
	}
	/* 行頭の半角空白の除去 */
	if (tmp.indexOf(" ") == 0) {
		tmp = tmp.substring(1, tmp.length);
	}

	/* disinfection */
	var rorow = tmp;
	var result = "";
	while (0 <= tmp.indexOf("<")) {
		result += tmp.substring(0, tmp.indexOf("<"));
		tmp = tmp.substring(tmp.indexOf(">") + 1, tmp.length);
	}
	result += tmp;
	if (result == "") {
		result = rorow;
	}

	// entity
	while (0 <= result.indexOf("&gt;")) {
		result = result.replace("&gt;", ">");
	}
	while (0 <= result.indexOf("&lt;")) {
		result = result.replace("&lt;", "<");
	}

	/* NG */
	if (ngWord != null && 0 < ngWord.length) {
		for (i = 0;i < ngWord.length; i++) {
			if (ngWord[i] == null || ngWord[i].length < 1) {
				continue;
			}
			if (-1 < result.indexOf(ngWord[i])) {
				/* NGなので空にする。 */
				return null;
			}
		}
	}

	/* 足切り */
	var maxLength = 80;
	if (preferences.res_maxlength.value != null) {
		maxLength = eval(preferences.res_maxlength.value);
	}

	if (maxLength < result.length) {
		result = result.substring(0, maxLength);
	}

	return (result);
}

function pop() {

	if (0 == stack.length) {
		return;
	} else {

		var tp = stack.shift();
		if (preferences.res_age.value == 1 && tp.mail != "sage") {
			var tpe = createText(tp);
			tpe.visible = false;
			suplis.push(tpe);
			return;
		} else {
			/* sage */
			stack.unshift(tp);
		}

		var addFlg = true;
		for (i = 0;i < lane.length; i++) {
			var o = lane[i];
			if (o == null) {
				continue;
			} else {
				if ((o.hOffset + o.width < toracast.width)) {
					var mes = stack.shift();
					print("res:" + mes.no);
					var text = createText(mes);

					lane[i] = text;
					i++;

					text.vOffset = calcVOffset(i);
					text.hOffset = toracast.width;

					allText.push(text);
					resnop.data = mes.no;
					addFlg = false;

					break;
				}
			}
		}

		/* 行追加 */
		if (addFlg == true && lane.length < maxLine) {
			var mes = stack.shift();
			var text = createText(mes);
			i++;

			text.vOffset = calcVOffset(i);
			text.hOffset = toracast.width;

			allText.push(text);
			resnop.data = mes.no;

			lane.push(text);
		}
	}
}

var regexp = new RegExp("^<dt>.*<br><br>$");

var res = new Array();

function Message(pno, pmes, pmail) {

	if (pno != null) {
		this.no = eval(pno) + eval(preferences.resno.value) - 1;
	}

	this.message = pmes;
	this.mail = pmail;

}

var stopFlg = false;
function stopper() {
	if (stopFlg == false) {
		// popTimer.ticking=false;
		resnop.bgColor = "#99CCFF";
		resnop.bgOpacity = "150";
		stopFlg = true;
	} else {
		// popTimer.ticking=true;
		resnop.bgColor = "#000000";
		resnop.bgOpacity = "1";
		stopFlg = false;
		pop();
	}

}

function getMailAddress(row) {
	var mailSign = "<a href=\"mailto:";
	var top = row.indexOf(mailSign);
	if (top < 0) {
		// print("no mail address.");
		return null;
	}
	// print("mailSign="+mailSign);
	// print(mailSign.length);
	var tmp = row.substring(top + mailSign.length);
	var buttom = tmp.indexOf("\">");
	var mail = tmp.substring(0, buttom);
	// print(mail);
	return mail;
}

var tickCount = 0;
var allText = new Array();

/**/
var lane = new Array();

var selifCount = 0;
function tick() {
	tickCount++;

	selifCount++;

	suppressUpdates();

	/* レス密度 */
	if (20 < tickCount) {
		tickCount = 0;

		pop();
	}

	moveAll(allText);

	/* 密度 */
	if (80 < selifCount) {
		selifCount = 0;
		supli();
	}

	resumeUpdates();
}

function moveAll(pArray) {
	if (stopFlg == true) {
		return;
	}

	for (i = 0;i < pArray.length; i++) {
		t = pArray[i];

		var halfLength = 40;
		if (preferences.res_maxlength.value != null) {
			halfLength = eval(preferences.res_maxlength.value) / 2;
		}

		if ((t.data.length <= halfLength) || (maxLine == 1/* 1行のときは追い越さない */)) {
			if (resSpeed == 0) {
				t.hOffset -= 10;
			} else if (resSpeed == 1) {
				t.hOffset -= 8;// x1
			} else if (resSpeed == 2) {
				t.hOffset -= 5;
			} else if (resSpeed == 3) {
				t.hOffset -= 3;
			} else {
				t.hOffset -= 2;
			}
		} else {
			if (resSpeed == 0) {
				t.hOffset -= 13;
			} else if (resSpeed == 1) {
				t.hOffset -= 10;// x1
			} else if (resSpeed == 2) {
				t.hOffset -= 7;
			} else if (resSpeed == 3) {
				t.hOffset -= 5;
			} else {
				t.hOffset -= 4;
			}

		}

		if (t.hOffset + t.width < 1) {
			t.removeFromSuperview();
			pArray[i] = null;
		}
	}

	for (i = 0;i < pArray.length;) {
		if (pArray[i] == null) {
			pArray.splice(i, 1);
			continue;
		} else {
			i++;
		}
	}
}

function createText(mes) {
	if (mes.message == null) {
		mes.message = "";
	}
	var text = new Text();

	text.size = resSize;

	// print("preferences.res_font.value:" + preferences.res_font.value);
	if (preferences.res_font.value != null) {
		text.font = preferences.res_font.value;
	}

	// text.color = "#FFFFFF";

	text.opacity = 255;
	text.data = mes.message;
	text.style = "bold";
	text.visible = true;
	text.hAlign = "left";

	/* 複数行表示設定 */
	if (preferences.res_multiline.value == true) {
		text.wrap = true;
	} else {
		text.wrap = false;
	}

	var sas = new Shadow();
	sas.color = "#000000";
	sas.opacity = "255";
	// sas.vOffset = 2;
	// sas.hOffset = 2;
	sas.vOffset = 1;
	sas.hOffset = 1;

	sas.color = preferences.res_shadow_color.value;
	text.shadow = sas;
	text.color = preferences.res_color.value;

	print(text.data);

	if (preferences.regexp.value != null && 0 < preferences.regexp.value.length) {

	    /*regexp token*/
	    for(var i=0;i<favWord.length;i++){
		var favtoken=favWord[i];
		if (mes.message.indexOf(favtoken) > -1) {
			text.color = preferences.re_color.value;
			text.font = preferences.re_font.value;
			text.size = preferences.re_size.value;
			if (preferences.re_sound.value == true) {
				if (filesystem.itemExists(preferences.re_sound_file.value)) {
				    try{
					play(preferences.re_sound_file.value, true);
				    }catch(e){
					print(e);
				    }
				}
			}
			break;
		}
	    }
	}
	toracast.appendChild(text);
	return text;
}

function Move(ptext, pdirection, pspeed) {

	this.text = ptext;
	this.direction = pdirection;
	this.speed = pspeed;
}

function calcVOffset(plane) {
	// 18+6 + i*26 + i*8
	// return title.size + title.size / 2 + (plane * resSize) + (plane * 8);
	return title.height + ((plane - 1) * resSize * 1.6) + (plane * 10);
}

var suplis = new Array();// List<Text>
function supli() {
	if (suplis.length < 1) {
		selif.visible = false;
		return;
	}

	var sup = suplis.shift();

	// supressUpdates();

	selif.data = sup.data;
	selif.size = resSize;

	selif.color = preferences.res_color.value;
	selif.shadow.color = preferences.res_shadow_color.value;

	if (preferences.regexp.value != null && 0 < preferences.regexp.value.length) {
		if (selif.data.indexOf(preferences.regexp.value) > -1) {
			selif.color = preferences.re_color.value;
		}
	}
	print("selif.data:" + selif.data);

	while (toracast.width < selif.width) {
		if (selif.size < 8) {
			selif.size = 8;
			break;
		} else {
			selif.size -= 2;
		}
	}
	selif.vOffset = toracast.height - 8;
	selif.hOffset = (toracast.width - selif.width) / 2;

	sup.removeFromSuperview();

	if (preferences.res_age_font.value != null) {
	    selif.font = preferences.res_age_font.value;
	}else{
	    selif.font = preferences.res_font.value;
	}

	selif.visible = true;
	// resumeUpdates();
}
