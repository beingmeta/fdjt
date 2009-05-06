/* -*- Mode: Javascript; -*- */

/* Copyright (C) 2001-2009 beingmeta, inc.
   This file is a part of the FDJT web toolkit (www.fdjt.org)
   This file provides extended functionality for web applications,
   especially for manipulating the DOM in various ways. 

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

var fdjt_domutils_id="$Id: domutils.js 40 2009-04-30 13:31:58Z haase $";
var fdjt_domutils_version=parseInt("$Revision: 40 $".slice(10,-1));
var _fdjt_debug=false;
var _fdjt_debug_domedits=false;
var _fdjt_debug_domsearches=false;
var _fdjt_debug_classedits=false;
var _fdjt_trace_load=false;

function fdjtLog(string)
{
  if ((window.console) && (window.console.log))
    window.console.log.apply(window.console,arguments);
}

// Insert these for temporary logging statements, which will be easier
// to find
function fdjtTrace(string)
{
  if ((window.console) && (window.console.log))
    window.console.log.apply(window.console,arguments);
}

// This goes to an alert if it can't get to the console
function fdjtWarn(string)
{
  if ((window.console) && (window.console.log))
    window.console.log.apply(window.console,arguments);
  else alert(string);
}

// Individually for file loading messages
function fdjtLoadMessage(string)
{
  if ((_fdjt_trace_load) && (window.console) && (window.console.log))
    window.console.log.apply(window.console,arguments);
}

/* Getting elements by ID */

function $(eltarg)
{
  if (typeof eltarg == 'string')
    return document.getElementById(eltarg);
  else return eltarg;
}

// Like $, but more needy, it outputs a warning if a given element is
// not found.
function fdjtNeedElt(arg,name)
{
  if (typeof arg == 'string') {
    var elt=document.getElementById(arg);
    if (elt) return elt;
    else if (name)
      fdjtWarn("Invalid element ("+elt+") reference: "+arg);
    else fdjtWarn("Invalid element reference: "+arg);
    return null;}
  else if (arg) return arg;
  else {
    if (name)
      fdjtWarn("Invalid element ("+elt+") reference: "+arg);
    else fdjtWarn("Invalid element reference: "+arg);
    return null;}
}

/* DOMish utils */

function fdjtNodify(arg)
{
  if (typeof arg === "string")
    return document.createTextNode(arg);
  else if (typeof arg != "object")
    if (arg.toString)
      return document.createTextNode(arg.toString());
    else return document.createTextNode("#@!*%!");
  else if (arg instanceof Node)
    return arg;
  else if (arg.toHTML)
    return (arg.toHTML());
  else if (arg.toString)
    return fdjtSpan("nodified",arg.toString());
  else return document.createTextNode("#@!*%!");
}

function fdjtBlockEltp(elt)
{
  var name=elt.tagName;
  return ((name==='DIV') || (name==='P') || (name==='LI') || (name==='UL'));
}

// We define this because .hasAttribute isn't everywhere
function fdjtHasAttrib(elt,attribname,attribval)
{
  if (!(attribval))
    if (elt.hasAttribute)
      return elt.hasAttribute(attribname);
    else if (elt.getAttribute)
      if (elt.getAttribute(attribname))
	return true;
      else return false;
    else return false;
  else if ((elt.getAttribute) &&
	   (elt.getAttribute(attribname)==attribval))
    return true;
  else return false;
}

/* This is a kludge which is probably not very portable */

function fdjtRedisplay(arg)
{
  if (arg===null) return;
  else if (typeof arg === "string")
    fdjtRedisplay($(arg));
  else if (arg instanceof Array) {
    var i=0; while (i<arg.length) fdjtRedisplay(arg[i++]);}
  else if (arg instanceof Node)
    arg.className=arg.className;
  else return;
}

/* Manipluating class names */

var _fdjt_whitespace_pat=/(\s)+/;
var _fdjt_trimspace_pat=/^(\s)+|(\s)+$/;

function _fdjtclasspat(name)
{
  var rx=new RegExp("\\b"+name+"\\b","g");
  return rx;
}

function fdjtHasClass(elt,classname,attrib)
{
  var classinfo=((attrib) ? (elt.getAttribute(attrib)||"") : (elt.className));
  if ((classinfo) &&
      ((classinfo==classname) ||
       (classinfo.search(_fdjtclasspat(classname))>=0)))
    return true;
  else return false;
}

function fdjtAddClass(elt,classname,attrib)
{
  if (elt===null) return null;
  else if (typeof elt === "string")
    if (elt==="") return false;
    else if (elt[0]==='#') {
      var elts=new Array();
      var ids=elt.split('#');
      var i=1; while (i<ids.length) {
	var e=document.getElementById(ids[i++]);
	if (e) elts.push(e);}
      elt=elts;}
    else elt=document.getElementById(elt);
  if (!(elt)) return false;
  else if (elt instanceof Array) {
    var i=0; while (i<elt.length) {
      var e=elt[i++]; fdjtAddClass(e,classname,(attrib||false));}}
  else {
    var classinfo=((attrib) ? (elt.getAttribute(attrib)||"") :(elt.className));
    var class_regex=_fdjtclasspat(classname);
    var newinfo=classinfo;
    if (_fdjt_debug_classedits)
      fdjtLog("Adding %s '%s' to (%s) on %o",
	      (attrib||"class"),classname,classinfo,elt);
    if ((classinfo===null) || (classinfo==""))
      newinfo=classname;
    else if (classinfo===classname)
      return false;
    else if (classinfo.search(class_regex)>=0)
      return false;
    else newinfo=classname+" "+classinfo;
    if (newinfo)
      newinfo=newinfo.
	replace(_fdjt_whitespace_pat," ").
	replace(_fdjt_trimspace_pat,"");
    if (attrib) elt.setAttribute(attrib,newinfo);
    else elt.className=newinfo;
    return true;}
}

function fdjtDropClass(elt,classname,attrib,keep)
{
  if (elt===null) return null;
  else if (typeof elt === "string")
    if (elt==="") return false;
    else if (elt[0]==='#') {
      var elts=new Array();
      var ids=elt.split('#');
      var i=1; while (i<ids.length) {
	var e=document.getElementById(ids[i++]);
	if (e) elts.push(e);}
      elt=elts;}
    else elt=document.getElementById(elt);
  if (!(elt)) return false;
  else if (elt instanceof Array) {
    var i=0; while (i<elt.length) {
      var e=elt[i++]; fdjtDropClass(e,classname,(attrib||false));}}
  else {
    var classinfo=((attrib) ? (elt.getAttribute(attrib)||"") :(elt.className));
    var class_regex=_fdjtclasspat(classname);
    var newinfo=classinfo;
    if (_fdjt_debug_classedits)
      fdjtLog("Dropping %s '%s' from (%s) on %o",
	      (attrib||"class"),classname,classinfo,elt);
    if ((classinfo===null) || (classinfo==="")) return false;
    else if (classinfo===classname) 
      newinfo=null;
    else if (classinfo.search(class_regex)>=0) 
      newinfo=classinfo.replace(class_regex,"");
    else return false;
    if (newinfo)
      newinfo=newinfo.
	replace(_fdjt_whitespace_pat," ").
	replace(_fdjt_trimspace_pat,"");
    if (attrib)
      if (newinfo) elt.setAttribute(attrib,newinfo);
      else if (!(keep)) elt.removeAttribute(attrib);
      else {}
    else elt.className=newinfo;}
}

function fdjtToggleClass(elt,classname,attrib,keep)
{
  if (elt===null) return null;
  else if (typeof elt === "string")
    if (elt==="") return false;
    else if (elt[0]==='#') {
      var elts=new Array();
      var ids=elt.split('#');
      var i=1; while (i<ids.length) {
	var e=document.getElementById(ids[i++]);
	if (e) elts.push(e);}
      elt=elts;}
    else elt=document.getElementById(elt);
  if (!(elt)) return false;
  else if (elt instanceof Array) {
    var i=0; while (i<elt.length) {
      var e=elt[i++]; fdjtToggleClass(e,classname,(attrib||false));}}
  else {
    var classinfo=((attrib) ? (elt.getAttribute(attrib)||"") :(elt.className));
    var class_regex=_fdjtclasspat(classname);
    var newinfo=classinfo;
    if (_fdjt_debug_classedits)
      fdjtLog("Toggling %s '%s' from (%s) on %o",
	      (attrib||"class"),classname,classinfo,elt);
    if ((classinfo===null) || (classinfo===""))
      newinfo=classname;
    else if (classinfo===classname) 
      newinfo=null;
    else if (classinfo.search(class_regex)>=0) 
      newinfo=
	classinfo.replace(class_regex,"").
	replace(_fdjt_whitespace_pat," ");
    else newinfo=classinfo+" "+classname;
    if (newinfo)
      newinfo=newinfo.
	replace(_fdjt_whitespace_pat," ").
	replace(_fdjt_trimspace_pat,"");
    if (attrib)
      if (newinfo) elt.setAttribute(attrib,newinfo);
      else if (!(keep)) elt.removeAttribute(attrib);
      else elt.setAttribute(attrib,"");
    else elt.className=newinfo;}
}

function fdjtSwapClass(elt,classname,newclass,attrib)
{
  if (elt===null) return null;
  else if (typeof elt === "string")
    if (elt==="") return false;
    else if (elt[0]==='#') {
      var elts=new Array();
      var ids=elt.split('#');
      var i=1; while (i<ids.length) {
	var e=document.getElementById(ids[i++]);
	if (e) elts.push(e);}
      elt=elts;}
    else elt=document.getElementById(elt);
  if (!(elt)) return false;
  else if (elt instanceof Array) {
    var i=0; while (i<elt.length) {
      var e=elt[i++]; fdjtSwapClass(e,classname,(attrib||false));}}
  else {
    var classinfo=((attrib) ? (elt.getAttribute(attrib)||"") :(elt.className));
    var class_regex=_fdjtclasspat(classname);
    var newinfo=classinfo;
    if ((classinfo) && ((classinfo.search(class_regex))>=0)) 
      newinfo=
	classinfo.replace(class_regex,newclass).
	replace(_fdjt_whitespace_pat," ");
    else if (_fdjt_debug) {
      fdjtLog
	("Couldn't swap %s '%s' to replace non-existing '%s', just adding to %o",
	 (attrib||"class"),newclass,classname,elt);
      return fdjtAddClass(elt,newclass,(attrib||false));}
    else return fdjtAddClass(elt,newclass,(attrib||false));
    if (newinfo)
      newinfo=newinfo.
	replace(_fdjt_whitespace_pat," ").
	replace(_fdjt_trimspace_pat,"");
    if (attrib)
      if (newinfo) elt.setAttribute(attrib,newinfo);
      else elt.removeAttribute(attrib);
    else elt.className=newinfo;}
}

/* Next and previous elements */

function fdjtNextElement(node)
{
  if (node.nextElementSibling)
    return node.nextElementSibling;
  else {
    var scan=node;
    while (scan=scan.nextSibling) {
      if (!(scan)) return null;
      else if (scan.nodeType==1) break;
      else {}}
    return scan;}
}

function fdjtPreviousElement(node)
{
  if (node.previousElementSibling)
    return node.previousElementSibling;
  else {
    var scan=node;
    while (scan=scan.previousSibling) 
      if (!(scan)) return null;
      else if (scan.nodeType==1) break;
      else {}
    return scan;}
}

/* Searching by tag name */

function fdjtGetParentByTagName(node,tagname)
{
  var scan;
  if (typeof node == "string")
    scan=document.getElementById(node);
  else scan=node;
  tagname=tagname.toUpperCase();
  while ((scan) && (scan.parentNode)) 
    if (scan.tagName===tagname) return scan;
    else scan=scan.parentNode;
  if ((scan) && (scan.tagName===tagname)) return scan;
  else return null;
}

function fdjtGetChildrenByTagName(under,tagname)
{
  if (typeof under === 'string') {
    under=document.getElementById(under);
    if (under===null) return new Array();}
  tagname=tagname.toUpperCase();
  if (under===null)
    if (document.getElementsByTagName)
      return document.getElementsByTagName(tagname);
    else return _fdjtGetChildrenByTagName(document,tagname,new Array());
  else if (under.getElementsByTagName)
    return under.getElementsByTagName(tagname);
  else return _fdjtGetChildrenByTagName(under,tagname,new Array());
}
function _fdjtGetChildrenByTagName(under,tagname,results)
{
  if ((under.nodeType===1) && (under.tagName==tagname))
    results.push(under);
  var children=under.childNodes;
  var i=0; while (i<children.length)
    if (children[i].nodeType==1)
      _fdjtGetChildrenByTagName(children[i++],tagname,results);
    else i++;
  return results;
}

/* Searching by class name */

function fdjtGetParentByClassName(node,classname)
{
  var scan;
  if (typeof node === "string") scan=document.getElementById(node);
  else scan=node;
  while ((scan) && (scan.parentNode))
    if (scan.className===classname)
      return scan;
    else if ((scan.className) && (fdjtHasClassName(scan,classname)))
      return scan;
    else scan=scan.parentNode;
  if ((scan) && (scan.className===classname)) return scan;
  else return null;
}

function fdjtGetChildrenByClassName(under,classname)
{
  if (typeof under === 'string')
    under=document.getElementById(under);
  if ((under) && (under.getElementsByClassName))
    return under.getElementsByClassName(classname);
  else if ((under===null) && (document.getElementsByClassName))
    return document.getElementsByClassName(classname);
  else if (under===null)
    return _fdjtGetChildrenByClassName(document,classname,new Array());
  else return _fdjtGetChildrenByClassName(under,classname,new Array());
}
function _fdjtGetChildrenByClassName(under,classname,results)
{
  if ((under.nodeType===1) && (under.className===classname))
    results.push(under);
  var children=under.childNodes;
  var i=0; while (i<children.length)
    if (children[i].nodeType===1)
      _fdjtGetChildrenByClassName(children[i++],tagname,results);
    else i++;
  return results;
}     

/* Kind of legacy */

function fdjtGetElementsByClassName(classname,under_arg)
{
  if (!(under_arg))
    return fdjtGetChildrenByClassName(null,classname);
  else if (typeof under_arg === 'string') {
    var under=document.getElementById(under_arg);
    if (under==null) return new Array();
    else return fdjtGetChildrenByClassName(under,classname);}
  else return fdjtGetChildrenByClassName(under_arg,classname);
}

function fdjtGetElementsByTagName(tagname,under_arg)
{
  if (!(under_arg))
    return fdjtGetChildrenByTagName(null,tagname.toUpperCase());
  else if (typeof under_arg === 'string') {
    var under=document.getElementById(under_arg);
    if (under==null) return new Array();
    else return fdjtGetChildrenByTagName(under,tagname.toUpperCase());}
  else return fdjtGetChildrenByTagName(under_arg,tagname);
}

/* Searching by attribute */

function fdjtGetParentByAttrib(node,attribName,attribValue)
{
  var scan;
  if (typeof node === "string") scan=document.getElementById(node);
  else node=scan;
  if (attribValue)
    while ((scan) && (scan.parentNode))
      if (scan.getAttribute(attribName)==attribValue)
	return scan;
      else parent=scan.parentNode;
  else while ((scan) && (scan.parentNode))
    if ((scan.hasAttribute) ? (scan.hasAttribute(attribName)) :
	(!(!(scan.getAttribute(attribName)))))
      return scan;
    else scan=scan.parentNode;
}

function fdjtGetChildrenByAttrib(under,attribName,attribValue)
{
  if (typeof under === 'string')
    under=document.getElementById(under);
  if (attribValue)
    return _fdjtGetChildrenByAttribValue
      (under,attribName,attribValue,new Array());
  else return _fdjtGetChildrenByAttrib(under,attribName,new Array());
}
function _fdjtGetChildrenByAttrib(under,attribname,results)
{
  if ((under.nodeType==1) &&
      ((under.hasAttribute) ? (under.hasAttribute(attribname)) :
       (under.getAttribute(attribname))))
    results.push(under);
  var children=under.childNodes;
  var i=0; while (i<children.length)
    if (children[i].nodeType==1)
      _fdjtGetChildrenByAttrib(children[i++],attribname,results);
    else i++;
  return results;
}
function _fdjtGetChildrenByAttribValue(under,attribname,attribval,results)
{
  if ((under.nodeType==1) &&
      (under.getAttribute(attribname)==attribval))
    results.push(under);
  var children=under.childNodes;
  var i=0; while (i<children.length)
    if (children[i].nodeType==1)
      _fdjtGetChildrenByAttrib(children[i++],attribname,attribval,results);
    else i++;
  return results;
}

/* Searching by selector */

function fdjtParseSelector(spec)
{
  var tagname=null, classname=null, idname=null;
  var dotpos=spec.indexOf('.'), hashpos=spec.indexOf('#');
  if ((dotpos<0) && (hashpos<0))
    tagname=spec.toUpperCase();
  else if (dotpos>=0) {
    classname=spec.slice(dotpos+1);
    if (dotpos>0) tagname=spec.slice(0,dotpos).toUpperCase();}
  else if (hashpos>=0) {
    idname=spec.slice(hashpos+1);
    if (hashpos>0) tagname=spec.slice(0,hashpos).toUpperCase();}
  else if (dotpos<hashpos) {
    if (dotpos>0) tagname=spec.slice(0,dotpos);
    classname=spec.slice(dotpos+1,hashpos);
    idname=spec[hashpos];}
  else {
    if (hashpos>0) tagname=spec.slice(0,hashpos).toUpperCase();
    classname=spec.slice(dotpos);
    idname=spec.slice(hashpos+1,dotpos);}
  if ((tagname==="") || (tagname==="*")) tagname=null;
  if ((classname==="") || (classname==="*")) tagname=null;
  if ((idname==="") || (idname==="*")) tagname=null;
  return new Array(tagname,classname,idname);
}

function fdjtElementMatches(elt,selector)
{
  if (selector instanceof Array) {
    var i=0; while (i<spec.length)
	       if (fdjtElementMatches(elt,selector[i]))
		 return true;
	       else i++;
    return false;}
  else {
    var spec=fdjtParseSelector(selector);
    return (((spec[0]===null) || (elt.tagName===spec[0])) &&
	    ((spec[1]===null) || (spec[1]===elt.className) ||
	     (elt.className.search(_fdjtclasspat(spec[1]))>=0)) &&
	    ((spec[2]===null) || (elt.id===spec[2])));}
}

function fdjtElementMatchesSpec(elt,spec)
{
  return (((spec[0]===null) || (elt.tagName===spec[0])) &&
	  ((spec[1]===null) || (spec[1]===elt.className) ||
	   (elt.className.search(_fdjtclasspat(spec[1]))>=0)) &&
	  ((spec[2]===null) || (elt.id===spec[2])));
}

function fdjtGetParents(elt,selector,results)
{
  if (!(results)) results=new Array();
  if (selector instanceof Array) {
    var i=0; while (i<selector.length) 
      fdjtGetParents(elt,selector[i++],results);
    return results;}
  else {
    var scan=elt;
    while (scan) {
      if (results.indexOf(scan)>=0) {}
      else if (fdjtElementMatchesSpec(scan,spec)) 
	results.push(scan);
      else {}
      scan=scan.parentNode;}
    return results;}
}

function fdjtGetParent(elt,selector)
{
  var scan=elt;
  while (scan)
    if (fdjtElementMatches(scan,selector))
      return scan;
    else scan=scan.parentNode;
  return scan;
}

function fdjtGetChildren(elt,selector,results)
{
  if (!(results)) results=new Array();
  if ((typeof selector === "object") &&
      (selector instanceof Array)) {
    var i=0; while (i<selector.length)
	       fdjtGetChildren(elt,selector[i++],results);
    return results;}
  else {
    var spec=fdjtParseSelector(selector);
    if (spec[2]) {
      var candidate=document.getElementById(spec[2]);
      if (candidate)
	if (fdjtElemenMatchesSpec(candidate,spec)) {
	  var scan=candidate;
	  while (scan)
	    if (scan===elt) break;
	    else scan=scan.parentNode;
	  if (scan===elt) results.push(candidate);
	  return results;}
	else return results;}
    else if (spec[1]) {
      var candidates=fdjtGetChildrenByClassName(elt,spec[1]);
      var i=0; while (i<candidates.length) {
	var candidate=candidates[i++];
	if (fdjtElementMatchesSpec(candidate,spec))
	  results.push(candidate);}
      return results;}
    else if (spec[0]) {
      var candidates=fdjtGetChildrenByTagName(elt,spec[0]);
      var i=0; while (i<candidates.length) results.push(candidates[i++]);
      return results;}
    else return results;}
}

function $$(selector,cxt) 
{
  var elt=((cxt) ? (cxt) : (document));
  return fdjtGetChildren(elt,selector,new Array());
}

function $P(selector,cxt) 
{
   return fdjtGetParent(cxt,selector);
}

/* Adding/Inserting nodes */

function fdjtAddElements(elt,elts,i)
{
  if (elt===null) return null;
  while (i<elts.length) {
    var arg=elts[i++];
    if (!(arg)) {}
    else if (typeof arg == 'string')
      elt.appendChild(document.createTextNode(arg));
    else if (arg instanceof Array) {
      var j=0; while (j<arg.length) {
	var toadd=arg[j++];
	if (!(toadd)) {}
	else elt.appendChild(fdjtNodify(toadd));}}
    else elt.appendChild(fdjtNodify(arg));}
  return elt;
}

function fdjtAddAttributes(elt,attribs)
{
  if (elt===null) return null;
  if (attribs) {
    for (key in attribs) {
      if (key=='title')
	elt.title=attribs[key];
      else if (key=='name')
	elt.name=attribs[key];
      else if (key=='id')
	elt.id=attribs[key];
      else if (key=='value')
	elt.value=attribs[key];
      else elt.setAttribute(key,attribs[key]);}
    return elt;}
  else return elt;
}

function fdjtInsertElementsBefore(elt,before,elts,i)
{
  if (elt===null) return null;
  if ((_fdjt_debug) || (_fdjt_debug_domedits))
    fdjtLog("Inserting "+elts+" elements "
	   +"into "+elt
	   +" before "+before
	   +" starting with "+elts[0]);
  while (i<elts.length) {
    var arg=elts[i++];
    if (!(arg)) {}
    else if (arg instanceof Array) {
      var j=0; while (j<arg.length) {
	var e=arg[j++];
	if (arg) elt.insertBefore(fdjtNodify(e),before);}}
    else elt.insertBefore(fdjtNodify(arg),before);}
  return elt;
}

/* Higher level functions, use lexpr/rest/var args */

function fdjtAppend(elt_arg)
{
  var elt=null;
  if (elt_arg===null) return null;
  else if (typeof elt_arg == 'string')
    elt=document.getElementById(elt_arg);
  else if (elt_arg) elt=elt_arg;
  if (elt) return fdjtAddElements(elt,arguments,1);
  else fdjtWarn("Invalid DOM argument: "+elt_arg);
}

function fdjtPrepend(elt_arg)
{
  var elt=null;
  if (elt_arg===null) return null;
  else if (typeof elt_arg == 'string')
    elt=document.getElementById(elt_arg);
  else if (elt_arg) elt=elt_arg;
  if (elt)
    if (elt.firstChild)
      return fdjtInsertElementsBefore(elt,elt.firstChild,arguments,1);
    else return fdjtAddElements(elt,arguments,1);
  else fdjtWarn("Invalid DOM argument: "+elt_arg);
}

function fdjtInsertBefore(before_arg)
{
  var parent=null, before=null;
  if (before_arg===null) return null;
  else if (typeof before_arg == 'string') {
    before=document.getElementById(after_arg);
    if (after==null) {
      fdjtWarn("Invalid DOM before argument: "+before_arg);
      return;}}
  else before=before_arg;
  if ((before) && (before.parentNode))
    elt=before.parentNode;
  else {
    if (before===before_arg)
      fdjtWarn("Invalid DOM before argument: "+before_arg);
    else fdjtWarn("Invalid DOM before argument: "+before_arg+"="+before);
    return;}
  return fdjtInsertElementsBefore(elt,before,arguments,1);
}

function fdjtInsertAfter(after_arg)
{
  var parent=null, after=null;
  if (after_arg===null) return null;
  else if (typeof after_arg == 'string') {
    after=document.getElementById(after_arg);
    if (after==null) {
      fdjtWarn("Invalid DOM after argument: "+after_arg);
      return;}}
  else after=after_arg;
  if ((after) && (after.parentNode))
    elt=after.parentNode;
  else {
    if (after===after_arg)
      fdjtWarn("Invalid DOM after argument: "+after_arg);
    else fdjtWarn("Invalid DOM after argument: "+after_arg+"="+after);
    return;}
  if (after.nextSibling)
    return fdjtInsertElementsBefore(elt,after.nextSibling,arguments,1);
  else return fdjtAddElements(elt,arguments,1);
}

function fdjtReplace(cur_arg,newnode)
{
  var cur=null;
  if (cur_arg===null) return null;
  else if (typeof cur_arg === 'string')
    cur=document.getElementById(cur_arg);
  else cur=cur_arg;
  if (cur) {
    var parent=cur.parentNode;
    var replacement=fdjtNodify(newnode);
    parent.replaceChild(replacement,cur);
    if (typeof cur_arg === "string") {
      cur.id=null; replacement.id=cur_arg; }
    else if ((cur.id) && (!(replacement.id))) {
      replacement.id=cur.id; cur.id=null;}
    return replacement;}
  else {
    fdjtWarn("Invalid DOM replace argument: "+cur_arg);
    return;}
}

function fdjtRemove(cur_arg)
{
  var cur=null;
  if (cur_arg===null) return null;
  else if (typeof cur_arg == "string")
    cur=document.getElementById(cur_arg);
  else cur=cur_arg;
  if (cur) {
    var parent=cur.parentNode;
    parent.removeChild(cur);
    return null;}
  else {
    fdjtWarn("Invalid DOM replace argument: "+cur_arg);
    return;}
}

/* Element Creation */

function fdjtNewElement(tag,classname)
{
  var elt=document.createElement(tag);
  if (typeof classname === "string")
    elt.className=classname;
  fdjtAddElements(elt,arguments,2);
  return elt;
}

function fdjtNewElementW(tag,classname,attribs)
{
  var elt=document.createElement(tag);
  elt.className=classname;
  fdjtAddAttributes(elt,attribs);
  fdjtAddElements(elt,arguments,3);
  return elt;
}

function fdjtWithId(elt,id)
{
  elt.id=id;
  return elt;
}

function fdjtWithTitle(elt,title)
{
  elt.title=title;
  return elt;
}

function fdjtSpan(classname)
{
  if (!(classname)) classname=null;
  var elt=document.createElement('span');
  if (classname) elt.className=classname;
  fdjtAddElements(elt,arguments,1);
  return elt;
}

function fdjtSpanW(classname,attribs)
{
  var elt=document.createElement('span');
  elt.className=classname;
  fdjtAddAttributes(elt,attribs);
  fdjtAddElements(elt,arguments,2);
  return elt;
}

function fdjtDiv(classname)
{
  if (!(classname)) classname=null;
  var elt=document.createElement('div');
  if (classname) elt.className=classname;
  fdjtAddElements(elt,arguments,1);
  return elt;
}

function fdjtDivW(classname,attribs)
{
  var elt=document.createElement('div');
  elt.className=classname;
  fdjtAddAttributes(elt,attribs);
  fdjtAddElements(elt,arguments,2);
  return elt;
}

function fdjtImage(url,classname,alt)
{
  if (!(classname)) classname=null;
  var elt=document.createElement('img');
  if (classname) elt.className=classname;
  elt.src=url;
  if (typeof alt == "string") elt.alt=alt;
  return elt;
}

function fdjtImageW(url,attribs)
{
  if (!(attribs)) attribs=false;
  var elt=document.createElement('img');
  elt.src=url;
  if (attribs) fdjtAddAttributes(elt,attribs);
  return elt;
}

function fdjtAnchor(url)
{
  var elt=document.createElement('a');
  elt.href=url;
  fdjtAddElements(elt,arguments,1);
  return elt;
}

function fdjtAnchorW(url,attribs)
{
  var elt=document.createElement('a');
  elt.href=url;
  fdjtAddAttributes(elt,attribs);
  fdjtAddElements(elt,arguments,2);
  return elt;
}

function fdjtInput(type,name,value,classname)
{
  var elt=document.createElement('input');
  elt.type=type; elt.name=name; elt.value=value;
  if (classname) elt.className=classname;
  return elt;
}

function fdjtCheckbox(name,value,checked)
{
  var elt=document.createElement('input');
  elt.type='checkbox'; elt.name=name; elt.value=value;
  if (checked) elt.checked=true;
  else elt.checked=false;
  return elt;
}

/* Dealing with selections */

function fdjtGetSelection(elt)
{
  if ((elt.tagName==='INPUT') || (elt.tagName==='TEXTAREA')) {
    // fdjtLog('start='+elt.selectionStart+'; end='+elt.selectionEnd+
    //   '; value='+elt.value);
    if ((elt.value) && (elt.selectionStart) && (elt.selectionEnd) &&
	(elt.selectionStart!=elt.selectionEnd)) 
      return elt.value.slice(elt.selectionStart,elt.selectionEnd);
    else return null;}
  else if (window.getSelection)
    return window.getSelection();
  else return null;
}

/* Forcing IDs */

var _fdjt_idcounter=0, fdjt_idbase=false;

function fdjtForceId(about)
{
  if (about.id)
    return about.id;
  else {
    if (!(fdjt_idbase))
      fdjt_idbase="TMPID"+(1000000+(Math.floor((1000000-1)*Math.random())))+"S";
    var tmpid=fdjt_idbase+_fdjt_idcounter++;
    while (document.getElementById(tmpid))
      tmpid=fdjt_idbase+_fdjt_idcounter++;
    about.id=tmpid;
    return tmpid;}
}

/* Checking element visibility */

function fdjtIsVisible(elt,partial)
{
  if (!(partial)) partial=false;
  var top = elt.offsetTop;
  var left = elt.offsetLeft;
  var width = elt.offsetWidth;
  var height = elt.offsetHeight;
  var winx=window.pageXOffset;
  var winy=window.pageYOffset;
  var winxedge=winx+window.innerWidth;
  var winyedge=winy+window.innerHeight;
  
  while(elt.offsetParent) {
    elt = elt.offsetParent;
    top += elt.offsetTop;
    left += elt.offsetLeft;}

  if (partial)
    // There are three cases we check for:
    return (
	    // top of element in window
	    ((top > winy) && (top < winyedge) &&
	     (left > winx) && (left < winxedge)) ||
	    // bottom of element in window
	    ((top+height > winy) && (top+height < winyedge) &&
	     (left+width > winx) && (left+width < winxedge)) ||
	    // top above/left of window, bottom below/right of window
	    (((top < winy) || (left < winx)) &&
	     ((top+height > winyedge) && (left+width > winxedge))));
  else return (top >= window.pageYOffset &&
	       left >= window.pageXOffset &&
	       (top + height) <= (window.pageYOffset + window.innerHeight) &&
	       (left + width) <= (window.pageXOffset + window.innerWidth));
}

/* Getting cumulative offsets */

function fdgtGetOffset(elt,withstack)
{
  var top = elt.offsetTop;
  var left = elt.offsetLeft;
  var stack = ((withstack) ? (new Array(elt)) : false);
  
  while(elt.offsetParent) {
    elt = elt.offsetParent;
    if (withstack) withstack.push(elt);
    top += elt.offsetTop;
    left += elt.offsetLeft;}

  if (stack)
    return new Array(left,top,stack);
  else return new Array(left,top);
}

/* Computing "flat width" of a node */

var _fdjt_vertical_flat_width=8;
var _fdjt_vertical_tags=["P","DIV","BR","UL","LI","BLOCKQUOTE",
			 "H1","H2","H3","H4","H5","H6"];
var _fdjt_flat_width_fns={};

function _fdjt_compute_flat_width(node,sofar)
{
  if (node.nodeType===Node.ELEMENT_NODE) {
    if (typeof _fdjt_flat_width_fns[node.tagName] == "function")
      sofar=sofar+_fdjt_flat_width_fns[node.tagName];
    else if (_fdjt_vertical_tags.indexOf(node.tagName)>=0)
      sofar=sofar+_fdjt_vertical_flat_width;
    else if (fdjtHasAttrib(node,"flatwidth")) {
      var fw=node.getAttribute("flatwidth");
      if (typeof fw == "string") {
	if ((fw.length>0) && (fw[0]=='+'))
	  sofar=sofar+parseInt(fw.slice(1));
	else {
	  var fwnum=parseInt(fw);
	  if (typeof fwnum==="number") return sofar+fwnum;}}
      else if (typeof fw == "number") return sofar+fw;}
    if (node.hasChildNodes()) {
      var children=node.childNodes;
      var i=0; while (i<children.length) {
	var child=children[i++];
	if (child.nodeType===Node.TEXT_NODE)
	  sofar=sofar+child.nodeValue.length;
	else if (child.nodeType===Node.ELEMENT_NODE)
	  sofar=_fdjt_compute_flat_width(child,sofar);
	else {}}
      return sofar;}
    else if (node.offsetWidth)
      return sofar+Math.ceil(node.offsetWidth/10)+
	Math.floor(node.offsetHeight/16)*_fdjt_vertical_flat_width;
    else if (node.width)
      return sofar+Math.ceil(node.width/10)+
	Math.floor(node.height/16)*_fdjt_vertical_flat_width;
    else return sofar;}
  else if (node.nodeType===Node.TEXT_NODE)
    return sofar+node.nodeValue.length;
  else return sofar;
}

function fdjtFlatWidth(node,sofar)
{
  if (!(sofar)) sofar=0;
  return _fdjt_compute_flat_width(node,sofar);
}

/* CLeaning up markup */


/* Cleaning up headers for the HUD */

var fdjt_cleanup_tags=["A","BR","HR"];
var fdjt_cleanup_classes=[];

function _fdjt_cleanup_tags(elt,name)
{
  var toremove=fdjtGetChildrenByTagName(name);
  var i=0; while (i<toremove.length) fdjtRemove(toremove[i++]);
}

function _fdjt_cleanup_classes(elt,classname)
{
  var toremove=fdjtGetChildrenByClassName(classname);
  var i=0; while (i<toremove.length) fdjtRemove(toremove[i++]);
}

function _fdjt_cleanup_content(elt)
{
  var tagname=elt.tagName, classname=elt.className;
  if (fdjt_cleanup_tags.indexOf(tagname)>=0)
    return false;
  else if ((classname) &&
	   ((fdjt_cleanup_classes.indexOf(classname))>=0))
    return false;
  else {
    var i=0; while (i<fdjt_cleanup_tags.length)
	       _fdjt_cleanup_tags(elt,fdjt_cleanup_tags[i++]);
    i=0; while (i<fdjt_cleanup_classes.length)
	   _fdjt_cleanup_classes(elt,fdjt_cleanup_classes[i++]);
    return elt;}
}

function fdjt_cleanup_content(elt)
{
  var contents=new Array();
  var children=elt.childNodes;
  var i=0; while (i<children.length) {
    var child=children[i++];
    if (child.nodeType===1) {
      var converted=_fdjt_cleanup_content(child.cloneNode(true));
      if (converted) contents.push(converted);}
    else contents.push(child.cloneNode(true));}
  return contents;
}

/* Getting simple text */

function _fdjt_extract_strings(node,strings)
{
  if (node.nodeType===Node.TEXT_NODE) {
    var value=node.nodeValue;
    if (typeof value === "string") 
      strings.push(node.nodeValue);}
  else if (node.nodeType===Node.ELEMENT_NODE)
    if (fdjt_cleanup_tags.indexOf(node.tagName)>=0) {}
    else if ((node.className) &&
	     (fdjt_cleanup_classes.indexOf(node.className)>=0)) {}
    else if (node.hasChildNodes()) {
      var children=node.childNodes;
      var i=0; while (i<children.length) {
	var child=children[i++];
	if (child.nodeType===Node.TEXT_NODE) {
	  var value=child.nodeValue;
	  if (typeof value === "string") strings.push(value);}
	else if (child.nodeType===Node.ELEMENT_NODE)
	  _fdjt_extract_strings(child,strings);
	else {}}}
    else  {}
}

function fdjtJustText(node)
{
  var strings=new Array();
  _fdjt_extract_strings(node,strings);
  return strings.join("");
}

/* Looking up elements, CSS-style, in tables */

function fdjtLookupElement(table,elt)
{
  var tagname=elt.tagName;
  var classname=elt.className;
  var idname=elt.id;
  var probe;
  if ((idname) && (classname))
    probe=table[tagname+"."+classname+"#"+idname];
  else if (idname)
    probe=table[tagname+"#"+idname];
  else if (classname)
    probe=table[tagname+"."+classname];
  if (probe) return probe;
  if ((idname) || (classname))
    if (idname)
      probe=table[tagname+"#"+idname];
    else if (classname)
      probe=table[tagname+"."+classname];
  if (probe) return probe;
  else if (idname) probe=table["#"+idname];
  if (probe) return probe;
  else if (classname) probe=table["."+classname];
  if (probe) return probe;
  else probe=table[tagname];
  if (probe) return probe;
  else return false;
}

/* Guessing IDs to use from the DOM */

function fdjtGuessAnchor(about)
{
  /* This looks around a DOM element to try to find an ID to use as a
     target for a URI.  It especially catches the case where named
     anchors are used. */
  // console.log('Guessing anchors for '+about+' '+about.tagName);
  var probe=_fdjt_get_node_id(about);
  if (probe) return probe;
  else if (probe=_fdjt_get_parent_name(about)) return probe;
  else if (probe=_fdjt_get_node_id(fdjtNextElement(about))) return probe;
  else if (probe=_fdjt_get_node_id(fdjtPreviousElement(about))) return probe;
  else {
    var embedded_anchors=fdjtGetChildrenByTagName(about,'A');
    if (embedded_anchors==null) return null;
    var i=0;
    while (i<embedded_anchors.length) 
      if (probe=_fdjt_get_node_id(embedded_anchors[i])) return probe;
      else i++;
    return null;}
}

function _fdjt_get_node_id(node)
{
  // console.log('Checking '+node+' w/id '+node.id+' w/name '+node.name);
  if (node===null) return false;
  else if (node.id) return node.id;
  else if ((node.tagName=='A') && (node.name))
    return node.name;
  else return false;
}

function _fdjt_get_parent_name(node)
{
  var parent=node.parentNode;
  if ((parent) && (parent.tagName==='A') && (node.name))
    return node.name;
  else return false;
}

function fdjtResolveHash(eltarg)
{
  if (typeof eltarg == 'string') {
    var elt=document.getElementById(eltarg);
    if (elt) return elt;
    else {
      var elts=document.getElementsByName(eltarg);
      if ((elts) && (elts.length>0)) return elts[0];
      else return false;}}
  else return eltarg;
}

/* Searching content */

function fdjtSearchContent(node,spec,id,results)
{
  if (!(results)) results=[];
  if (!id) id=false;
  if (node.nodeType===Node.TEXT_NODE)
    if (id) 
      if (node.nodeValue.search(spec)>=0)
	results.push(id);
      else {}
    else {}
  else if (node.nodeType===Node.ELEMENT_NODE) {
    if (node.id) id=node.id;
    var children=node.childNodes;
    var i=0; while (i<children.length) {
      var child=children[i++];
      fdjtSearchContent(child,spec,id,results);}}
  else {}
  return results;
}

/* Getting anchors (making up IDs if neccessary) */

var _fdjt_idcounter=0, fdjt_idbase=false;

function fdjtGetAnchor(about)
{
  /* This does a get anchor and creates an id if neccessary */
  var probe=fdjtGuessAnchor(about);
  if (probe) return probe;
  else {
    if (!(fdjt_idbase))
      fdjt_idbase="TMPID"+(1000000+(Math.floor((1000000-1)*Math.random())))+"S";
    var tmpid=fdjt_idbase+_fdjt_idcounter++;
    while (document.getElementById(tmpid))
      tmpid=fdjt_idbase+_fdjt_idcounter++;
    about.id=tmpid;
    return tmpid;}
}

function fdjtGetAnchor(about)
{
  /* This does a get anchor and creates an id if neccessary */
  var probe=fdjtGuessAnchor(about);
  if (probe) return probe;
  else return fdjtForceId(about);
}

fdjtLoadMessage("Loaded domutils.js");

