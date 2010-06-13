/* -*- Mode: Javascript; -*- */

/* Copyright (C) 2009-2010 beingmeta, inc.
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
	else if (arguments[i])
	  output=output+arguments[i++];
	else if (typeof arguments[i] === 'undefined') {
	  output=output+'?undef?'; i++;}
	else output=output+arguments[i++];
	string=string.slice(cmd+2);
	cmd=string.indexOf('%');}
      output=output+string;
      return output;
    }

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
	var output="<"+arg.tagName;
	if (arg.className)
	  output=output+"."+arg.className.replace(/\s+/g,'.');
	if (arg.id) output=output+"#"+arg.id;
	return output+">";}
      else if (arg.nodeType)
	if (arg.nodeType===3)
	  return '<"'+arg.nodeValue+'">';
	else return '<'+arg.nodeType+'>';
      else if (arg.oid) return arg.oid;
      else if (arg._fdjtid) return '#@'+arg._fdjtid;
      else if ((arg.type)&&(arg.target)) 
	return "["+arg.type+"@"+stringify(arg.target)+"]";
      else return arg;};

    fdjtString.isEmpty=function(string){
      if (typeof string === "string") 
	if (string.length===0) return true;
	else if (string.search(/\S/g)>=0)
	  return false;
	else return true;
      else return false;};

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

    function string_trim(string){
      var start=string.search(/\S/); var end=string.search(/\s+$/g);
      if ((start===0) && (end<0)) return string;
      else return string.slice(start,end);}
    fdjtString.trim=string_trim;

    function stdspace(string){
      return string.replace(/\s+/," ").replace(/(^\s)|(\s$)/,"");}
    fdjtString.stdspace=stdspace;

    function flatten(string){
      return string.replace(/\s+/," ");}
    fdjtString.flatten=flatten;

    function stripMarkup(string){
      return string.replace(/<[^>]*>/g,"");}
    fdjtString.stripMarkup=stripMarkup;

    function unEscape(string){
      if (string.indexOf('\\')>=0)
	return string.replace(/\\(.)/g,"$1");
      else return string;}
    fdjtString.unEscape=unEscape;

    function unEntify(string) {
      return string.replace(/&#(\d+);/g,
			    function(whole,paren) {
			      return String.fromCharCode(+paren);});}
    fdjtString.unEntify=unEntify;

    function padNum(num,digits){
      var ndigits=
	((num<10)?(1):(num<100)?(2):(num<1000)?(3):(num<10000)?(4):
	 (num<100000)?(5):(num<1000000)?(6):(num<1000000)?(7):
	 (num<100000000)?(8):(num<1000000000)?(9):(num<10000000000)?(10):(11));
      var nzeroes=digits-ndigits;
      switch (nzeroes) {
      case 0: return ""+num;
      case 1: return "0"+num;
      case 2: return "00"+num;
      case 3: return "000"+num;
      case 4: return "0000"+num;
      case 5: return "00000"+num;
      case 6: return "000000"+num;
      case 7: return "0000000"+num;
      case 8: return "00000000"+num;
      case 9: return "000000000"+num;
      case 10: return "0000000000"+num;
      default: return ""+num;}}
    fdjtString.padNum=padNum;

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

    return fdjtString;})();

/* Emacs local variables
;;;  Local variables: ***
;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
;;;  End: ***
*/
