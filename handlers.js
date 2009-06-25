/* -*- Mode: Javascript; -*- */

var fdjt_handlers_id="$Id$";
var fdjt_handlers_version=parseInt("$Revision$".slice(10,-1));

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

var graphics_root="/graphics/";

fdjtLoadMessage("Loading handlers.js");

/* INPUT SHOWHELP */

function fdjtShowHelp_onfocus(evt)
{
  var target=evt.target;
  fdjtCheshire_stop(evt);
  while (target)
    if ((target.nodeType==1) &&
	((target.tagName === 'INPUT') || (target.tagName === 'TEXTAREA')) &&
	((target.hasAttribute) ? (target.hasAttribute('HELPTEXT')) :
	 (target.getAttribute('HELPTEXT')))) {
      var helptext=document.getElementById(target.getAttribute('HELPTEXT'));
      if (helptext) {
	if (fdjtIsBlockElt(helptext))
	  helptext.style.display='block';
	else helptext.style.display='inline';}
      return;}
    else target=target.parentNode;
}

function fdjtHideHelp_onblur(evt)
{
  var target=evt.target;
  while (target)
    if ((target.nodeType==1) &&
	((target.tagName === 'INPUT') || (target.tagName === 'TEXTAREA')) &&
	((target.hasAttribute) ? (target.hasAttribute('HELPTEXT')) :
	 (target.getAttribute('HELPTEXT')))) {
      var helptext=document.getElementById(target.getAttribute('HELPTEXT'));
      if (helptext) helptext.style.display='none';
      return;}
    else target=target.parentNode;
}

/* SHOWHIDE */

function fdjtShowHide_onclick(evt)
{
  var target=evt.target;
  fdjtCheshire_stop(evt);
  // fdjtLog('target='+target);
  while (target.parentNode) {
    var tohide=fdjtCacheAttrib(target,"clicktohide",fdjtGetIds);
    var toshow=fdjtCacheAttrib(target,"clicktoshow",fdjtGetIds);
    var totoggle=fdjtCacheAttrib(target,"clicktotoggle",fdjtGetIds);
    if (tohide) {
      var i=0; while (i<tohide.length) {
	var elt=tohide[i++]; 
	if (elt) elt.style.display='none';}}
    if (toshow) {
      var i=0; while (i<toshow.length) {
	var elt=toshow[++i]; 
	if (elt)
	  if (fdjtIsBlockElt(elt)) elt.style.display='block';
	  else elt.style.display='block';}}
    if (totoggle) {
      var i=0; while (i<totoggle.length) {
	var elt=totoggle[i++];
	if (elt) {
	  var display=elt.style.display;
	  if ((display===null) || (display===''))
	    display=window.getComputedStyle(elt,null).display;
	  if (display==='none') {
	    var style=((elt.fdjtSavedStyle) ||
		       (elt.getAttribute("DISPLAYSTYLE")) ||
		       (fdjt_tag_display_styles[elt.tagName]) ||
		       "inline");
	    elt.style.display=style;}
	  else {
	    elt.fdjtSavedStyle=elt.style.display;
	    elt.style.display='none';}
	  target.setAttribute('displayed',elt.style.display);}}}
    if ((tohide) || (toshow) || (totoggle)) {
      evt.preventDefault(); evt.cancelBubble=true;
      return false;}
    target=target.parentNode;}
}

/* SETCLEAR */

function fdjtSetClear_onclick(evt)
{
  var target=evt.target;
  fdjtCheshire_stop(evt);
  while (target.parentNode)
    if ((fdjtHasAttrib(target,'SETONCLICK'))) {
      var toset=target.getAttribute('SETONCLICK');
      var attrib=target.getAttribute('SETATTRIB');
      var val=target.getAttribute('ATTRIBVAL');
      if (val===null) val='set';
      if ((toset) && (toset!='')) toset=toset.split(',');
      else return;
      if (toset) {
	var i=0; while (i<toset.length) {
	  var elt=document.getElementById(toset[i++]);
	  if (elt===null) return;
	  if (fdjtHasAttrib(elt,attrib))
	    elt.removeAttribute(attrib);
	  else elt.setAttribute(attrib,val);}}
      return;}
    else target=target.parentNode;
}

/* Autoprompt */

function fdjtAutoPrompt_onfocus(evt)
{
  var elt=evt.target;
  fdjtCheshire_stop(evt);
  if ((elt) && (fdjtHasAttrib(elt,'isempty'))) {
    elt.value='';
    elt.removeAttribute('isempty');}
  fdjtShowHelp_onfocus(evt);
}

function fdjtAutoPrompt_onblur(evt)
{
  var elt=evt.target;
  if (elt.value==='') {
    elt.setAttribute('isempty','yes');
    var prompt=elt.getAttribute('prompt');
    if ((prompt===null) && (elt.className==='autoprompt'))
      prompt=elt.title;
    elt.value=prompt;}
  else elt.removeAttribute('isempty');
  fdjtHideHelp_onblur(evt);
}

function fdjtAutoPrompt_setup()
{
  var elements=$$('INPUT').concat($$('TEXTAREA'));
  var i=0; if (elements) while (i<elements.length) {
      var elt=elements[i++];
      if (((elt.tagName==="TEXTAREA") || (elt.type==='text')) &&
	  ((elt.className==='autoprompt') || (fdjtHasAttrib(elt,'prompt')))) {
	var prompt=elt.getAttribute('prompt');
	if (prompt===null)
	  if (fdjtHasClass(elt,'autoprompt'))
	    prompt=elt.title;
	  else continue;
	if ((elt.value=='') || (elt.value==prompt)) {
	  // fdjtLog('Marking empty');
	  elt.value=prompt;
	  elt.setAttribute('isempty','yes');}
	if ((!(elt.onfocus)) && (!(elt.getAttribute("onfocus"))))
	  elt.onfocus=fdjtAutoPrompt_onfocus;
	if ((!(elt.onblur)) && (!(elt.getAttribute("onblur"))))
	  elt.onblur=fdjtAutoPrompt_onblur;}}
}

// Removes autoprompt text from empty fields
function fdjtAutoPrompt_cleanup()
{
  var elements=$$('INPUT').concat($$('TEXTAREA'));
  var i=0; if (elements) while (i<elements.length) {
      var elt=elements[i++];
      if (fdjtHasAttrib(elt,'isempty')) elt.value="";}
}

/* Tabs */

function fdjtTab_onclick(evt,shown)
{
  if (!(shown)) shown="shown";
  fdjtCheshire_stop(evt);
  var elt=evt.target;
  if (elt) {
    while (elt.parentNode)
      if (fdjtHasAttrib(elt,"contentid")) break;
      else elt=elt.parentNode;
    if ((!(elt)) || (!(elt.getAttribute))) return;
    var select_var=elt.getAttribute('selectvar');
    var content_id=elt.getAttribute('contentid');
    var content=document.getElementById(content_id);
    var select_elt=document.getElementById(select_var+'_INPUT');
    var parent=elt.parentNode;
    var sibs=parent.childNodes;
    if (content===null) {
      fdjtLog("No content for "+content_id);
      return;}
    // evt.preventDefault(); evt.cancelBubble=true;
    // This lets forms pass tab information along
    if (select_elt) select_elt.value=content_id;
    var i=0; while (i<sibs.length) {
      var node=sibs[i++];
      if ((node.nodeType===1) && (fdjtHasAttrib(node,"contentid"))) {
	var cid=node.getAttribute('contentid');
	var cdoc=document.getElementById(cid);
	if (node===elt) {}
	else if (fdjtHasAttrib(node,shown)) {
	  node.removeAttribute(shown);
	  if (cdoc) cdoc.removeAttribute(shown);}}}
    if (fdjtHasAttrib(elt,shown))
      elt.removeAttribute(shown);
    else elt.setAttribute(shown,'yes');
    if (fdjtHasAttrib(content,shown))
      content.removeAttribute(shown);
    else content.setAttribute(shown,'yes');
    return false;}
}

/* Adding search engines */

var _fdjt_browser_coverage="Mozilla/Firefox/Netscape 6";

function fdjtAddBrowserSearchPlugin(spec,name,cat)
{
  if ((typeof window.sidebar === "object") &&
      (typeof window.sidebar.addSearchEngine === "function")) 
    window.sidebar.addSearchEngine (spec+'.src',spec+".png",name,cat);
  else alert(browser_coverage+" is needed to install a search plugin");
}

/* FLEXPAND click */

/* Enables region which expand and contract on a click. */

function fdjtFlexpand_onclick(event)
{
  var target=event.target; var functional=false;
  fdjtCheshire_stop(event);
  while (target.parentNode)
    if (fdjtHasAttrib(target,'expanded')) break;
    else if (target.tagName==='A')
      return;
    else if ((target.tagName==='SELECT') ||
	     (target.tagName==='INPUT') ||
	     (target.className=='checkspan') ||
	     (target.onclick!=null)) {
      functional=true;
      target=target.parentNode;}
    else target=target.parentNode;
  if (target) {
    if (target.getAttribute('expanded')==="yes")
      if (functional) {}
      else {
	target.setAttribute("expanded","no");
	target.style.maxHeight=null;}
    else {
      target.setAttribute("expanded","yes");
      target.style.maxHeight='inherit';}}
}

/* Closing the window */

function fdjtCloseWindow(interval)
{
  if (interval)
    window.setTimeout(_fdjt_close_window,interval*1000);
  else window.close();
}

function _fdjt_close_window(event)
{
  window.close();
}

/* checkspan handling */

function fdjtCheckSpan_onclick(event)
{
  var target=event.target; var clickinput=null;
  fdjtCheshire_stop(event);
  while (target.parentNode) {
    if (target.nodeType!=1) target=target.parentNode;
    else if (fdjtHasClass(target,'checkspan')) break;
    else if (target.tagName==='A') return;
    else if (target.tagName==='INPUT') {
      clickinput=target; target=target.parentNode;} /* return; */
    else target=target.parentNode;}
  if ((target) && (fdjtHasClass(target,'checkspan'))) {
    var children=target.childNodes;
    var i=0; while (i<children.length) {
      var child=children[i++];
      if ((child.nodeType===1) &&
	  (child.tagName==='INPUT') &&
	  ((child.type==='radio') ||
	   (child.type==='checkbox'))) {
	var checked=child.checked;
	if (child==clickinput)
	  if (typeof checked == null)
	    target.removeAttribute('ischecked');
	  else if (checked)
	    target.setAttribute('ischecked','yes');
	  else target.removeAttribute('ischecked');
	else if (typeof(checked) === null) {
	  child.checked=false;
	  target.removeAttribute('ischecked');}
	else if (checked) {
	  child.checked=false;
	  target.removeAttribute('ischecked');}
	else {
	  child.checked=true;
	  target.setAttribute('ischecked','yes');}}}}
}

function fdjtCheckSpan_setup(checkspan)
{
  if (checkspan===null) {
    var elements=fdjtGetElementsByClassName('checkspan');
    var i=0; if (elements) while (i<elements.length) {
      var checkspan=elements[i++];
      fdjtCheckSpan_setup(checkspan);}}
  else {
    var children=checkspan.childNodes;
    var j=0; while (j<children.length) {
      var child=children[j++];
      if ((child.nodeType===1) &&
	  (child.tagName==='INPUT') &&
	  ((child.type==='radio') ||
	   (child.type==='checkbox'))) {
	var checked=child.checked;
	if (checked === null) {
	  child.checked=false;
	  checkspan.removeAttribute('ischecked');}
	else if (checked) {
	  checkspan.setAttribute('ischecked','yes');}}}}
}

/* Cheshire handling */

var fdjt_cheshireelt=null;
var fdjt_cheshiresteps=false;
var fdjt_cheshirecountdown=false;
var fdjt_cheshiretimer=false;
var fdjtCheshire_finish=null;

function fdjtCheshire_handler(event)
{
  if ((fdjt_cheshiresteps) &&
      (fdjt_cheshirecountdown<=0)) {
    fdjtLog('closing window');
    clearInterval(fdjt_cheshiretimer);
    if (fdjtCheshire_finish)
      fdjtCheshire_finish();
    else window.close();}
  else if ((fdjt_cheshiresteps) &&
	   (fdjt_cheshirecountdown)) {
    fdjt_cheshirecountdown=fdjt_cheshirecountdown-1;
    var ratio=(fdjt_cheshirecountdown/fdjt_cheshiresteps)*0.8;
    // console.log('opacity='+ratio);
    fdjt_cheshireelt.style.opacity=ratio;}
  else {}
}

function fdjtCheshire_start(eltid,interval,steps)
{
  if (typeof(interval) === 'undefined') interval=30;
  if (typeof(steps) === 'undefined') steps=interval*2;
  if (typeof(eltid) === 'undefined')
     fdjt_cheshireelt=document.body;
  else if (typeof(eltid) === 'string')
    fdjt_cheshireelt=document.getElementById(eltid);
  else fdjt_cheshireelt=eltid;
  if (fdjt_cheshireelt===null) fdjt_cheshireelt=document.body;
  // fdjtLog('Starting cheshire over '+interval+' for '+steps);
  fdjt_cheshireelt.style.opacity=.80;
  fdjt_cheshiresteps=steps;
  fdjt_cheshirecountdown=steps;
  fdjt_cheshiretimer=setInterval(fdjtCheshire_handler,(1000*interval)/steps);
}

function fdjtCheshire_stop(event)
{
  if (fdjt_cheshireelt) {
    var msg_elt=document.getElementById('CHESHIREMSG');
    var alt_msg_elt=document.getElementById('CHESHIREALTMSG');
    if (msg_elt) msg_elt.style.display='none';
    if (alt_msg_elt)
      if (fdjt_block_eltp(alt_msg_elt))
	alt_msg_elt.style.display='block';
      else alt_msg_elt.style.display='inline';
    fdjt_cheshireelt.style.opacity='inherit';
    clearInterval(fdjt_cheshiretimer);
    fdjt_cheshiresteps=false;
    fdjt_cheshirecountdown=false;}
}

function fdjtCheshire_onclick(event)
{
  fdjt_stop_cheshire(event);
}

/* Text input */

function fdjtTextInput_onkeypress(evt,handler)
{
  var ch=evt.charCode, kc=evt.keyCode;
  if (kc===13) {
    var elt=evt.target;
    var val=elt.value;
    elt.value="";
    handler(val);
    return false;}
  else return;
}
function fdjtMultiText_onkeypress(evt,tagname)
{
  var enter_chars=
    fdjtCacheAttrib(evt.target,"enterchars",fdjtStringToKCodes,[-13]);
  if (!(tagname)) tagname="span";
  var ch=evt.charCode, kc=evt.keyCode;
  if ((kc===13)||
      ((enter_chars) && (enter_chars.indexOf) &&
       ((enter_chars.indexOf(ch)>=0) ||
	(enter_chars.indexOf(-kc)>=0)))) {
    var elt=evt.target; var value, new_elt;
    if (elt.value==="") return;
    if (elt.handleMultiText) 
      value=elt.handleMultiText(elt.value);
    if ((typeof value === "object") && (value.nodeType))
      new_elt=value;
    else {
      new_elt=fdjtNewElement(tagname,(elt.className||"multitext"));
      // Just in case we're combining these two functions, it doesn't
      // really make sense for the checkspan to have an autoprompt class
      fdjtDropClass(new_elt,"autoprompt");
      fdjtAddClass(new_elt,"checkspan");
      new_elt.setAttribute("ischecked","yes");
      fdjtAppend(new_elt,fdjtCheckbox(elt.name,elt.value,true));
      fdjtAppend(new_elt,elt.value);}
    fdjtInsertAfter(elt," ",new_elt);
    elt.value="";
    evt.preventDefault(); evt.cancelBubble=true;
    return false;}
  else return;
}

/* Text checking */

/* This handles automatic handling of embedded content, for
 * example tags or other markup. It creates an interval timer
 * to check for changes in the value of an input field.
 * eltid is the textfield to monitor
 * textfn is the function to parse its value
 * changefn is the function to call on the parse result when it changes
 * interval is how often to check for changes
 */
function fdjtTextract(eltid,textfn,changefn,interval)
{
  /* Default the value for interval and normalize it to
     milliseconds if it looks like its actually seconds. */
  if (interval==null) interval=4000;
  else if (interval<200) interval=interval*1000;
  var elt=document.getElementById(eltid);
  if (elt==null) return;
  var text=elt.value, parsed=textfn(text);
  if (parsed) changefn(parsed);
  // fdjtLog('Init text='+text);
  // fdjtLog('Init parsed='+parsed);
  // fdjtLog('Init interval='+interval);
  var loop_fcn=function(event) {
    if (elt.value!=text) {
      var new_parsed=textfn(elt.value);
      // console.log('New text='+elt.value);
      //console.log('New parsed='+new_parsed);
      text=elt.value;
      if (new_parsed!=parsed) {
	parsed=new_parsed;
	changefn(parsed);}}};
  window.setInterval(loop_fcn,interval);
}

/* Font size adjustment */

function fdjtAdjustFontSize(elt)
{
  var target_width=elt.getAttribute('targetwidth');
  var target_height=elt.getAttribute('targetheight');
  var actual_width=elt.clientWidth;
  var actual_height=elt.clientHeight;
  if (((target_width==null) || (actual_width<target_width)) &&
      ((target_height==null) || (actual_height<target_height)))
    return;
  var x_ratio=((target_width==null) ? (1.0) : (target_width/actual_width));
  var y_ratio=((target_height==null) ? (1.0) : (target_height/actual_height));
  var do_ratio=((x_ratio<y_ratio) ? (x_ratio) : (y_ratio));
  elt.style.fontSize=(do_ratio*100.0)+"%";
  // The code below, if it worked, would shrink and then expand the element
  // However, it doesn't work because the actual width doesn't get updated
  // automatically
  /*
  var step=(1.0-do_ratio)/5;
  var new_ratio=do_ratio;
  elt.style.fontSize=(do_ratio*100.0)+"%";
  while (((target_width==null) || (actual_width<target_width)) &&
	 ((target_height==null) || (actual_height<target_height))) {
    do_ratio=new_ratio;
    new_ratio=do_ratio+step;
    elt.style.fontSize=(do_ratio*100.0)+"%";
    actual_width=elt.clientWidth;
    actual_height=elt.clientHeight;}
  */
}

function fdjtAdjustFontSizes()
{
  var elts=fdjtGetElementsByClassName('autosize');
  if (elts) {
    var i=0; while (i<elts.length)
      fdjtAdjustFontSize(elts[i++]);}
}

/* Handling CSS based reduction: shrinking font sizes to fit */

function fdjtMarkReduced(elt)
{
  if (elt) {
    var target_width=elt.getAttribute('targetwidth');
    var target_height=elt.getAttribute('targetheight');
    var actual_width=elt.clientWidth;
    var actual_height=elt.clientHeight;
    if (((target_width===null) || (actual_width<target_width)) &&
	((target_height===null) || (actual_height<target_height)))
      return;
    else {
      var classinfo=elt.className;
      if (classinfo) 
	if (classinfo.search(/\breduced\b/)>=0) {}
	else elt.className=classinfo+' reduced';
      else elt.className='reduced';
      // fdjtLog('Reducing '+elt+' to class '+elt.className);
    }}
  else {
    var elts=fdjtGetElementsByClassName('autoreduce');
    var i=0; while (i<elts.length) fdjtMarkReduced(elts[i++]);}
}

/* Co-highlighting */

var fdjt_cohi_classname="cohighlight";
var fdjtCoHi_delay=100;
var _fdjt_cohi_elt=false;
var _fdjt_cohi_timer=false;

function fdjtCoHi_highlight(target,classname_arg)
{
  var classname=((classname_arg) || (fdjt_cohi_classname));
  if (_fdjt_cohi_elt) 
    fdjtCoHi_unhighlight(_fdjt_cohi_elt,classname);
  var cohi=((target.fdjt_cohi) || (target.getAttribute("cohi")) || (false));
  _fdjt_cohi_elt=target;
  fdjtAddClass(target,classname);
  if (cohi) fdjtAddClass(cohi,classname);
}

function fdjtCoHi_unhighlight(elt_arg,classname_arg)
{
  var elt=((elt_arg) || (_fdjt_cohi_elt));
  var classname=((classname_arg) || (fdjt_cohi_classname));
  if (elt) {
    var cohi=((elt.fdjt_cohi) || (elt.getAttribute("cohi")) || (null));
    fdjtDropClass(elt,classname);
    if (cohi) fdjtDropClass(cohi,classname);}
}

function fdjtCoHi_onmouseover(evt,classname_arg)
{
  var target=evt.target;
  while (target)
    if (target.fdjt_cohi) break;
    else if (fdjtHasAttrib(target,"cohi")) break;  
    else target=target.parentNode;
  if (!(target)) return;
  fdjtDelayHandler
    (fdjtCoHi_delay,fdjtCoHi_highlight,target,target,"cohi");
}

function fdjtCoHi_onmouseout(evt,classname_arg)
{
  var target=evt.target;
  while (target)
    if (target===_fdjt_cohi_elt) {
      fdjtDelayHandler
	(fdjtCoHi_delay,fdjtCoHi_unhighlight,target,target,"cohi");
      break;}
    else target=target.parentNode;
}

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
  if ((!topedge) && (fdjtIsVisible(elt)))
    return;
  else if ((fdjt_use_native_scroll) && (elt.scrollIntoView)) {
    elt.scrollIntoView(top);
    if ((!topedge) && (fdjtIsVisible(elt,true)))
      return;}
  else {
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

    var targetx=_fdjt_get_scroll_offset(winx,left,left+width,winxedge);
    var targety=
      ((topedge) ?
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
  if ((ss) && (ss.scrollX)) {
    // fdjtTrace("Restoring scroll to %d,%d",ss.scrollX,ss.scrollY);    
    window.scrollTo(ss.scrollX,ss.scrollY);
    return true;}
  else if ((_fdjt_saved_scroll) &&
	   ((_fdjt_saved_scroll.scrollY) ||
	    (_fdjt_saved_scroll.scrollX))) {
    // fdjtTrace("Restoring scroll to %o",_fdjt_saved_scroll);
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

function fdjtScrollTo(target,id,context)
{
  if (context) {
    fdjtScrollIntoView(context,true);
    if (!(fdjtIsVisible(target)))
      fdjtScrollIntoView(target,true);}
  else fdjtScrollIntoView(target,false);
}

function fdjtScrollPreview(target,context,delta)
{
  /* Stop the preview */
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
    fdjtScrollIntoView(target);
  else {
    fdjtScrollIntoView(context);
    if (!(fdjtIsVisible(target))) 
      fdjtScrollIntoView(target);}
}

function fdjtClearPreview()
{
  if ((_fdjt_preview_elt) && (_fdjt_preview_elt.className))
    fdjtDropClass(_fdjt_preview_elt,"previewing");
  _fdjt_preview_elt=false;
}


/* Radio Selection */

/* This is a generalization of 'radio buttons' which handle
   arbitrary elements.  This basically gives ELT the SELNAME
   class and removes the SELNAME class from all other elements
   of class RADIONAME under UNDER.  If RADIONAME is not specified,
   the RADIO attribute of UNDER is used, and if UNDER is not specified,
   UNDER is identified by searching up from ELT to find a RADIO
   attribute. */

function fdjtRadioSelect(elt,under,radioname,selname,toggle)
{
  if (!(radioname))
    if (under) radioname=((under.getAttribute("RADIO"))||("radio"));
    else {
      under=fdjtGetParentByAttrib(elt,"RADIO");
      if (under) radioname=under.getAttribute("RADIO");
      else {under=document.body; radioname="radio";}}
  else if (!(under)) {
    under=fdjtGetParentByAttrib(elt,"RADIO",radioname);
    if (!(under)) under=document.body;}
  else {}
  // fdjtTrace("RadioSelect of %o with %o/%o under %o",elt,radioname,selname,under);
  var target=fdjtGetParentByClassName(elt,radioname);
  if (!(selname)) selname="radioselected";
  if ((toggle) && (fdjtHasClass(elt,selname)))
    fdjtDropClass(elt,selname);
  else {
    var all=fdjtGetChildrenByClassName(under,radioname);
    var i=0; while (i<all.length) {
      var node=all[i++]; fdjtDropClass(node,selname);}
    fdjtAddClass(elt,selname);}
}

function fdjtRadioToggle(elt,under,radioname,selname)
{
  return fdjtRadioSelect(elt,under,radioname,selname,true);
}

/* Delaying handlers */

var fdjt_global_delays=[];

function fdjtDelayHandler(delay,handler,arg,context,delayname)
{
  if (!(context)) context=arg;
  else if (context===true) context=fdjt_global_delays;
  if (!(delayname)) delayname=handler.name||"delay";
  if (context[delayname]) {
    var info=context[delayname];
    /* Don't delay for what you're already doing. */
    if ((info.handler===handler) && (info.arg===arg))
      return;
    clearTimeout(info.timeout);
    context[delayname]=false;}
  var info={}; info.handler=handler; info.arg=arg;
  context[delayname]=info;
  info.timeout=setTimeout(function() {
      handler(arg); context[delayname]=false;},
    delay);
}

/* Checking control */

/* Some events, like onselect, don't seem to get control key information.
   This checks control key information and updates the target to reflect it.
   To cover most of the bases, this should probably be on onkeyup, onkeydown,
   and a few others.
*/

function fdjtCheckControl_onevent(evt)
{
  var target=evt.target;
  if (typeof evt.ctrlKey === 'undefined') return;
  if (evt.ctrlKey) target.setAttribute('controldown','yes');
  else target.removeAttribute('controldown');
}

function fdjtCheckShift_onevent(evt)
{
  var target=evt.target;
  if (typeof evt.shiftKey === 'undefined') return;
  if (evt.shiftKey) target.setAttribute('shiftdown','yes');
  else target.removeAttribute('shiftdown');
}

function fdjtCheckAlt_onevent(evt)
{
  var target=evt.target;
  if (typeof evt.altKey === 'undefined') return;
  if (evt.altKey) target.setAttribute('altdown','yes');
  else target.removeAttribute('altdown');
}

/* Setup */

var fdjt_setup_started=false;
var fdjt_setup_done=false;
var fdjt_setups=[];

function fdjtAddSetup(fcn)
{
  if (fdjt_setup_done) {
    if (fdjt_setups.indexOf(fcn)>=0) return;
    fdjtWarn("Running setup %o late",fcn);
    fcn();}
  else if (fdjt_setups.indexOf(fcn)<0)
    fdjt_setups.push(fcn);
  else {}
}

function fdjtSetup()
{
  if (fdjt_setup_started) return;
  fdjt_setup_started=true;
  fdjtDomutils_setup();
  fdjtAutoPrompt_setup();
  fdjtCheckSpan_setup(null);
  fdjtAdjustFontSizes();
  fdjtMarkReduced();
  var i=0; while (i<fdjt_setups.length) fdjt_setups[i++]();
  var setups=fdjtGetChildrenByClassName(document.body,"onsetup");
  var i=0; while (i<setups.length) {
    var node=setups[i++];
    if (node.onsetup) node.onsetup.call(node);
    else if (node.getAttribute("onsetup")) {
      var fn=new Function(node.getAttribute("onsetup"));
      fn.call(node);}}
  fdjt_setup_done=true;
}

fdjtLoadMessage("Loaded handlers.js");

/* Emacs local variables
;;;  Local variables: ***
;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
;;;  End: ***
*/

