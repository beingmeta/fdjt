/* -*- Mode: Javascript; -*- */

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

var fdjt_jsutils_id="$Id: handlers.js 40 2009-04-30 13:31:58Z haase $";
var fdjt_jsutils_version=parseInt("$Revision: 40 $".slice(10,-1));


function fdjtAdd(obj,field,val,nodup)
{
  if (nodup) 
    if (obj.hasOwnProperty(field)) {
      var vals=obj[field];
      if (vals.indexOf(val)<0)  
	obj[field].push(val);
      else {}}
    else obj[field]=new Array(val);
  else if (obj.hasOwnProperty(field))
    obj[field].push(val);
  else obj[field]=new Array(val);
  if ((obj._all) && (obj._all.indexOf(field)<0))
    obj._all.push(field);
}

function fdjtDrop(obj,field,val)
{
  if (!(val))
    /* Drop all vals */
    obj[field]=new Array();
  else if (obj.hasOwnProperty(field)) {
    var vals=obj[field];
    var pos=vals.indexOf(val);
    if (pos<0) return;
    else vals.splice(pos,1);}
  else {}
}

function fdjtTest(obj,field,val)
{
  var vals;
  if (typeof val === "undefined")
    return ((obj.hasOwnProperty(field)) &&
	    ((obj[field].length)>0));
  else if (obj.hasOwnProperty(field)) 
    if (obj[field].indexOf(val)<0)
      return false;
    else return true;
  else return false;
}

function fdjtInsert(array,value)
{
  if (array.indexOf(value)<0) array.push(value);
}

function fdjtRemove(array,value,count)
{
  var pos=array.indexOf(value);
  if (pos<0) return array;
  array.splice(pos,1);
  if (count) {
    count--; while ((count>0) && ((pos=array.indexOf(value,pos))>=0)) {
      array.splice(pos,1); count--;}}
  return array;
}

/* Maintaining inverted indices of values */

function fdjtIndexAdd(index,obj,rel,val)
{
  var subindex;
  if (index.hasOwnProperty(rel)) 
    subindex=index[rel];
  else {
    subindex={}; index[rel]=subindex;}
  if (subindex.hasOwnProperty(val)) {
    var objects=subindex[val];
    if (objects.indexOf(obj)<0)
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
      if ((pos=objects.indexOf(obj))>=0)
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

function _fdjt_set_sortfn(a,b)
{
  if (a===b) return 0;
  else if (typeof a === typeof b)
    if (a<b) return -1; else return 1;
  else if (typeof a < typeof b)
    return -1;
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
function fdjtOverlaps(set1,set2)
{
  var i=0; var j=0;
  set1=fdjtSet(set1); set2=fdjtSet(set2);
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

function fdjtSemiSplit(string)
{
  return string.split(';');
}

function fdjtLineSplit(string)
{
  return string.split('\n');
}

function fdjtStringTrim(string)
{
  var start=string.search(/\b/g); var end=string.search(/\B\$/g);
  if ((start===0) && (end<0)) return string;
  else return string.slice(start,end);
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
	fdjtTrace("probe=%s, vec=%o",probe,vec);
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
    while ((next>=0) && (next>scan)) {
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


/* All done, just begun */

fdjtLoadMessage("Loaded jsutils.js");

/* Emacs local variables
;;;  Local variables: ***
;;;  compile-command: "cd ..; make" ***
;;;  End: ***
*/


