/* -*- Mode: Javascript; -*- */

var fdjt_jsutils_id="$Id$";
var fdjt_jsutils_version=parseInt("$Revision$".slice(10,-1));

/* Copyright (C) 2009 beingmeta, inc.
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

/* Logging */

var _fdjt_trace_load=false;

/* This needs to be customized for non-DOM ECMAScript */

function fdjtLog(string)
{
  if ((window.console) && (window.console.log) &&
      (window.console.count))
    window.console.log.apply(window.console,arguments);
}

// Insert these for temporary logging statements, which will be easier
// to find
function fdjtTrace(string)
{
  if ((window.console) && (window.console.log) &&
      (window.console.count))
    window.console.log.apply(window.console,arguments);
}

// Insert these for breakpoints you can set
function fdjtBreak(string)
{
  if ((window.console) && (window.console.log) &&
      (window.console.count))
    window.console.log.apply(window.console,arguments);
  return false;
}

// This goes to an alert if it can't get to the console
function fdjtWarn(string)
{
  if ((window.console) && (window.console.log) &&
      (window.console.count))
    window.console.log.apply(window.console,arguments);
  else alert(string);
}

// Individually for file loading messages
function fdjtLoadMessage(string)
{
  if ((_fdjt_trace_load) && (window.console) && (window.console.log) &&
      (window.console.count))
    window.console.log.apply(window.console,arguments);
}

/* Object add/drop operations */


function fdjtAdd(obj,field,val,nodup)
{
  if (nodup) 
    if (obj.hasOwnProperty(field)) {
      var vals=obj[field];
      if (fdjtIndexOf(vals,val)<0)  
	obj[field].push(val);
      else {}}
    else obj[field]=new Array(val);
  else if (obj.hasOwnProperty(field))
    obj[field].push(val);
  else obj[field]=new Array(val);
  if ((obj._all) && (fdjtIndexOf(obj._all,field)<0))
    obj._all.push(field);
}

function fdjtDrop(obj,field,val)
{
  if (!(val))
    /* Drop all vals */
    obj[field]=new Array();
  else if (obj.hasOwnProperty(field)) {
    var vals=obj[field];
    var pos=fdjtIndexOf(vals,val);
    if (pos<0) return;
    else vals.splice(pos,1);}
  else {}
}

function fdjtTest(obj,field,val)
{
  var vals;
  if (typeof val === "undefined")
    return (((obj.hasOwnProperty) ?
	     (obj.hasOwnProperty(field)) : (obj[field])) &&
	    ((obj[field].length)>0));
  else if (obj.hasOwnProperty(field)) 
    if (obj[field].indexOf(val)<0)
      return false;
    else return true;
  else return false;
}

function fdjtInsert(array,value)
{
  if (fdjtIndexOf(array,value)<0) array.push(value);
}

function fdjtRemove(array,value,count)
{
  var pos=fdjtIndexOf(array,value);
  if (pos<0) return array;
  array.splice(pos,1);
  if (count) {
    count--; while ((count>0) && ((pos=fdjtIndexOf(array,value,pos))>=0)) {
      array.splice(pos,1); count--;}}
  return array;
}

function fdjtIndexOf(array,elt,pos)
{
  if (array.indexOf)
    if (pos)
      return array.indexOf(elt,pos);
    else return array.indexOf(elt);
  else {
    var i=pos||0;
    while (i<array.length)
      if (array[i]===elt) return i;
      else i++;
    return -1;}
}

/*
if (!(Array.indexOf))
  Array.indexOf=function(elt) {
    var i=0; while (i<this.length)
	       if (this[i]===elt) return i;
	       else i++;
    return -1;};
*/

/* Maintaining inverted indices of values */

function fdjtIndexAdd(index,obj,rel,val)
{
  var subindex;
  if (index.hasOwnProperty(field))
    subindex=index[rel];
  else {
    subindex={}; index[rel]=subindex;}
  if (subindex.hasOwnProperty(val)) {
    var objects=subindex[val];
    if (fdjtIndexOf(objects,obj)<0)
      objects.push(obj);}
  else subindex[val]=new Array(obj);
}

function fdjtIndexDrop(index,obj,rel,val)
{
  var subindex; var vals; var pos;
  if (index.hasOwnProperty(rel)) {
    var subindex=index[rel];
    if (subindex.hasOwnProperty(val)) {
      var objects=subindex[val]; var pos;
      if ((pos=fdjtIndexOf(objects,obj))>=0)
	subindex[val]=objects.splice(pos,1);}}
}

function fdjtIndexFind(index,rel,val)
{
  var subindex;
  if (index.hasOwnProperty(rel)) {
    var subindex=index[rel];
    if (subindex.hasOwnProperty(val))
      return subindex[val];}
  return [];
}

/* Turning an arguments object into an array. */

function fdjtArguments(argobj,start)
{
  var i=((start) ? (start) : (0));
  var result=new Array(argobj.length-i);
  while (i<argobj.length) {
    result[i]=argobj[i]; i++;}
  return result;
}

/* Fast set operations */

var _fdjt_idcounter=0;

function fdjtObjID(elt)
{
  return (elt._fdjtid)||(elt._fdjtid=(++_fdjt_idcounter));
}

function _fdjt_set_sortfn(a,b)
{
  if (a===b) return 0;
  else if (typeof a === typeof b) {
    if (typeof a === "number")
      return a-b;
    else if (typeof a === "string")
      if (a<b) return -1;
      else return 1;
    else if (a._fdjtid)
      if (b._fdjtid) return a._fdjtid-b._fdjtid;
      else {
	b._fdjtid=++_fdjt_idcounter;
	return -1;}
    else if (b._fdjtid) {
      a._fdjtid=++_fdjt_idcounter;
      return 1;}
    else {
      a._fdjtid=++_fdjt_idcounter;
      b._fdjtid=++_fdjt_idcounter;
      return -1;}}
  else if (typeof a < typeof b) return -1;
  else return 1;
}

function _fdjt_length_sortfn(a,b)
{
  if (a.length===b.length) return 0;
  else if (a.length<b.length) return -1;
  else return 1;
}

function fdjtSet(arg,destructive)
{
  if (!(arg)) return new Array();
  else if (arg instanceof Array)
    if (arg.length<2) return arg;
    else if ((arg._sortlen) && ((arg._sortlen) === (arg.length)))
      return arg;
    else {
      if (!(destructive)) arg=arg.slice(0);
      arg.sort(_fdjt_set_sortfn);
      var read=1; var write=1; var len=arg.length;
      var cur=arg[0];
      while (read<len) 
	if (arg[read]===cur) read++;
	else cur=arg[write++]=arg[read++];
      arg._sortlen=write;
      arg.length=write;
      return arg;}
  else return new Array(arg);
}

function fdjt_intersect(set1,set2)
{
  var results=new Array();
  var i=0; var j=0; var len1=set1.length; var len2=set2.length;
  while ((i<len1) && (j<len2))
    if (set1[i]===set2[j]) {
      results.push(set1[i]); i++; j++;}
    else if (_fdjt_set_sortfn(set1[i],set2[j])<0) i++;
    else j++;
  results._sortlen=results.length;
  return results;
}

function fdjtIntersect()
{
  if (arguments.length===0) return new Array();
  else if (arguments.length===1)
    return fdjtSet(arguments[0],true);
  else if (arguments.length===2)
    return fdjt_intersect(fdjtSet(arguments[0],true),
			  fdjtSet(arguments[1],true));
  else {
    var i=0; while (i<arguments.length)
	       if (!(arguments[i])) return new Array();
	       else if ((typeof arguments[i] === "object") &&
			(arguments[i] instanceof Array) &&
			(arguments[i].length===0))
		 return new Array();
	       else i++;
    var copied=arguments.slice(0);
    copied.sort(fdjt_len_sortfn);
    var results=fdjtSet(copied[0],true);
    i=1; while (i<copied.length) {
      results=fdjt_intersect(results,fdjtSet(copied[i++],true));
      if (results.length===0) return results;}
    return results;}
}

function fdjt_union(set1,set2)
{
  var results=new Array();
  var i=0; var j=0; var len1=set1.length; var len2=set2.length;
  while ((i<len1) && (j<len2))
    if (set1[i]===set2[j]) {
      results.push(set1[i]); i++; j++;}
    else if (_fdjt_set_sortfn(set1[i],set2[j])<0)
      results.push(set1[i++]);
    else results.push(set2[j++]);
  while (i<len1) results.push(set1[i++]);
  while (j<len2) results.push(set2[j++]);
  results._sortlen=results.length;
  return results;
}

function fdjtUnion()
{
  if (arguments.length===0) return new Array();
  else if (arguments.length===1) return fdjtSet(arguments[0]);
  else if (arguments.length===2)
    return fdjt_union(fdjtSet(arguments[0],true),
		      fdjtSet(arguments[1],true));
  else {
    var result=fdjtSet(arguments[0],true);
    var i=1; while (i<arguments.length) {
      result=fdjt_union(result,fdjtSet(arguments[i++],true));}
    return result;}
}

function fdjtDifference(set1,set2)
{
  var results=new Array();
  var i=0; var j=0;
  set1=fdjtSet(set1); set2=fdjtSet(set2);
  var len1=set1.length; var len2=set2.length;
  while ((i<len1) && (j<len2))
    if (set1[i]===set2[j]) {
      i++; j++;}
    else if (_fdjt_set_sortfn(set1[i],set2[j])<0)
      results.push(set1[i++]);
    else j++;
  while (i<len1) results.push(set1[i++]);
  results._sortlen=results.length;
  return results;
}

// This could be faster, but we can do that later
function fdjtOverlaps(set1,set2,destructive)
{
  var i=0; var j=0;
  set1=fdjtSet(set1,destructive||false);
  set2=fdjtSet(set2,destructive|false);
  var len1=set1.length; var len2=set2.length;
  while ((i<len1) && (j<len2))
    if (set1[i]===set2[j]) return true;
    else if (_fdjt_set_sortfn(set1[i],set2[j])<0) i++;
    else j++;
  return false;
}

// So could this
function fdjtOverlap(set1,set2)
{
  var i=0; var j=0; var overlap=0;
  set1=fdjtSet(set1); set2=fdjtSet(set2);
  var len1=set1.length; var len2=set2.length;
  while ((i<len1) && (j<len2))
    if (set1[i]===set2[j]) overlap++;
    else if (_fdjt_set_sortfn(set1[i],set2[j])<0) i++;
    else j++;
  return overlap;
}

/* Converting numeric HTML entities */

function fdjtUnEntify(string)
{
  return string.replace(/&#(\d+);/g,
			function(whole,paren) {
			  return String.fromCharCode(+paren);});
}

/* Other utility functions */

function fdjtIsEmptyString(string)
{
  if (typeof string === "string") 
    if (string.length===0) return true;
    else if (string.search(/\S/g)>=0)
      return false;
    else return true;
  else return false;
}

function fdjtFindSplit(string,split,escape)
{
  var start=0;
  var next;
  while ((next=string.indexOf(split,start))>=0) 
    if ((escape) && (next>0) && (string[next-1]===escape))
      start=next+1;
    else return next;
  return -1;
}

function fdjtStringSplit(string,split,escape,mapfn)
{
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
  else return string.split(split);
}

function fdjtSemiSplit(string,escape,mapfn)
{
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
  else return string.split(';');
}

function fdjtLineSplit(string,escapes,mapfn)
{
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
  else return string.split('\n');
}

function fdjtStringTrim(string)
{
  var start=string.search(/\S/); var end=string.search(/\s+$/g);
  if ((start===0) && (end<0)) return string;
  else return string.slice(start,end);
}

function fdjtStdSpace(string)
{
  var trimmed=string.replace(/(^(\W)+)|((\W)+$)/g,"");
  return trimmed.replace(/(\W)+/g," ");
}

function fdjtStripMarkup(string)
{
  return string.replace(/<[^>]*>/g,"");
}

function fdjtUnEscape(string)
{
  if (string.indexOf('\\')>=0)
    return string.replace(/\\(.)/g,"$1");
  else return string;
}

/* More string functions */

function fdjtHasPrefix(string,prefix)
{
  return ((string.indexOf(prefix))===0);
}

function fdjtHasSuffix(string,suffix)
{
  return ((string.lastIndexOf(suffix))===(string.length-suffix.length));
}

function fdjtCommonPrefix(string1,string2,brk,foldcase)
{
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
  else return false;
}

function fdjtCommonSuffix(string1,string2,brk,foldcase)
{
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
  else return false;
}

/* Prefix trees */

function fdjtPrefixAdd(ptree,string,i)
{
  var strings=ptree.strings;
  if (i===string.length) 
    if ((strings.indexOf) ?
	(strings.indexOf(string)>=0) :
	(fdjtIndexOf(strings,string)>=0))
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
    if (fdjtPrefixAdd(split,string,i+1)) {
      strings.push(string);
      return true;}
    else return false;}
  else if (ptree.strings.length<5)
    if ((strings.indexOf) ?
	(strings.indexOf(string)>=0) :
	(fdjtIndexOf(strings,string)>=0))
      return false;
    else {
      strings.push(string);
      return true;}
  else {
    // Subdivide
    ptree.splits=[];
    var strings=ptree.strings;
    var j=0; while (j<strings.length) 
	       fdjtPrefixAdd(ptree,strings[j++],i);
    return fdjtPrefixAdd(ptree,string,i);}
}

function fdjtPrefixFind(ptree,prefix,i,plen)
{
  if (!(plen)) plen=prefix.length;
  if (i===plen)
    return ptree.strings;
  else if (ptree.strings.length<=5) {
    var strings=ptree.strings;
    var results=[];
    var j=0; while (j<strings.length) {
      var string=strings[j++];
      if (fdjtHasPrefix(string,prefix)) results.push(string);}
    if (results.length) return results;
    else return false;}
  else {
    var split=ptree[prefix[i]];
    if (split) return fdjtPrefixFind(split,prefix,i+1,plen);
    else return false;}
}

/* Getting key/char codes */

var _fdjt_char_codes={
  "enter":13,"tab":9,"backspace":8,"esc":27,
  "shift":16,"ctrl":17,"alt":17,"break":19,
  "capslock":20,"pageup":33,"pagedown":33,
  "end":34,"home":36,"custom":91,
  "leftarrow":37,"rightarrow":39,
  "uparrow":38,"downarrow":40,
  "insert":45,"delete":46};

/* This converts a string into a vector of integers with
   positive numbers representing character codes and negative
   numbers representing keycodes. */
function fdjtStringToKCodes(string)
{
  var vec=[];
  var i=0; while (i<string.length) {
    if (string[i]==="\\") {
      vec.push(string.charCodeAt(i+1));
      i=i+2;}
    else if (string[i]==="[") {
      var end=string.indexOf("]",i+1);
      if (end<0) {
	fdjtWarn("Unmatched [ in KCode spec %s",string);
	i=i+1;}
      else {
	var probe=string.slice(i+1,end);
	if (typeof _fdjt_char_codes[probe] === "number") 
	  vec.push(-(_fdjt_char_codes[probe]));
	else if (typeof parseInt(probe,16) === "number")
	  vec.push(-(parseInt(probe)));
	i=end+1;}}
    else vec.push(string.charCodeAt(i++));}
  return vec;
}

/* Internationalization */

var fdjt_language='en';
var fdjt_translations={};
var fdjt_default_translations={};
fdjt_translations.en=fdjt_default_translations;

function _(string)
{
  var fmt=fdjt_translations[string]||string;
  if (arguments.length===1)
    return fmt;
  else {
    var output=""; var scan=0; var next=fmt.indexOf('%',scan);
    while ((next>=0) && (next>=scan)) {
      if (fmt[next+1]==="%") {
	next=fmt.indexOf('%',next+2); continue;}
      else {
	var numlen=fmt.slice(next+1).search(/\D/);
	if (numlen===0) {
	  next=fmt.indexOf('%',next+2); continue;}
	output=output+fmt.slice(scan,next);
	var num=((numlen<0)?(parseInt(fmt.slice(next+1))):
		 (parseInt(fmt.slice(next+1,next+1+numlen))));
	if (num>arguments.length)
	  output=output+"??";
	else {
	  var arg=arguments[num];
	  if (typeof arg === "object")
	    if (arg.toHuman)
	      output=output+arg.toHuman(fdjt_language);
	    else if (arg.toFDJTString)
	      output=output+arg.toFDJTString();
	    else output=output+arg;
	  else output=output+arg;
	  if (numlen<0) scan=fmt.length;
	  else scan=next+1+numlen;}
	next=fmt.indexOf('%',scan);}}
    output=output+fmt.slice(scan);
    return output;}
}

/* Time functions */

function fdjtTick()
{
  return (new Date()).getTime()/1000;
}

function fdjtTickString(tick)
{
  return (new Date(tick*1000)).toString();
}

function fdjtTickDate(tick)
{
  return (new Date(tick*1000)).toDateString();
}

function fdjtIntervalString(interval)
{
  if (interval===1)
    return _("%1 second",interval);
  else if (interval<10)
    return _("%1 seconds",interval);
  else if (interval<60)
    return _("~%1 seconds",Math.round(interval/60));
  else if (interval<120) {
    var minutes=Math.floor(interval/60);
    var seconds=Math.round(interval-(minutes*60));
    if (seconds===1)
      return _("one minute, one second");
    else return _("one minute, %1 seconds",seconds);}
  else if (interval<3600) {
    var minutes=Math.floor(interval/60);
    return _("~%1 minutes",minutes);}
  else if (interval<(2*3600)) {
    var hours=Math.floor(interval/3600);
    var minutes=Math.round((interval-(hours*3600))/60);
    if (minutes===1)
      return _("one hour and one minutes");
    else return _("one hour, %1 minutes",minutes);}
  else if (interval<(24*3600)) {
    var hours=Math.floor(interval/3600);
    return _("~%1 hours",hours);}
  else if (interval<(2*24*3600)) {
    var hours=Math.floor((interval-24*3600)/3600);
    if (hours===1)
      return _("one day and one hour");
    else return _("one day, %1 hours",hours);}
  else if (interval<(7*24*3600)) {
    var days=Math.floor(interval/(24*3600));
    return _("%1 days",days);}
  else if (interval<(14*24*3600)) {
    var days=Math.floor((interval-(7*24*3600))/(24*3600));
    if (days===1)
      return "one week and one day";
    else return _("one week and %1 days",days);}
  else {
    var weeks=Math.floor(interval/(7*24*3600));
    var days=Math.round((interval-(days*7*24*3600))/(7*24*3600));
    return _("%1 weeks, %2 days",weeks,days);}
}

function fdjtRunTimes(pname,start)
{
  var point=start; var report="";
  var i=2; while (i<arguments.length) {
    var phase=arguments[i++]; var time=arguments[i++];
    report=report+"; "+phase+": "+
      ((time.getTime()-point.getTime())/1000)+"s";
    point=time;}
  return ((point.getTime()-start.getTime())/1000)+"s"+report;
}

function fdjtDiffTime(time1,time2)
{
  if (!(time2)) time2=new Date();
  var diff=time1.getTime()-time2.getTime();
  if (diff>0) return diff/1000; else return -(diff/1000);
}

function fdjtDeltaTime(time1)
{
  var time2=new Date();
  var diff=time1.getTime()-time2.getTime();
  time1.setTime(time2.getTime());
  if (diff>0) return diff/1000; else return -(diff/1000);
}

var fdjt_loaded=(new Date()).getTime();
function fdjtDeltaTime(time1)
{
  var time2=new Date();
  var diff=time1.getTime()-time2.getTime();
  time1.setTime(time2.getTime());
  if (diff>0) return diff/1000; else return -(diff/1000);
}

function fdjtElapsedTime(arg)
{
  if (!(arg)) arg=new Date();
  return (arg.getTime()-fdjt_loaded)/1000;
}

/* Setups */

var fdjt_setup_started=false;
var fdjt_setup_done=false;
var fdjt_setups=[];
var fdjt_final_setups=[];

function fdjtAddSetup(fcn,final)
{
  if (fcn instanceof Array) {
    var i=0; while (i<fcn.length) fdjtAddSetup(fcn[i++],final);}
  else if (fdjt_setup_done) {
    if ((fdjtIndexOf(fdjt_setups,fcn)>=0)||
	(fdjtIndexOf(fdjt_final_setups,fcn)>=0))
      return;
    fdjtWarn("Running setup %o late",fcn);
    fcn();}
  else if (final)
    if (fdjtIndexOf(fdjt_final_setups,fcn)<0)
      fdjt_final_setups.push(fcn);
    else {}
  else if (fdjtIndexOf(fdjt_setups,fcn)<0)
    fdjt_setups.push(fcn);
  else {}
}

function _fdjtWindowId()
{
  if (window)
    if (window.name)
      if (window.location)
	return "#"+window.name+"@"+window.location;
      else return "#"+window.name;
    else return "window@"+window.location;
  else return "nowindow";
}

function fdjtSetup()
{
  if (fdjt_setup_started) return;
  fdjt_setup_started=true;
  if ((fdjt_buildhost)&&(fdjt_buildtime))
    fdjtLog("[%fs] Starting fdjtSetup (built on %s on %s) for %s",
	    fdjtElapsedTime(),fdjt_buildhost,fdjt_buildtime,_fdjtWindowId());
  else fdjtLog("[%fs] Starting fdjtSetup for %o@%o",
	       fdjtElapsedTime(),(((window)&&(window.name))||"anonymous"));
  var i=0; while (i<fdjt_setups.length) fdjt_setups[i++]();
  var i=0; while (i<fdjt_final_setups.length) fdjt_final_setups[i++]();
  fdjtLog("[%fs] Finished fdjtSetup for %s",fdjtElapsedTime(),_fdjtWindowId());
  fdjt_setup_done=true;
}

/* All done, just begun */

fdjtLoadMessage("Loaded jsutils.js");

/* Emacs local variables
;;;  Local variables: ***
;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
;;;  End: ***
*/
