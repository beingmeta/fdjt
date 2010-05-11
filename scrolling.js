/* -*- Mode: Javascript; -*- */

var fdjt_scrolling_id="$Id$";
var fdjt_scrolling_version=parseInt("$Revision$".slice(10,-1));

/* Copyright (C) 2001-2009 beingmeta, inc.
   This file is a part of the FDJT web toolkit (www.fdjt.org)
   This file provides DHTML handlers for a variety of UI conventions
   and interactions.

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

/* More consistent scrollintoview */

var fdjt_use_native_scroll=false;

function _fdjt_get_scroll_offset(wleft,eleft,eright,wright)
{
  var result;
  if ((eleft>wleft) && (eright<wright)) return wleft;
  else if ((eright-eleft)<(wright-wleft)) 
    return eleft-Math.floor(((wright-wleft)-(eright-eleft))/2);
  else return eleft;
}

function fdjtScrollIntoView(elt,topedge)
{
  if ((topedge!==0) && (!topedge) && (fdjtIsVisible(elt)))
    return;
  else if ((fdjt_use_native_scroll) && (elt.scrollIntoView)) {
    elt.scrollIntoView(top);
    if ((topedge!==0) && (!topedge) && (fdjtIsVisible(elt,true)))
      return;}
  else {
    var top = elt.offsetTop;
    var left = elt.offsetLeft;
    var width = elt.offsetWidth;
    var height = elt.offsetHeight;
    var winx=(window.pageXOffset||document.documentElement.scrollLeft||0);
    var winy=(window.pageYOffset||document.documentElement.scrollTop||0);
    var winxedge=winx+(document.documentElement.clientWidth);
    var winyedge=winy+(document.documentElement.clientHeight);
    
    while(elt.offsetParent) {
      elt = elt.offsetParent;
      top += elt.offsetTop;
      left += elt.offsetLeft;}

    var targetx=_fdjt_get_scroll_offset(winx,left,left+width,winxedge);
    var targety=
      (((topedge)||(topedge===0)) ?
       ((typeof topedge === "number") ? (top+topedge) : (top)) :
       (_fdjt_get_scroll_offset(winy,top,top+height,winyedge)));

    window.scrollTo(targetx,targety);}
}

/* Scrolling control */

var _fdjt_saved_scroll=false;
var _fdjt_preview_elt=false;

function fdjtScrollSave(ss)
{
  if (ss) {
    ss.scrollX=window.scrollX; ss.scrollY=window.scrollY;}
  else {
    if (!(_fdjt_saved_scroll)) _fdjt_saved_scroll={};
    _fdjt_saved_scroll.scrollX=window.scrollX;
    _fdjt_saved_scroll.scrollY=window.scrollY;}
  // fdjtXTrace("Saved scroll %o",_fdjt_saved_scroll);
}

function fdjtScrollRestore(ss)
{
  if (_fdjt_preview_elt) {
    fdjtDropClass(_fdjt_preview_elt,"previewing");
    _fdjt_preview_elt=false;}
  if ((ss) && (typeof ss.scrollX === "number")) {
    // fdjtLog("Restoring scroll to %d,%d",ss.scrollX,ss.scrollY);    
    window.scrollTo(ss.scrollX,ss.scrollY);
    return true;}
  else if ((_fdjt_saved_scroll) &&
	   ((typeof _fdjt_saved_scroll.scrollY === "number") ||
	    (typeof _fdjt_saved_scroll.scrollX === "number"))) {
    // fdjtLog("Restoring scroll to %o",_fdjt_saved_scroll);
    window.scrollTo(_fdjt_saved_scroll.scrollX,_fdjt_saved_scroll.scrollY);
    _fdjt_saved_scroll=false;
    return true;}
  else return false;
}

function fdjtScrollDiscard(ss)
{
  if (ss) {
    ss.scrollX=false; ss.scrollY=false;}
  else _fdjt_saved_scroll=false;
}

function fdjtScrollTo(target,id,context,discard,topedge)
{
  fdjtScrollDiscard(discard);
  if (id) document.location.hash=id;
  if (context) {
    setTimeout(function() {
	fdjtScrollIntoView(context,topedge);
	if (!(fdjtIsVisible(target))) {
	  fdjtScrollIntoView(target,topedge);}},
      100);}
  else setTimeout(function() {fdjtScrollIntoView(target,topedge);},100);
}

function fdjtScrollPreview(target,context,delta)
{
  /* Stop the current preview */
  if (!(target)) {
    fdjtStopPreview(); return;}
  /* Already previewing */
  if (target===_fdjt_preview_elt) return;
  if (!(_fdjt_saved_scroll)) fdjtScrollSave();
  if ((_fdjt_preview_elt) && (_fdjt_preview_elt.className))
    fdjtDropClass(_fdjt_preview_elt,"previewing");
  if (target===document.body) 
    _fdjt_preview_elt=false;
  else {
    _fdjt_preview_elt=target;
    fdjtAddClass(target,"previewing");}
  if (!(context))
    fdjtScrollIntoView(target,delta);
  else {
    fdjtScrollIntoView(context,delta);
    if (!(fdjtIsVisible(target))) {
      fdjtScrollIntoView(context);
      if (!(fdjtIsVisible(target))) 
	fdjtScrollIntoView(target);}}
}

function fdjtClearPreview()
{
  if ((_fdjt_preview_elt) && (_fdjt_preview_elt.className))
    fdjtDropClass(_fdjt_preview_elt,"previewing");
  _fdjt_preview_elt=false;
}

function fdjtSetScroll(x,y,elt)
{
  var targetx; var targety;
  var winx=(window.pageXOffset||document.documentElement.scrollLeft||0);
  var winy=(window.pageYOffset||document.documentElement.scrollTop||0);
  var winwidth=(document.documentElement.clientWidth);
  var winheight=(document.documentElement.clientHeight);
  var winxedge=winx+(document.documentElement.clientWidth);
  var winyedge=winy+(document.documentElement.clientHeight);
  if (!(elt)) {
    if (typeof x === 'number')
      if (x>0) targetx=x;
      else targetx=document.body.offsetHeight+x;
    else targetx=winx;
    if (typeof y === 'number')
      if (y>0) targety=y;
      else targety=document.body.offsetWidth+y;
    else targety=winy;}
  else {
    var top = elt.offsetTop;
    var left = elt.offsetLeft;
    var width = elt.offsetWidth;
    var height = elt.offsetHeight;
    while(elt.offsetParent) {
      elt = elt.offsetParent;
      top += elt.offsetTop;
      left += elt.offsetLeft;}
    if (typeof x === 'number') {
      if (x>0) targetx=left-x;
      else targetx=left-(winwidth+x-width);}
    else targetx=winx;
    if (typeof y === 'number') {
      if (y>0) targety=top-y;
      else targety=top-(winyheight+y-height);}
    else targety=winy;}
	     
  window.scrollTo(targetx,targety);
}

