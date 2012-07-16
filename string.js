/* -*- Mode: Javascript; -*- */

/* ######################### fdjt/string.js ###################### */

/* Copyright (C) 2009-2012 beingmeta, inc.
   This file is a part of the FDJT web toolkit (www.fdjt.org)
   This file provides extended Javascript utility functions
   of various kinds.

   This program comes with absolutely NO WARRANTY, including implied
   warranties of merchantability or fitness for any particular
   purpose.

   Use, modification, and redistribution of this program is permitted
   under either the GNU General Public License (GPL) Version 2 (or
   any later version) or under the GNU Lesser General Public License
   (version 3 or later).

   These licenses may be found at www.gnu.org, particularly:
   http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
   http://www.gnu.org/licenses/lgpl-3.0-standalone.html

*/

var fdjtString=
    (function(){
	function fdjtString(string){
	    if ((typeof string !== 'string')&&
		(!(string instanceof String)))
		return stringify(string);
	    var output="";
	    var cmd=string.indexOf('%'); var i=1;
	    while (cmd>=0) {
		if (cmd>0) output=output+string.slice(0,cmd);
		if (string[cmd+1]==='%') output=output+'%';
		else if (string[cmd+1]==='o') {
		    var arg=arguments[i++];
		    if (typeof arg === 'string')
			output=output+"'"+arg+"'";
		    else if (typeof arg === 'number')
			output=output+arg;
		    else output=output+stringify(arg);}
		else if (string[cmd+1]==='j') {
		    var arg=arguments[i++];
		    output=output+JSON.stringify(arg);}
		else if ((string[cmd+1]==='x')&&
			 (typeof arguments[i] === 'number')&&
			 (arguments[i]>=0)&&
			 ((arguments[i]%1)>=0)) {
		    var arg=arguments[i++];
		    output=output+arg.toString(16);}
		else if (arguments[i])
		    output=output+arguments[i++];
		else if (typeof arguments[i] === 'undefined') {
		    output=output+'?undef?'; i++;}
		else output=output+arguments[i++];
		string=string.slice(cmd+2);
		cmd=string.indexOf('%');}
	    output=output+string;
	    return output;}

	fdjtString.revid="$Id$";
	fdjtString.version=parseInt("$Revision$".slice(10,-1));

	fdjtString.nbsp="\u00A0";
	fdjtString.middot="\u00B7";
	fdjtString.emdash="\u2013";
	fdjtString.endash="\u2014";
	fdjtString.lsq="\u2018";
	fdjtString.rsq="\u2019";
	fdjtString.ldq="\u201C";
	fdjtString.rdq="\u201D";

	function stringify(arg){
	    if (typeof arg === 'undefined') return '?undef?';
	    else if (!(arg)) return arg;
	    else if (arg.tagName) {
		var output="["+arg.tagName;
		if (arg.className)
		    output=output+"."+arg.className.replace(/\s+/g,'.');
		if (arg.id) output=output+"#"+arg.id;
		return output+"]";}
	    else if (arg.nodeType) {
		if (arg.nodeType===3)
		    return '["'+arg.nodeValue+'"]';
		else return '<'+arg.nodeType+'>';}
	    else if (arg.oid) return arg.oid;
	    else if (arg._fdjtid) return '#@'+arg._fdjtid;
	    else if ((arg.type)&&((arg.target)||arg.srcElement)) {
		var target=arg.target||arg.srcElement;
		var ox=arg.clientX, oy=arg.clientY;
		var result="["+arg.type+"@"+stringify(target)+"(m="+
		    (((arg.shiftKey===true)?"s":"")+
		     ((arg.ctrlKey===true)?"c":"")+
		     ((arg.altKey===true)?"a":"")+
		     (arg.button||0));
		if (ox||oy) result=result+",cx="+ox+",cy="+oy;
		else if (arg.touches) {
		    var i=0; var n=arg.touches.length;
		    result=result+",touches="+n;}
		else if ((arg.keyCode)||(arg.charCode))
		    result=result+",kc="+arg.keyCode+",cc="+arg.charCode;
		return result+")]";}
	    else return arg;}

	var spacechars=" \n\r\t\f\x0b\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u200b\u2028\u2029\u202f\u205f\u3000\uf3ff";

	fdjtString.truncate=function(string,lim){
	    if (!(lim)) lim=42;
	    if (string.length<lim) return string;
	    else return string.slice(0,lim);}

	var floor=Math.floor;

	function ellipsize(string,lim,fudge){
	    if (typeof fudge !== 'number') fudge=0.1;
	    if (!(lim)) return string;
	    else if (string.length<(lim+floor(fudge*lim)))
		return string;
	    else {
		var edge=string[lim];
		if (/\s/.test(edge)===0) 
		    return string.slice(0,lim);
		else {
		    var chopped=string.slice(0,lim);
		    var broke=chopped.search(/\s+\w+$/);
		    if (broke>0) return chopped.slice(0,broke);
		    else return chopped;}}}
	fdjtString.ellipsize=ellipsize;
		

	fdjtString.isEmpty=function(string){
	    if (typeof string === "string")  {
		var i=0; var lim=string.length;
		if (lim===0) return true;
		while (i<lim) {
		    if (spacechars.indexOf(string[i])>=0) i++;
		    else return false;}
		return true;}
	    else return false;}

	fdjtString.findSplit=function(string,split,escape){
	    var start=0;
	    var next;
	    while ((next=string.indexOf(split,start))>=0) 
		if ((escape) && (next>0) && (string[next-1]===escape))
		    start=next+1;
	    else return next;
	    return -1;};

	fdjtString.split=function(string,split,escape,mapfn){
	    if ((mapfn) || (escape)) {
		var results=[];
		var start=0; var next;
		while ((next=string.indexOf(split,start))>=0) 
		    if ((escape) && (next>0) && (string[next-1]===escape))
			start=next+1;
		else if ((mapfn) && (next>start)) {
		    results.push(mapfn(string.slice(start,next))); start=next+1;}
		else if (next>start) {
		    results.push(string.slice(start,next)); start=next+1;}
		else start=next+1;
		if (string.length>start)
		    if (mapfn) results.push(mapfn(string.slice(start)));
		else results.push(string.slice(start));
		return results;}
	    else return string.split(split);};

	fdjtString.semiSplit=function(string,escape,mapfn){
	    if ((mapfn) || (escape)) {
		var results=[];
		var start=0; var next;
		while ((next=string.indexOf(';',start))>=0) 
		    if ((escape) && (next>0) && (string[next-1]===escape))
			start=next+1;
		else if ((mapfn) && (next>start)) {
		    results.push(mapfn(string.slice(start,next))); start=next+1;}
		else if (next>start) {
		    results.push(string.slice(start,next)); start=next+1;}
		else start=next+1;
		if (string.length>start)
		    if (mapfn) results.push(mapfn(string.slice(start)));
		else results.push(string.slice(start));
		return results;}
	    else return string.split(';');};

	fdjtString.lineSplit=function(string,escapes,mapfn){
	    if ((mapfn) || (escape)) {
		var results=[];
		var start=0; var next;
		while ((next=string.indexOf('\n',start))>=0) 
		    if ((escape) && (next>0) && (string[next-1]===escape))
			start=next+1;
		else if ((mapfn) && (next>start)) {
		    results.push(mapfn(string.slice(start,next))); start=next+1;}
		else if (next>start) {
		    results.push(string.slice(start,next)); start=next+1;}
		else start=next+1;
		if (string.length>start)
		    if (mapfn) results.push(mapfn(string.slice(start)));
		else results.push(string.slice(start));
		return results;}
	    else return string.split('\n');};

	var spacechars=" \n\r\t\f\x0b\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u200b\u2028\u2029\u202f\u205f\u3000\uf3ff";
	
	function trim(string){
	    var start=0; var len=string.length; 
	    if (len<=0) return string;
	    while ((start<len)&&
		   (spacechars.indexOf(string.charAt(start))>-1))
		start++;
	    if (start===len) return "";
	    var end=len-1;
	    while ((end>start)&&(spacechars.indexOf(string.charAt(end))>-1))
		end--;
	    if ((start>0)||(end<len)) return string.slice(start,end+1);
	    else return string;}
	fdjtString.trim=trim;

	function stdspace(string){
	    var spacechars=" \n\r\t\f\x0b\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u200b\u2028\u2029\u202f\u205f\u3000\uf3ff";
	    string=string.replace(/\s+/g," ");
	    var start=0; var len=string.length; 
	    if (len<=0) return string;
	    while ((start<len)&&
		   (spacechars.indexOf(string.charAt(start))>-1))
		start++;
	    if (start===len) return "";
	    var end=len-1;
	    while ((end>start)&&(spacechars.indexOf(string.charAt(end))>-1))
		end--;
	    if ((start>0)||(end<len)) return string.slice(start,end+1);
	    else return string;}
	fdjtString.stdspace=stdspace;

	function flatten(string){
	    return string.replace(/\s+/g," ");}
	fdjtString.flatten=flatten;

	function oneline(string){
	    string=trim(string);
	    var flat=string.replace(/\s*[\f\n\r]+\s+/gm," //\u00B7 ").
		replace(/\s*[\f\n\r]+\s*/gm," // ");
	    var tight=flat.replace(/\s\s+/g,"");
	    return tight;}
	fdjtString.oneline=oneline;

	function stripMarkup(string){
	    return string.replace(/<[^>]*>/g,"");}
	fdjtString.stripMarkup=stripMarkup;

	function unEscape(string){
	    if (string.indexOf('\\')>=0)
		return string.replace(/\\(.)/g,"$1");
	    else return string;}
	fdjtString.unEscape=unEscape;

	function normstring(string){
	    return string.replace(/\W*\s\W*/g," ").toLowerCase();}
	fdjtString.normString=normstring;

	function unEntify(string) {
	    return string.replace(/&#(\d+);/g,
				  function(whole,paren) {
				      return String.fromCharCode(+paren);});}
	fdjtString.unEntify=unEntify;

	function padNum(num,digits,prec){
	    var ndigits=
		((num<10)?(1):(num<100)?(2):(num<1000)?(3):(num<10000)?(4):
		 (num<100000)?(5):(num<1000000)?(6):(num<1000000)?(7):
		 (num<100000000)?(8):(num<1000000000)?(9):(num<10000000000)?(10):(11));
	    var nzeroes=digits-ndigits; var numstring=num.toString();
	    var prefix=""; var suffix="";
	    if (prec) {
		var point=numstring.indexOf('.');
		if ((point>=0)&&((point+prec)<numstring.length))
		    numstring=numstring.slice(0,point+prec+1);
		else if ((point<0)||(numstring.length<(point+prec+1))) {
		    var j=0; var pad=(point+prec+1)-numstring.length;
		    while (j<pad) {suffix=suffix+"0"; j++;}}}
	    switch (nzeroes) {
	    case 0: prefix=""; break;
	    case 1: prefix="0"; break;
	    case 2: prefix="00"; break;
	    case 3: prefix="000"; break;
	    case 4: prefix="0000"; break;
	    case 5: prefix="00000"; break;
	    case 6: prefix="000000"; break;
	    case 7: prefix="0000000"; break;
	    case 8: prefix="00000000"; break;
	    case 9: prefix="000000000"; break;
	    case 10: prefix="0000000000"; break;
	    default: {
		var j=0; while (j<nzeroes) {prefix=prefix+"0"; j++;}}}
	    return prefix+numstring+suffix;}
	fdjtString.padNum=padNum;

	function precString(num,prec){
	    var numstring=num.toString();
	    var suffix="";
	    if (prec) {
		var point=numstring.indexOf('.');
		if ((point>=0)&&((point+prec)<numstring.length))
		    numstring=numstring.slice(0,point+prec+1);
		else if ((point<0)||(numstring.length<(point+prec+1))) {
		    var j=0; var pad=(point+prec+1)-numstring.length;
		    while (j<pad) {suffix=suffix+"0"; j++;}}}
	    return numstring+suffix;}
	fdjtString.precString=precString;

	/* Getting initials */

	function getInitials(string){
	    var words=string.split(/\W/); var initials="";
	    var i=0; var lim=words.length;
	    while (i<lim) {
		var word=words[i++];
		if (word.length)
		    initials=initials+word.slice(0,1);}
	    return initials;}
	fdjtString.getInitials=getInitials;

	/* More string functions */

	function hasPrefix(string,prefix){
	    return ((string.indexOf(prefix))===0);}
	fdjtString.hasPrefix=hasPrefix;

	function hasSuffix(string,suffix){
	    return ((string.lastIndexOf(suffix))===(string.length-suffix.length));}
	fdjtString.hasSuffix=hasSuffix;

	function commonPrefix(string1,string2,brk,foldcase){
	    var i=0; var last=0;
	    while ((i<string1.length) && (i<string2.length))
		if ((string1[i]===string2[i])||
		    ((foldcase)&&(string1[i].toLowerCase()===string2[i].toLowerCase())))
		    if (brk)
			if (brk===string1[i]) {last=i-1; i++;}
	    else i++;
	    else last=i++;
	    else break;
	    if (last>0) return string1.slice(0,last+1);
	    else return false;}
	fdjtString.commonPrefix=commonPrefix;

	function commonSuffix(string1,string2,brk,foldcase){
	    var i=string1.length, j=string2.length; var last=0;
	    while ((i>=0) && (j>=0))
		if ((string1[i]===string2[j])||
		    ((foldcase)&&(string1[i].toLowerCase()===string2[i].toLowerCase())))
		    if (brk)
			if (brk===string1[i]) {last=i+1; i--; j--;}
	    else {i--; j--;}
	    else {last=i; i--; j--;}
	    else break;
	    if (last>0) return string1.slice(last);
	    else return false;}
	fdjtString.commonSuffix=commonSuffix;

	function stripSuffix(string){
	    var start=string.search(/\.\w+$/);
	    if (start>0) return string.slice(0,start);
	    else return string;}
	fdjtString.stripSuffix=stripSuffix;

	function arrayContains(array,element){
	    if (array.indexOf)
		return (array.indexOf(element)>=0);
	    else {
		var i=0; var len=array.length;
		while (i<len)
		    if (array[i]===element) return true;
		else i++;
		return false;}}

	function prefixAdd(ptree,string,i) {
	    var strings=ptree.strings;
	    if (i===string.length) 
		if ((strings.indexOf) ?
		    (strings.indexOf(string)>=0) :
		    (arrayContains(strings,string)))
		    return false;
	    else {
		strings.push(string);
		return true;}
	    else if (ptree.splits) {
		var splitchar=string[i];
		var split=ptree[splitchar];
		if (!(split)) {
		    // Create a new split
		    split={};
		    split.strings=[];
		    // We don't really use this, but it might be handy for debugging
		    split.splitchar=splitchar;
		    ptree[splitchar]=split;
		    ptree.splits.push(split);}
		if (prefixAdd(split,string,i+1)) {
		    strings.push(string);
		    return true;}
		else return false;}
	    else if (ptree.strings.length<5)
		if ((strings.indexOf) ?
		    (strings.indexOf(string)>=0) :
		    (arrayContains(strings,string)))
		    return false;
	    else {
		strings.push(string);
		return true;}
	    else {
		// Subdivide
		ptree.splits=[];
		var strings=ptree.strings;
		var j=0; while (j<strings.length) prefixAdd(ptree,strings[j++],i);
		return prefixAdd(ptree,string,i);}}
	fdjtString.prefixAdd=prefixAdd;

	function prefixFind(ptree,prefix,i,plen){
	    if (!(plen)) plen=prefix.length;
	    if (i===plen)
		return ptree.strings;
	    else if (ptree.strings.length<=5) {
		var strings=ptree.strings;
		var results=[];
		var j=0; while (j<strings.length) {
		    var string=strings[j++];
		    if (hasPrefix(string,prefix)) results.push(string);}
		if (results.length) return results;
		else return false;}
	    else {
		var split=ptree[prefix[i]];
		if (split) return prefixFind(split,prefix,i+1,plen);
		else return false;}}
	fdjtString.prefixFind=prefixFind;

	function paraHash(node){
	    var text=node.innerText;
	    var words=text.split(/\W*\S+\W*/g);
	    var len=words.length;
	    return "_H"+
		((len>0)?(words[0][0]):".")+
		((len>1)?(words[1][0]):".")+
		((len>2)?(words[2][0]):".")+
		((len>3)?(words[3][0]):".")+
		((len>0)?(words[len-1][0]):".")+
		((len>1)?(words[len-2][0]):".")+
		((len>2)?(words[len-3][0]):".")+
		((len>3)?(words[len-4][0]):".");}
	fdjtString.paraHash=paraHash;

	return fdjtString;})();

/* Emacs local variables
   ;;;  Local variables: ***
   ;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
   ;;;  End: ***
*/
