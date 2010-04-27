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

function fdjtDOM(spec){
  var node;
  if (typeof spec==='string') {
    var hashpos=spec.indexOf('#');
    var dotpos=spec.indexOf('.');
    var tagend=((hashpos<0)?(dotpos):
		(dotpos<0)?(hashpos):
		(dotpos<hashpos)?(dotpos):(hashpos));
    if (tagend<0)
      node=document.createElement(spec);
    else node=document.createElement(spec.slice(0,tagend));
    if (hashpos>=0)
      if ((dotpos)&&(dotpos>hashpos)) {
	node.id=spec.slice(hashpos+1,dotpos);
	spec=spec.slice(0,hashpos)+spec.slice(dotpos);}
      else {
	node.id=spec.slice(hashpos+1);
	spec=spec.slice(0,hashpos);}
    dotpos=spec.indexOf('.');
    if (dotpos>=0)
      node.className=spec.slice(dotpos+1).replace('.',' ');
    else node.className=spec.replace('.',' ');}
  else {
    node=document.createElement(attrib.tagName);
    for (attrib in spec) {
      if (attrib==="tagName") {}
      else node.setAttribute(attrib,spec[attrib]);}}
  var i=1; var len=arguments.length;
  while (i<len) {
    var arg=arguments[i++];
    if (!(arg)) {}
    else if (typeof arg === 'string')
      node.appendChild(document.createTextNode(arg));
    else if (arg.nodeType)
      node.appendChild(arg);
    else if (arg.toString)
      node.appendChild(document.createTextNode(arg.toString()));
    else try {
	node.appendChild(document.createTextNode(""+arg));}
      catch (e) {
	node.appendChild(document.createTextNode("??"));}}
  return node;}
fdjtDOM.revid="$Id$";
fdjtDOM.version=parseInt("$Revision$".slice(10,-1));

fdjtDOM.classpats={};
fdjtDOM.classPat=function(name){
  var rx=new RegExp("\\b"+name+"\\b","g");
  fdjtDOM.classpats[name]=rx;
  return rx;};

fdjtDOM.hasClass=function(elt,classname,attrib){
  var classinfo=((attrib) ? (elt.getAttribute(attrib)||"") : (elt.className));
  if (!(classinfo)) return false;
  else if (classinfo===classname) return true;
  else if (typeof classname === 'string')
    if (classinfo.indexOf(' ')<0) return false;
    else classname=fdjtDOM.classpats[classname]||
	   fdjtDOM.classPat(classname);
  else {}
  if (classinfo.search(classname)>=0) return true;
  else return false;};

fdjtDOM.addClass=function(elt,classname,attrib){
  var classinfo=
  (((attrib) ? (elt.getAttribute(attrib)||"") :(elt.className))||null);
  if (!(classinfo)) {
    elt.className=classname; return true;}
  var class_regex=fdjtDOM.classpats[classname]||fdjtDOM.classPat(classname);
  var newinfo=classinfo;
  if (classinfo===classname) return false;
  else if (classinfo.search(class_regex)>=0) return false;
  else newinfo=classname+" "+classinfo;
  if (attrib) {
    elt.setAttribute(attrib,newinfo);
    // This sometimes trigger a CSS update that doesn't happen otherwise
    elt.className=elt.className;}
  else elt.className=newinfo;
  return true;};

fdjtDOM.classAdder=function(elt,classname){
  return function() {
    if (elt) fdjtDOM.addClass(elt,classname);}};

fdjtDOM.dropClass=function(elt,classname,attrib){
    var classinfo=
      (((attrib) ? (elt.getAttribute(attrib)||"") :(elt.className))||null);
    if (!(classinfo)) return false;
    var class_regex=
    ((typeof classname === 'string')?
     (fdjtDOM.classpats[classname]||fdjtDOM.classPat(classname)):
     classname);
    var newinfo=classinfo;
    if (classinfo===classname) 
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
    else elt.className=newinfo;
    return true;};

fdjtDOM.classDropper=function(elt,classname){
  return function() {
    if (elt) fdjtDOM.dropClass(elt,classname);}};

fdjtDOM.hasParent=function(elt,parent,attrib){
  if ((typeof parent === 'string')||(!(parent.nodeType))) {
    var scan=elt;
    var pat=((typeof parent === 'string')?
	     (fdjtDOM.classpats[parent]||fdjtDOM.classPat(parent)):
	     parent);
    while (scan)
      if ((scan.className)&&(scan.className.search(pat)>=0))
	return scan;
      else scan=scan.parentNode;
    return false;}
  else {
    while (elt=elt.parentNode) {
      if (elt===parent) return parent;}
    return false;}};

fdjtDOM.IsClickable.=function(target){
  while (target)
    if (((target.tagName==='A')&&(target.href))||
	(target.tagName==="INPUT") ||
	(target.tagName==="TEXTAREA") ||
	(target.tagName==="SELECT") ||
	(target.tagName==="OPTION") ||
	(fdjtDOM.hasClass(target,"fdjtclickable")))
      return true;
    else target=target.parentNode;
  return false;};

fdjtDOM.display_styles={
  "DIV": "block","P": "block","BLOCKQUOTE":"block",
  "H1": "block","H2": "block","H3": "block","H4": "block",
  "H5": "block","H6": "block","H7": "block","H8": "block",
  "UL": "block","LI": "list-item",
  "DL": "block","DT": "list-item","DD": "list-item",
  "SPAN": "inline","EM": "inline","STRONG": "inline",
  "TT": "inline","DEFN": "inline","A": "inline",
  "TD": "table-cell","TR": "table-row",
  "TABLE": "table", "PRE": "preformatted"};

fdjtDOM.getDisplay=function(elt){
  return (((window.getComputedStyle)&&(window.getComputedStyle(elt,null))&&
	   (window.getComputedStyle(elt,null).display))||
	  (fdjtDOM.display_styles[elt.tagName])||
	  "inline");};

fdjtDOM.textify=function(arg,flat,inside){
  if (arg.text) return arg.text;
  else if (arg.nodeType)
    if (arg.nodeType===3) return arg.nodeValue;
    else if (arg.nodeType===1) {
      var children=arg.childNodes;
      var display_type=fdjtDOM.getDisplay(arg);
      var string=""; var suffix="";
      // Figure out what suffix and prefix to use for this element
      // If inside is false, don't use anything.
      if (!(inside)) {}
      else if (!(display_type)) {}
      else if (display_type==="inline") {}
      else if (flat) suffix=" ";
      else if ((display_type==="block") ||
	       (display_type==="table") ||
	       (display_type==="preformatted")) {
	string="\n"; suffix="\n";}
      else if (display_type==="table-row") suffix="\n";
      else if (display_type==="table-cell") string="\t";
      else {}
      var i=0; while (i<children.length) {
	var child=children[i++];
	if ((child.nodeType) && (child.nodeType===3))
	  if (flat)
	    string=string+fdjtFlatten(child.nodeValue);
	  else string=string+child.nodeValue;
	else {
	  var stringval=fdjtTextify(child,flat,true);
	  if (stringval) string=string+stringval;}}
      return string+suffix;}
    else {}
  else if (arg.toString)
    return arg.toString();
  else return arg.toString();};

fdjtDOM.cancel=function(evt){
  evt=evt||event;
  if (evt.preventDefault) evt.preventDefault();
  else evt.returnValue=false;
  evt.cancelBubble=true;};

/* Emacs local variables
;;;  Local variables: ***
;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
;;;  End: ***
*/
