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

var fdjtState=
  (function(){

    function fdjtState(name,val,persist){
      if (arguments.length===1)
	return ((window.sessionStorage)&&(getSession(name)))||
	  ((window.sessionStorage)&&(getLocal(name)))||
	  getCookie(name);
      else if (persist)
	if (window.localStorage)
	  if (val) setLocal(name,val);
	  else dropLocal(name);
	else {
	  var domain=fdjtState.domain||location.hostname;
	  var path=fdjtState.path||"/";
	  var duration=fdjtState.duration||(3600*24*365*7);
	  if (val) setCookie(name,val,duration,path,domain);
	  else clearCookie(name,path,domain);}
      else if (val)
	if (window.sessionStorage) setSession(name,val);
	else setCookie(name,val);
      else if (window.sessionStorage) dropSession(name);
      else clearCookie(name);};
    fdjtState.domain=false;
    fdjtState.path=false;
    fdjtState.duration=false;

    /* Old-school cookies */

    function getCookie(name,parse){
      try {
	var cookies=document.cookie;
	var namepat=new RegExp("(^|(; ))"+name+"=");
	var pos=cookies.search(namepat);
	var valuestring;
	if (pos>=0) {
	  var start=cookies.indexOf('=',pos)+1;
	  var end=cookies.indexOf(';',start);
	  if (end>0) valuestring=cookies.slice(start,end);
	  else valuestring=cookies.slice(start);}
	else return false;
	if (parse)
	  return JSON.parse(decodeURIComponent(valuestring));
	else return decodeURIComponent(valuestring);}
      catch (ex) {
	return false;}}
    fdjtState.getCookie=getCookie;

    function setCookie(name,value,expires,path,domain){
      try {
	if (value) {
	  var valuestring=
	    ((typeof value === 'string') ? (value) :
	     (value.toJSON) ? (value.toJSON()) :
	     (value.toString) ? (value.toString()) : (value));
	  var cookietext=name+"="+encodeURIComponent(valuestring);
	  if (expires)
	    if (typeof(expires)==='string')
	      cookietext=cookietext+'; '+expires;
	    else if (expires.toGMTString)
	      cookietext=cookietext+"; expires="+expires.toGMTString();
	    else if (typeof(expires)==='number')
	      if (expires>0) {
		var now=new Date();
		now.setTime(now.getTime()+expires);
		cookietext=cookietext+"; expires="+now.toGMTString;}
	      else cookietext=cookietext+"; expires=Sun 1 Jan 2000 00:00:00 UTC";
	    else {}
	  if (path) cookietext=cookietext+"; path="+path;
	  // This certainly doesn't work generally and might not work ever
	  if (domain) cookietext=cookietext+"; domain="+domain;
	  // fdjtTrace("Setting cookie %o cookietext=%o",name,cookietext);
	  document.cookie=cookietext;}
	else fdjtClearCookie(name,path,domain);}
      catch (ex) {
	fdjtWarn("Error setting cookie %s",name);}}
    fdjtState.setCookie=setCookie;

    function clearCookie(name,path,domain){
      try {
	var valuestring="ignoreme";
	var cookietext=name+"="+encodeURIComponent(valuestring)+
	  "; expires=Sun 1 Jan 2000 00:00:00 UTC";
	if (path) cookietext=cookietext+"; path="+path;
	// This certainly doesn't work generally and might not work ever
	if (domain) cookietext=cookietext+"; domain="+domain;
	// fdjtTrace("Clearing cookie %o: text=%o",name,cookietext);
	document.cookie=cookietext;}
      catch (ex) {
	fdjtWarn("Error clearing cookie %s",name);}}
    fdjtState.clearCookie=clearCookie;

    /* Session storage */

    function setSession(name,val){
      if (window.sessionStorage)
	window.sessionStorage[name]=val;
      else fdjtSetCookie(name,val);}
    fdjtState.setSession=setSession;

    function getSession(name){
      if (window.sessionStorage)
	return window.sessionStorage[name];
      else fdjtGetCookie(name);}
    fdjtState.getSession=getSession;

    function dropSession(name){
      if (window.sessionStorage)
	return window.sessionStorage.removeItem(name);
      else fdjtClearCookie(name);}
    fdjtState.dropSession=dropSession;

    /* Local storage (persists between sessions) */

    function setLocal(name,val){
      if (window.localStorage)
	window.localStorage[name]=val;}
    fdjtState.setLocal=setLocal;

    function getLocal(name){
      if (window.localStorage)
	return window.localStorage[name];
      else return false;}
    fdjtState.getLocal=getLocal;

    function dropLocal(name){
      if (window.localStorage)
	return window.localStorage.removeItem(name);
      else return false;}
    fdjtState.dropLocal=dropLocal;
    
    /* Gets arguments from the query string */
    function getQuery(name,multiple,matchcase){
      if (!(location.search))
	if (multiple) return [];
	else return false;
      var results=[];
      var namepat=new RegExp("(&|^|\\?)"+name+"(=|&|$)",((matchcase)?"g":"gi"));
      var query=location.search;
      var start=query.search(namepat);
      while (start>=0) {
	// Skip over separator if non-initial
	if ((query[start]==='?')||(query[start]==='&')) start++;
	// Skip over the name
	var valstart=start+name.length; var end=false;
	if (query[valstart]==="=") {
	  var valstring=query.slice(valstart+1);
	  end=valstring.search(/(&|$)/g);
	  if (end<=0)
	    if (multiple) {
	      results.push(query.slice(start,valstart));
	      return results;}
	    else return query.slice(start,valstart);
	  else if (multiple)
	    results.push(valstring.slice(0,end));
	  else return valstring.slice(0,end);}
	else if (multiple)
	  results.push(query.slice(start,end));
	else return query.slice(start,end);
	if (end>0) {
	  query=query.slice(end);
	  start=query.search(namepat);}}
      if (multiple) return results; else return false;}
    fdjtState.getQuery=getQuery;

    function test_opt(pos,neg){
      var pospat=((pos)&&(new RegExp("\\b"+pos+"\\b")));
      var negpat=((neg)&&negative_opt_pat(neg));
      var i=2; while (i<arguments.length) {
	var arg=arguments[i++];
	if (!(arg)) continue;
	else if (typeof arg === 'string')
	  if ((pospat)&&(arg.search(pospat)>=0)) return true;
	  else if ((negpat)&&(arg.search(negpat)>=0)) return false;
	  else continue;
	else if (arg.length) {
	  var j=0; var len=arg.length;
	  while (j<len)
	    if ((pos)&&(arg[j]===pos)) return true;
	    else if ((neg)&&(arg[j]===neg)) return false;
	    else j++;
	  return false;}
	else continue;}
      return false;}
    fdjtState.testOption=test_opt;

    function negative_opt_pat(neg){
      if (!(neg)) return neg;
      else if (typeof neg === 'string')
	return (new RegExp("\\b"+neg+"\\b","gi"));
      else if (neg.length) {
	var rule="\\b(";
	var i=0; while (i<neg.length) {
	  var name=neg[i];
	  if (i>0) rule=rule+"|";
	  rule=rule+"("+name+")";
	  i++;}
	rule=rule+")\\b";
	return new RegExp(rule,"gi");}
      else return false;}

    fdjtState.argVec=function(argobj,start){
      var i=start||0;
      var result=new Array(argobj.length-i);
      while (i<argobj.length) {
	result[i-start]=argobj[i]; i++;}
      return result;};

    var nodeid=
      (Math.floor(Math.random()*65536)).toString(16)+
      (Math.floor(Math.random()*65536)).toString(16)+
      (Math.floor(Math.random()*65536)).toString(16)+
      (Math.floor(Math.random()*65536)|0x01).toString(16);
    fdjtLog("nodeid=%o",nodeid);
    var default_version=17; 
    var clockid=Math.floor(Math.random()*16384); var msid=1;
    var last_time=new Date().getTime();
    var zeros="00000000000000000000000000000000000000000000000000";
    
    fdjtState.getNodeID=function(arg){nodeid=arg;};
    fdjtState.setNodeID=function(arg){nodeid=arg;};
    function getUUID(version){
      var now=new Date().getTime();
      if (now<last_time) {now=now*1000000; clockid++;}
      else if (now===last_time)	now=now*1000000+(msid++);
      else {now=now*1000000; msid=1;}
      var timestamp=now.toString(16); var tlen=timestamp.length;
      if (tlen<15) timestamp=zeros.slice(0,15-tlen)+timestamp;
      return timestamp.slice(7)+"-"+timestamp.slice(3,7)+
	"-1"+timestamp.slice(0,3)+
	"-"+(32768+(clockid%16384)).toString(16)+
	"-"+nodeid;}
    fdjtState.getUUID=getUUID;
    
    return fdjtState;})();

/* Emacs local variables
;;;  Local variables: ***
;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
;;;  End: ***
*/
