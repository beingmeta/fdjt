/* -*- Mode: Javascript; -*- */

var fdjt_domutils_id="$Id$";
var fdjt_domutils_version=parseInt("$Revision$".slice(10,-1));

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

var _fdjt_debug_dom=false;
var _fdjt_debug_domedits=false;
var _fdjt_debug_domsearches=false;
var _fdjt_debug_classedits=false;

/* Getting elements by ID */

function $(eltarg)
{
  if (typeof eltarg == 'string')
    return document.getElementById(eltarg);
  else return eltarg;
}

/* Getting event targets */

function $T(evt)
{
  if (!(evt)) evt=event;
  return evt.target||evt.srcElement;
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

/* Getting display style information */

var fdjt_tag_display_styles={
  "DIV": "block","P": "block","LI": "list-item",
  "UL": "block","BLOCKQUOTE":"block","PRE":"block",
  "SPAN": "inline","EM": "inline","STRONG": "inline",
  "TT": "inline","DEFN": "inline","A": "inline",
  "TD": "table-cell","TR": "table-row",
  "TABLE": "table"};

function fdjtDisplayStyle(elt)
{
  return fdjt_tag_display_styles[elt.tagName]||"inline";
}

function fdjtIsBlockElt(elt)
{
  return (fdjtDisplayStyle(elt)==="block");
}

function fdjtIsTextInput(target)
{
  while (target)
    if ((target.tagName==="INPUT") ||
	(target.tagName==="TEXTAREA") ||
	(target.className==="sbooknokeys") ||
	((target.onkeypress) && (target.onkeypress!=sbook_onkeypress)))
      return true;
    else target=target.parentNode;
  return false;
}

/* DOMish utils */

// Not sure what is most portable to have as a final clause.
//  IE seems to support Element but not Node.
var fdjtNode=((typeof Node == "undefined") ?
	      ((Element) ? (Element.prototype) : (false)) :
	      (Node));

function fdjtNodify(arg)
{
  if (typeof arg === "string")
    return document.createTextNode(arg);
  else if (typeof arg != "object")
    if (arg.toString)
      return document.createTextNode(arg.toString());
    else return document.createTextNode("#@!*%!");
  else if (arg.nodeType)
    return arg;
  else if (arg.toHTML)
    return (arg.toHTML());
  else if (arg.toString)
    return fdjtSpan("nodified",arg.toString());
  else return document.createTextNode("#@!*%!");
}

// These are selectors (<tag,class,id,attrib> vectors)
//  for nodes which don't include any text.
var fdjt_notext_rules=[];

function fdjtTextify(arg,flat,inside)
{
  if (arg.nodeType)
    if (arg.nodeType===3)
      if (flat)
	return fdjtStdSpace(arg.nodeValue);
      else return arg.nodeValue;
    else if (arg.nodeType!==1) return false;
    else if ((arg.fdjtNoText) ||
	     (arg.getAttribute("NOTEXTIFY")) ||
	     (fdjtElementMatches(arg,fdjt_notext_rules))) {
      arg.fdjtNoText=true;
      return false;}
    else {
      var children=arg.childNodes;
      var display_type=fdjtDisplayStyle(arg);
      var string=""; var suffix="";
      // Figure out what suffix and prefix to use for this element
      // If inside is false, don't use anything.
      if (!(inside)) {}
      else if (!(display_type)) {}
      else if (display_type==="inline") {}
      else if (flat) suffix=" ";
      else if ((display_type==="block") ||
	       (display_type==="table")) {
	string="\n"; suffix="\n";}
      else if (display_style==="table-row") suffix="\n";
      else if (display_style==="table-cell") string="\t";
      else {}
      var i=0; while (i<children.length) {
	var child=children[i++];
	if ((child.nodeType) && (child.nodeType===3))
	  if (flat)
	    string=string+fdjtStdSpace(child.nodeValue);
	  else string=string+child.nodeValue;
	else {
	  var stringval=fdjtTextify(child,flat,true);
	  if (stringval) string=string+stringval;}}
      return string+suffix;}
  else return false;
}

function fdjtHasParent(node,parent)
{
  while (node)
    if (node===parent) return true;
    else if (node===document) return false;
    else node=node.parentNode;
  return false;
}

function fdjtHasContent(node,recur)
{
  if (node.childNodes) {
    var children=node.childNodes;
    var i=0; while (i<children.length) {
      var child=children[i++];
      if (child.nodeType===3)
	if (child.nodeValue.search(/\w/g)>=0) return true;
	else {}
      else if ((recur) && (child.nodeType===1))
	if (fdjtHasContent(child)) return true;
	else {}}
    return false;}
  else return false;
}

/* Attribute functions of various sorts */

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

function fdjtCacheAttrib(elt,attribname,xform,dflt)
{
  var aval;
  if (elt.hasOwnProperty(attribname)) return elt[attribname];
  else if ((elt.getAttribute) &&
	   (aval=elt.getAttribute(attribname))) {
    var val=((xform) ? (xform(aval)) : (aval));
    elt[attribname]=val;
    return val;}
  else if (dflt) {
    elt[attribname]=dflt;
    return dflt;}
  else return false;
}

// This takes a series of space or separated elt ids and resolves
// them
function fdjtGetIds(string)
{
  var elts=string.split(/;|\W/g);
  var results=[];
  var i=0; while (i<elts.length) {
    var elt=document.getElementById(elts[i++]);
    if (elt) results.push(elt);}
  return results;
}

// This gets a META content field
function fdjtGetMeta(name)
{
  var elts=document.getElementsByTagName("META");
  var i=0; while (i<elts.length)
	     if ((elts[i]) && (elts[i].name===name))
	       return elts[i].content;
	     else i++;
  return false;
}

/* This is a kludge to force a redisplay when the browser
   doesn't neccessarily do it automatically.  (you know who
   I'm talking about, IE!) */
function fdjtRedisplay(arg)
{
  if (!(arg)) return;
  else if (arguments.length>1) {
    var i=0; while (i<arguments.length) fdjtRedisplay(arguments[i++]);}
  else if (typeof arg === "string")
    fdjtRedisplay($(arg));
  else if (arg instanceof Array) {
    var i=0; while (i<arg.length) fdjtRedisplay(arg[i++]);}
  else if ((arg.nodeType) && (arg.nodeType===1)) {
    var oldclass=arg.className;
    arg.className=null;
    arg.className=oldclass;}
  else return;
}

/* Manipluating class names */

var _fdjt_whitespace_pat=/(\s)+/;
var _fdjt_trimspace_pat=/^(\s)+|(\s)+$/;

function _fdjtclasspat(name)
{
  if (typeof name === "string") {
    var rx=new RegExp("\\b"+name+"\\b","g");
    return rx;}
  else if (name instanceof RegExp)
    return name;
  else throw { name: "invalid class name", irritant: name};
}

function fdjtHasClass(elt,classname,attrib)
{
  var classinfo=((attrib) ? (elt.getAttribute(attrib)||"") : (elt.className));
  if ((classinfo) &&
      ((classinfo===classname) ||
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
    var classinfo=
      (((attrib) ? (elt.getAttribute(attrib)||"") :(elt.className))||null);
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
    if (attrib) {
      elt.setAttribute(attrib,newinfo);
      // This sometimes trigger a CSS update that doesn't happen otherwise
      elt.className=elt.className;}
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
    var classinfo=
      (((attrib) ? (elt.getAttribute(attrib)||"") :(elt.className))||null);
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
      if (newinfo) {
	elt.setAttribute(attrib,newinfo);
	elt.className=elt.className;}
      else if (!(keep)) {
	elt.removeAttribute(attrib);
	elt.className=elt.className;}
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
    var classinfo=
      (((attrib) ? (elt.getAttribute(attrib)||"") :(elt.className))||null);
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
    else elt.className=newinfo;
    if (attrib) elt.className=elt.className;}
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
    var classinfo=
      (((attrib) ? (elt.getAttribute(attrib)||"") :(elt.className))||null);
    var class_regex=_fdjtclasspat(classname);
    var newinfo=classinfo;
    if ((classinfo) && ((classinfo.search(class_regex))>=0)) 
      newinfo=
	classinfo.replace(class_regex,newclass).
	replace(_fdjt_whitespace_pat," ");
    else if (_fdjt_debug_dom) {
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
    else elt.className=newinfo;
    if (attrib) elt.className=elt.className;}
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
    else if (node===document) return null;
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
  if ((under.nodeType===1) && (under.tagName===tagname))
    results.push(under);
  var children=under.childNodes;
  if (children) {
    var i=0; while (i<children.length)
	       if (children[i].nodeType===1)
		 _fdjtGetChildrenByTagName(children[i++],tagname,results);
	       else i++;}
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
    else if ((scan.className) && (fdjtHasClass(scan,classname)))
      return scan;
    else if (node===document) return null;
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
  if (children) {
    var i=0; while (i<children.length)
	       if (children[i].nodeType===1)
		 _fdjtGetChildrenByClassName(children[i++],classname,results);
	       else i++;}
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
      else if (scan===document) return null;
      else parent=scan.parentNode;
  else while ((scan) && (scan.parentNode))
    if ((scan.hasAttribute) ? (scan.hasAttribute(attribName)) :
	(!(!(scan.getAttribute(attribName)))))
      return scan;
    else if (scan===document) return null;
    else scan=scan.parentNode;
  return null;
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
  if (children) {
    var i=0; while (i<children.length)
	       if (children[i].nodeType==1)
		 _fdjtGetChildrenByAttrib(children[i++],attribname,results);
	       else i++;}
  return results;
}
function _fdjtGetChildrenByAttribValue(under,attribname,attribval,results)
{
  if ((under.nodeType==1) &&
      (under.getAttribute(attribname)==attribval))
    results.push(under);
  var children=under.childNodes;
  if (children) {
    var i=0; while (i<children.length)
	       if (children[i].nodeType==1)
		 _fdjtGetChildrenByAttribValue
		   (children[i++],attribname,attribval,results);
	       else i++;}
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
  return new Array("selector",tagname,classname,idname);
}

function fdjtElementMatches(elt,selector)
{
  if (!(selector)) return false;
  else if (typeof selector === "string") {
    var spec=fdjtParseSelector(selector);
    return (((spec[1]===null) || (elt.tagName===spec[1])) &&
	    ((spec[2]===null) || (spec[2]===elt.className) ||
	     (elt.className.search(_fdjtclasspat(spec[2]))>=0)) &&
	    ((spec[3]===null) || (elt.id===spec[3])));}
  else if (!(selector instanceof Array)) return false;
  else if (selector.length===0) return false;
  else if (selector[0]==="selector") {
    var spec=selector;
    return (((spec[1]===null) || (elt.tagName===spec[1])) &&
	    ((spec[2]===null) || (spec[2]===elt.className) ||
	     (elt.className.search(_fdjtclasspat(spec[2]))>=0)) &&
	    ((spec[3]===null) || (elt.id===spec[3])));}
  else {
    var i=0; while (i<selector.length)
	       if (fdjtElementMatches(elt,selector[i]))
		 return true;
	       else i++;
    return false;}
}

function fdjtElementMatchesSpec(elt,spec)
{
  return (((spec[1]===null) || (elt.tagName===spec[1])) &&
	  ((spec[2]===null) || (spec[2]===elt.className) ||
	   (elt.className.search(_fdjtclasspat(spec[2]))>=0)) &&
	  ((spec[3]===null) || (elt.id===spec[3])));
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
      if (fdjtIndexOf(results,scan)>=0) {}
      else if (fdjtElementMatchesSpec(scan,spec)) 
	results.push(scan);
      else {}
      if (scan===document) return results;
      scan=scan.parentNode;}
    return results;}
}

function fdjtGetParent(elt,selector)
{
  var scan=elt;
  while (scan)
    if (fdjtElementMatches(scan,selector))
      return scan;
    else if (scan===document) return null;
    else scan=scan.parentNode;
  return null;
}

function fdjtGetChildren(elt,selector,results)
{
  if (!(results)) results=new Array();
  if (typeof selector === "string")
    selector=fdjtParseSelector(selector);
  if (!((typeof selector === "object") &&
	(selector instanceof Array) &&
	(selector.length>0)))
    return results;
  else if (selector[0]==="selector") {
    if (selector[3]) {
      var candidate=document.getElementById(selector[3]);
      if (candidate)
	if (fdjtElementMatchesSpec(candidate,selector)) {
	  var scan=candidate;
	  while (scan)
	    if (scan===elt) break;
	    else if (scan===document) break;
	    else scan=scan.parentNode;
	  if (scan===elt) results.push(candidate);
	  return results;}
	else return results;}
    else if (selector[2]) {
      var candidates=fdjtGetChildrenByClassName(elt,selector[2]);
      var i=0; while (i<candidates.length) {
	var candidate=candidates[i++];
	if (fdjtElementMatchesSpec(candidate,selector))
	  results.push(candidate);}
      return results;}
    else if (selector[1]) {
      var candidates=fdjtGetChildrenByTagName(elt,selector[1]);
      var i=0; while (i<candidates.length)
		 results.push(candidates[i++]);
      return results;}
    else return results;}
  else {
    var i=0; while (i<selector.length)
	       fdjtGetChildren(elt,selector[i++],results);
    return results;}
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
  var curstring=false;
  if (elt===null) return null;
  while (i<elts.length) {
    var arg=elts[i++]; 
    if (!(arg)) continue;
    else if ((typeof arg === 'string') || (typeof arg === "number")) {
      if (curstring) curstring=curstring+arg;
      else if (typeof arg === 'string') curstring=arg;
      else curstring=arg.toString();
      continue;}
    else {
      if (curstring) {
	elt.appendChild(document.createTextNode(curstring));
	curstring=false;}
      if (arg.nodeType) elt.appendChild(arg);
      else if (arg instanceof Array)
	fdjtAddElements(elt,arg,0);
      else elt.appendChild(fdjtNodify(arg));}}
  if (curstring)
    elt.appendChild(document.createTextNode(curstring));
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
  if ((_fdjt_debug_dom) || (_fdjt_debug_domedits))
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
  if ((typeof classname === "string") &&
      (classname.length>0)) {
    if (classname[0]==="#") {
      var dotpos=classname.indexOf(".");
      if (dotpos>0) {
	elt.id=classname.slice(1,dotpos);
	elt.className=classname.slice(dotpos+1).replace(/[.]/g," ");}
      else elt.id=classname.slice(1);}
    else if (classname[0]===".") {
      var hashpos=classname.indexOf("#");
      if (hashpos>0) {
	elt.id=classname.slice(hashpos+1);
	elt.className=classname.slice(1,hashpos).replace(/[.]/g," ");}
      else elt.className=classname.slice(1).replace(/[.]/g," ");}
    else elt.className=classname;}
  if (arguments.length>2)
    fdjtAddElements(elt,arguments,2);
  return elt;
}

function fdjtNewElementW(tag,classname,attribs)
{
  var elt=fdjtNewElement(tag,classname);
  fdjtAddAttributes(elt,attribs);
  if (arguments.length>3)
    fdjtAddElements(elt,arguments,3);
  return elt;
}

function fdjtNewElt(eltspec)
{
  var hashpos=eltspec.indexOf('#'); var dotpos=eltspec.indexOf('.');
  var tagend=(((hashpos>0) && (dotpos>0)&&((hashpos<dotpos)?hashpos:dotpos))
	      ||((hashpos>0) ? (hashpos) : ((dotpos>0)&&(dotpos))));
  var elt=((tagend)?
	   (fdjtNewElement(eltspec.slice(0,tagend),eltspec.slice(tagend))) :
	   (fdjtNewElement(eltspec)));
  if (arguments.length>1)
    fdjtAddElements(elt,arguments,1);
  return elt;
}

function fdjtWithId(elt,id)
{
  elt.id=id;
  return elt;
}

function fdjtId(elt,id)
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
  var elt=((classname) ?
	   (fdjtNewElement('span',classname)) :
	   (document.createElement('span')));
  fdjtAddElements(elt,arguments,1);
  return elt;
}

function fdjtSpanW(classname,attribs)
{
  var elt=fdjtNewElementW('span',classname,attribs);
  fdjtAddElements(elt,arguments,2);
  return elt;
}

function fdjtDiv(classname)
{
  var elt=((classname) ?
	   (fdjtNewElement('div',classname)) :
	   (document.createElement('div')));
  fdjtAddElements(elt,arguments,1);
  return elt;
}

function fdjtDivW(classname,attribs)
{
  var elt=fdjtNewElementW('div',classname,attribs);
  fdjtAddElements(elt,arguments,2);
  return elt;
}

function fdjtImage(url,classname,alt,title)
{
  if (!(classname)) classname=null;
  var elt=((classname) ? (fdjtNewElement("img",classname)) :
	   (document.createElement('img')));
  elt.src=url;
  if (typeof alt == "string") elt.alt=alt;
  if (title) elt.title=title;
  else if (alt) elt.title=alt;
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

function fdjtAnchorC(url,spec)
{
  var elt=fdjtNewElement("a",spec);
  elt.href=url;
  fdjtAddElements(elt,arguments,2);
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
  var elt=fdjtNewElement('INPUT',classname);
  elt.type=type; elt.name=name; elt.value=value;
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
  else return ((top > winy) && (left > winx) &&
	       (top + height) <= (winyedge) &&
	       (left + width) <= (winxedge));
}

function fdjtIsAtTop(elt,delta)
{
  if (!(delta)) delta=50;
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

  return ((top>winx) && (top<winyedge) && (top<winx+delta));
}

/* Getting cumulative offsets */

function fdjtGetOffset(elt,withstack)
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

function fdjtComputeOffsets(node,recache)
{
  if (!(node)) return node;
  else if ((!(recache)) && (node.Xoff)) return node;
  else {
    var parent=fdjtComputeOffsets(node.offsetParent,recache);
    if (parent) {
      var xoff=((node.offsetLeft)||(0))+parent.Xoff;
      var yoff=((node.offsetTop)||(0))+parent.Yoff;
      node.Xoff=xoff; node.Yoff=yoff;
      return node;}
    else {
      node.Xoff=node.offsetLeft; node.Yoff=node.offsetTop;
      return node;}}
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
      sofar=sofar+_fdjt_flat_width_fns[node.tagName](node);
    else if (fdjtIndexOf(_fdjt_vertical_tags,node.tagName)>=0)
      sofar=sofar+_fdjt_vertical_flat_width;
    else if (note.getAttribute("flatwidth")) {
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
	if (child.nodeType===3)
	  sofar=sofar+child.nodeValue.length;
	else if (child.nodeType===1)
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
  else if (node.nodeType===3)
    return sofar+node.nodeValue.length;
  else return sofar;
}

var _fdjt_tag_widths=
  {"P": 8,"DIV": 8,"BR": 8,"UL": 8,"LI": 8,"BLOCKQUOTE": 8,
   "H1": 8,"H2": 8,"H3": 8,"H4": 8,"H5": 8,"H6": 8};

function _fdjt_flat_width(node,sofar)
{
  if (node.nodeType===1) {
    var children=node.childNodes;
    sofar=sofar+_fdjt_tag_widths[node.tagName]||4;
    if (children) {
      var i=0; while (i<children.nodes) {
	var child=children[i++];
	if (child.nodeType===3)
	  sofar=sofar+child.nodeValue.length;
	else if (child.nodeType===1)
	  sofar=_fdjt_flat_width(node,sofar);
	else {}}}
    return sofar;}
  else if (child.nodeType===3)
    return sofar+child.nodeValue.length;
  else return sofar;
}

function fdjtFlatWidth(node)
{
  return _fdjt_flat_width(node,0);
}

/* Transplanting nodes */

var fdjt_transplant_rules=[];

function fdjtTransplant(orig,transplant_rules,use_defaults)
{
  if ((transplant_rules) && (fdjtElementMatches(orig,transplant_rules)))
    return false;
  else if (((!(transplant_rules)) || (use_defaults)) &&
	   (fdjtElementMatches(orig,fdjt_transplant_rules)))
    return false;
  var node=orig.cloneNode(true);
  if (transplant_rules) {
    var toremove=fdjtGetChildren(node,transplant_rules);
    var i=0; while (i<toremove.length) fdjtRemove(toremove[i++]);}
  if ((!(transplant_rules)) || (use_defaults)) {
    var toremove=fdjtGetChildren(node,fdjt_transplant_rules);
    var i=0; while (i<toremove.length) fdjtRemove(toremove[i++]);}
  return node;
}

/* Looking up elements, CSS-style, in tables */

function fdjtLookupElement(table,elt)
{
  var tagname=elt.tagName;
  var classnames=((elt.className)?(elt.className.split(' ')):new Array(false));
  var idname=elt.id;
  var probe=false;
  var i=0; while (i<classnames.length) {
    var classname=classnames[i++];
    if ((idname) && (classname))
      probe=table[tagname+"."+classname+"#"+idname];
    if (probe) return probe;
    else if ((idname) && (classname))
      probe=table["."+classname+"#"+idname];
    if (probe) return probe;
    else if (idname)
      probe=table[tagname+"#"+idname];
    if (probe) return probe;
    else if (classname)
      probe=table[tagname+"."+classname];
    if (probe) return probe;
    else if (idname)
      probe=table["#"+idname];
    if (probe) return probe;
    else if (classname)
      probe=table["."+classname];
    if (probe) return probe;
    else probe=table[tagname];
    if (probe) return probe;}
  return false;
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

/* Getting selected text */

function fdjtSelectedText()
{
  if (window.getSelection)
    return window.getSelection();
  else if (document.getSelection)
    return document.getSelection();
  else if (document.selection)
    return document.selection.createRange().text;
  else return null;
}

/* Accessing stylesheets */

function fdjtFindCSS(selector,first)
{
  var sheets=document.styleSheets;
  var rules=[];
  var i=0; while (i<sheets.length) {
    var sheet=sheets[i++];
    var rules=sheet.cssRules;
    var j=0; while (j<rules.length) {
      var rule=rules[j++];
      if (rule.selectorText.search(selector)>0)
	if (first) return new Array(rule);
	else rules.push(rule);}}
  return rules;
}

/* Searching content */

function fdjtSearchContent(node,spec,id,results)
{
  if (!(results)) results=[];
  if (!id) id=false;
  if (node.nodeType===3)
    if (id) 
      if (node.nodeValue.search(spec)>=0)
	results.push(id);
      else {}
    else {}
  else if (node.nodeType===1) {
    if (node.id) id=node.id;
    var children=node.childNodes;
    var i=0; while (i<children.length) {
      var child=children[i++];
      fdjtSearchContent(child,spec,id,results);}}
  else {}
  return results;
}

/* Accessing cookies */

function fdjtGetCookie(name,parse)
{
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
  else return decodeURIComponent(valuestring);
}

function fdjtSetCookie(name,value,expires,path,domain)
{
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
  document.cookie=cookietext;
}

function fdjtClearCookie(name,path,domain)
{
  var valuestring="ignoreme";
  var cookietext=name+"="+encodeURIComponent(valuestring)+
    "; expires=Sun 1 Jan 2000 00:00:00 UTC";
  if (path) cookietext=cookietext+"; path="+path;
  // This certainly doesn't work generally and might not work ever
  if (domain) cookietext=cookietext+"; domain="+domain;
  // fdjtTrace("Clearing cookie %o: text=%o",name,cookietext);
  document.cookie=cookietext;
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

/* Various set up things */

var fdjt_domutils_setup=false;

function fdjtDomutils_setup()
{
  if (fdjt_domutils_setup) return;
  fdjt_transplant_rules.push(fdjtParseSelector("A"));
  fdjt_transplant_rules.push(fdjtParseSelector("BR"));
  fdjt_transplant_rules.push(fdjtParseSelector("HR"));
  var textless=fdjtGetMeta("DOM:TEXTFREE");
  if (textless) {
    textless=textless.split(';');
    var i=0; while (i<textless.length) {
      var sel=fdjtParseSelector(textless[i++]);
      fdjt_transplant_rules.push(sel);
      fdjt_notext_rules.push(sel);}}
  fdjt_domutils_setup=true;
}

fdjtLoadMessage("Loaded domutils.js");

/* Emacs local variables
;;;  Local variables: ***
;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
;;;  End: ***
*/
