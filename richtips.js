/* -*- Mode: Javascript; -*- */

var fdjt_richtips_id="$Id$";
var fdjt_richtips_version=parseInt("$Revision$".slice(10,-1));

/* Copyright (C) 2007-2011 beingmeta, inc.
   This file is a part of the FDJT web toolkit (www.fdjt.org)
   This file provides for mouseover tooltips with rich content

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

/* RICHTIPS
     are overlayed tooltips displayed in translucent rectangles. */

/* Set to false to suppress richtip display. */
var fdjt_display_richtips=true;
/* This is the current 'live' richtip displayed. */
var fdjt_live_richtip=false;

/* How long to wait before actually getting the richtip element */
var fdjt_richtip_delay=300;
var fdjt_richtip_pending=false;
var fdjt_richtip_timeout=null;

var fdjt_richtip_classfns={};

function fdjtFindRichTip(elt)
{
  while (elt)
    if (elt.richTip) return elt.richTip;
    else elt=elt.parentNode;
  return false;
}

function fdjtGetRichParent(elt)
{
  var richtip;
  while (elt)
    if ((elt.richTip) || (elt.getRichTip) ||
	((elt.className) && (fdjt_richtip_classfns[elt.className])))
      return elt;
    else elt=elt.parentNode;
  return null;
}

function fdjtGetRichTip(elt)
{
  var parent=fdjtGetRichParent(elt);
  var richtip=false;
  if (parent)
    if (parent.richTip) return parent.richTip;
    else if (parent.getRichTip)
      richtip=(parent.getRichTip)(elt);
    else richtip=(fdjt_richtip_classfns[parent.className])(parent);
  else return false;
  if (richtip) {
    fdjtAppend(document.body,richtip);
    parent.richTip=richtip;}
  return richtip;
}

function fdjtRichTip_display(elt)
{
  if (!(fdjt_display_richtips)) return;
  var richtip=fdjtGetRichTip(elt);
  if (!(richtip)) return;
  if (fdjt_live_richtip===richtip) {
    fdjtAddClass(fdjt_live_richtip,"live");
    return;}
  else if (fdjt_live_richtip)
    fdjtDropClass(fdjt_live_richtip,"live");
  fdjt_live_richtip=richtip;
  var xoff=0, yoff=0; var node=elt;
  while (node) {
    xoff=xoff+node.offsetLeft;
    yoff=yoff+node.offsetTop;
    node=node.offsetParent;}
  yoff=yoff+elt.offsetHeight;
  richtip.style.left=xoff+'px';
  richtip.style.top=yoff+'px';
  fdjtAddClass(richtip,"live");
  if ((xoff+richtip.offsetWidth)>(document.documentElement.clientWidth))
    xoff=xoff-((xoff+richtip.offsetWidth)-(document.documentElement.clientWidth));
  if (xoff<0) xoff=1;
  richtip.style.left=xoff+'px';
  richtip.style.top=yoff+'px';
}

function fdjtRichTip_onmouseover(evt)
{
  evt=evt||event||null;
  var target=fdjtGetRichParent($T(evt));
  if ((!(target)) && (fdjt_live_richtip)) {
    fdjtDropClass(fdjt_live_richtip,"live");
    fdjt_live_richtip=false;}
  if (fdjt_richtip_pending===target) return;
  else if (fdjt_richtip_pending) {
    clearTimeout(fdjt_richtip_timeout);
    fdjt_richtip_timeout=false;
    fdjt_richtip_pending=false;}
  if (target) {
    fdjt_richtip_pending=target;
    fdjt_richtip_timeout=
      setTimeout(function (evt) {
	  fdjtRichTip_display(target);},
	fdjt_richtip_delay);}
  else if (fdjt_live_richtip) {
    fdjtDropClass(fdjt_live_richtip,"live");
    fdjt_live_richtip=false;}
}

function fdjtRichTip_onclick(evt)
{
  evt=evt||event||null;
  var target=fdjtFindRichTip($T(evt));
  if (target) 
    if (fdjtHasClass(target,"static")) {
      fdjtDropClass(target,"static");
      fdjtDropClass(target,"live");
      fdjt_live_richtip=false;}
    else fdjtAddClass(target,"static");
  return false;
}

function fdjtRichTip_onmouseout(evt)
{
  evt=evt||event||null;
  if (!(fdjt_display_richtips)) return;
  if (fdjt_live_richtip) {
    fdjtDropClass(fdjt_live_richtip,"live");
    fdjt_live_richtip=false;}
  if (fdjt_richtip_pending) {
    clearTimeout(fdjt_richtip_timeout);
    fdjt_richtip_timeout=false;
    fdjt_richtip_pending=false;}
}

function fdjtRichTip_minimize(evt) {
  evt=evt||event||null;
  fdjtAddClass(FDJT$P(".richtip",$T(evt)),"minimized"); }

function fdjtRichTip_maximize(evt) {
  evt=evt||event||null;
  fdjtDropClass(FDJT$P(".richtip",$T(evt)),"minimized");}

function fdjtRichTip_hide(evt) {
  evt=evt||event||null;
  fdjtDropClass(FDJT$P(".richtip",$T(evt)),"static");}

function fdjtRichTip_init(elt) {
  var minbutton=fdjtImage(graphics_root+"minimize.png","minimize button","-");
  var maxbutton=fdjtImage(graphics_root+"maximize.png","maximize button","+");
  var closebutton=fdjtImage(graphics_root+"hide.png","hide button","x");
  var controls=fdjtSpan("controls",minbutton,maxbutton,closebutton);
  minbutton.onclick=fdjtRichTip_minimize;
  maxbutton.onclick=fdjtRichTip_maximize;
  closebutton.onclick=fdjtRichTip_hide;
  fdjtPrepend(elt,controls);
  return elt;}

/* Emacs local variables
;;;  Local variables: ***
;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
;;;  End: ***
*/
