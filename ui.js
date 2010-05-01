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
  {cohi: {classname: "cohi",cur: false,delay: 100},
   checkspan: {}};

/* Co-highlighting */
/* When the mouse moves over a named element, the 'cohi' class is added to
   all elements with the same name. */
(function(){
  var highlights={};
  function highlight(namearg,classname_arg){
    var classname=((classname_arg) || (fdjtUI.cohi.classname));
    var newname=((typeof namearg === 'string') ? (namearg) : (namearg.name));
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
  
  fdjtUI.cohi.onmouseover=function(evt,classname_arg){
    var target=$T(evt);
    while (target)
      if ((target.tagName==='INPUT') || (target.tagName==='TEXTAREA') ||
	  ((target.tagName==='A') && (target.href)))
	return;
      else if (target.name) break;  
      else target=target.parentNode;
    if (!(target)) return;
    highlight(target.name,classname_arg);};
  fdjtUI.cohi.onmouseout=function(evt,classname_arg){
    var target=$T(evt);
    var cur=fdjtUI.cohi.cur;
    while (target)
      if ((target.name) && (target.name===cur)) {
	if (fdjtUI.cohi.timer) clearTimeout(fdjtUI.cohi.timer);
	fdjtUI.cohi.timer=
	  setTimeout(fdjtUI.cohi.onhighlight,fdjtUI.cohi.delay,
		     target.name);
      break;}
      else target=target.parentNode;};
 })();

/* Checkspans:
   Text regions which include a checkbox where clicking toggles the checkbox. */
fdjtUI.checkspan={};
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
      var inputs=fdjtDOM.filterChildren(checkspan,function(evt){return (evt.tagName==='INPUT')&&(evt.type==='checkbox');});
      var input=((inputs)&&(inputs.length)&&(inputs[0]));
      if (input) 
	if (input.checked) {
	  fdjtDOM.dropClass(checkspan,"checked");
	  input.checked=false; input.blur();}
	else {
	  fdjtDOM.addClass(checkspan,"checked");
	  input.checked=true; input.blur();}
      else fdjtDOM.toggleClass(checkspan,"checked");}}
  fdjtUI.checkspan.onclick=checkspan_onclick;})();

/* Emacs local variables
;;;  Local variables: ***
;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
;;;  End: ***
*/
