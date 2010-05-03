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

var fdjtUI=
  {CoHi: {classname: "cohi"},CheckSpan: {},
   AutoPrompt: {}, InputHelp: {}};

/* Co-highlighting */
/* When the mouse moves over a named element, the 'cohi' class is added to
   all elements with the same name. */
(function(){
  var highlights={};
  function highlight(namearg,classname_arg){
    var classname=((classname_arg) || (fdjtUI.CoHi.classname));
    var newname=(namearg.name)||(namearg);
    var cur=highlights[classname];
    if (cur===newname) return;
    if (cur) {
      var drop=document.getElementsByName(cur);
      var i=0, n=drop.length;
      while (i<n) fdjtDOM.dropClass(drop[i++],classname);}
    highlights[classname]=newname||false;
    if (newname) {
      var elts=document.getElementsByName(newname);
      var n=elts.length, i=0;
      while (i<n) fdjtDOM.addClass(elts[i++],classname);}}
  
  fdjtUI.CoHi.onmouseover=function(evt,classname_arg){
    var target=fdjtDOM.T(evt);
    while (target)
      if ((target.tagName==='INPUT') || (target.tagName==='TEXTAREA') ||
	  ((target.tagName==='A') && (target.href)))
	return;
      else if (target.name) break;  
      else target=target.parentNode;
    if (!(target)) return;
    highlight(target.name,classname_arg);};
  fdjtUI.CoHi.onmouseout=function(evt,classname_arg){
    var target=fdjtDOM.T(evt);
    highlight(false,((classname_arg) || (fdjtUI.CoHi.classname)));};
 })();

/* CheckSpans:
   Text regions which include a checkbox where clicking toggles the checkbox. */
(function(){
  function checkspan_onclick(evt) {
    evt=evt||event;
    target=evt.target||evt.srcTarget;
    var checkspan=fdjtDOM.getParent(target,"checkspan");
    if ((target.tagName==='INPUT')&&(target.type=='checkbox')) {
      target.blur();
      if (target.checked) fdjtDOM.addClass(checkspan,"checked");
      else fdjtDOM.dropClass(checkspan,"checked");}
    else {
      var inputs=fdjtDOM.filterChildren
	(checkspan,function(evt){
	  return (evt.tagName==='INPUT')&&(evt.type==='checkbox');});
      var input=((inputs)&&(inputs.length)&&(inputs[0]));
      if (input) 
	if (input.checked) {
	  fdjtDOM.dropClass(checkspan,"checked");
	  input.checked=false; input.blur();}
	else {
	  fdjtDOM.addClass(checkspan,"checked");
	  input.checked=true; input.blur();}
      else fdjtDOM.toggleClass(checkspan,"checked");}}
  fdjtUI.CheckSpan.onclick=checkspan_onclick;

  function checkspan_set(checkspan,checked){
    var inputs=fdjtDOM.filterChildren
      (checkspan,function(evt){
	return (evt.tagName==='INPUT')&&(evt.type==='checkbox');});
    var input=((inputs)&&(inputs.length)&&(inputs[0]));
    if (checked) {
      input.checked=true; fdjtDOM.addClass(checkspan,"ischecked");}
    else {
      input.checked=false; fdjtDOM.dropClass(checkspan,"ischecked");}}
  fdjtUI.CheckSpan.set=checkspan_set;})();

(function(){

  function show_help_onfocus(evt){
    var target=fdjtDOM.T(evt);
    while (target)
      if ((target.nodeType==1) &&
	  ((target.tagName === 'INPUT') || (target.tagName === 'TEXTAREA')) &&
	  (target.getAttribute('HELPTEXT'))) {
	var helptext=fdjtID(target.getAttribute('HELPTEXT'));
	if (helptext) fdjtDOM.addClass(helptext,"showhelp");
	return;}
      else target=target.parentNode;}
  function autoprompt_onfocus(evt){
    evt=evt||event||null;
    var elt=fdjtDOM.T(evt);
    if ((elt) && (fdjtHasClass(elt,'isempty'))) {
      elt.value='';
      fdjtDOM.dropClass(elt,'isempty');}
    show_help_onfocus(evt);}

  function hide_help_onblur(evt){
    var target=fdjtDOM.T(evt);
    while (target)
      if ((target.nodeType==1) &&
	  ((target.tagName === 'INPUT') || (target.tagName === 'TEXTAREA')) &&
	  (target.getAttribute('HELPTEXT'))) {
	var helptext=fdjtID(target.getAttribute('HELPTEXT'));
	if (helptext) fdjtDOM.dropClass(helptext,"showhelp");
	return;}
      else target=target.parentNode;}
  function autoprompt_onblur(evt){
    var elt=fdjtDOM.T(evt);
    if (elt.value==='') {
      fdjtDOM.addClass(elt,'isempty');
      var prompt=(elt.prompt)||(elt.getAttribute('prompt'))||(elt.title);
      if (prompt) elt.value=prompt;}
    else fdjtDOM.dropClass(elt,'isempty');
    hide_help_onblur(evt);}
  
  // Removes autoprompt text from empty fields
  function autoprompt_onsubmit(arg) {
    var form=((arg.tagName==='FORM')?(arg):(fdjtDOM.T(arg||event)));
    var elements=fdjtDOM.getChildren("isempty");
    if (elements) {
      var i=0; var lim=elements.length;
      while (i<elements.length) elements[i++].value="";}}

  // Adds autoprompt handlers to autoprompt classes
  function autoprompt_setup(arg) {
    var forms=fdjtDOM.$("FORM");
    var i=0; var lim=forms.length;
    while (i<lim) {
      var form=forms[i++];
      var inputs=fdjtDOM.getChildren(form,"INPUT.autoprompt");
      if (inputs.length) {
	var j=0; var jlim=inputs.length;
	while (j<jlim) {
	  var input=inputs[j++];
	  input.addEventListener("focus",autoprompt_onfocus);
	  input.addEventListener("blur",autoprompt_onblur);}
	form.addEventListener("submit",autoprompt_onsubmit);}}}
  
  fdjtUI.AutoPrompt.onfocus=autoprompt_onfocus;
  fdjtUI.AutoPrompt.onblur=autoprompt_onblur;
  fdjtUI.AutoPrompt.onsubmit=autoprompt_onblur;
  fdjtUI.InputHelp.onfocus=show_help_onfocus;
  fdjtUI.InputHelp.onblur=hide_help_onblur;})();


/* Emacs local variables
;;;  Local variables: ***
;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
;;;  End: ***
*/
