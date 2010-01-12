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
  evt=evt||event||null;
  var target=$T(evt);
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
  evt=evt||event||false;
  var target=$T(evt);
  while (target)
    if ((target.nodeType==1) &&
	((target.tagName === 'INPUT') || (target.tagName === 'TEXTAREA')) &&
	((target.hasAttribute) ? (target.hasAttribute('HELPTEXT')) :
	 (target.getAttribute('HELPTEXT')))) {
      var helptext=document.getElementById(target.getAttribute('HELPTEXT'));
      if (helptext) {
	setTimeout(function() {if (helptext) helptext.style.display='none';},300);}
      return;}
    else target=target.parentNode;
}

/* SHOWHIDE */

function fdjtShowHide_onclick(evt)
{
  evt=evt||event||false;
  var target=$T(evt);
  fdjtCheshire_stop(evt);
  // fdjtLog('target='+target);
  while (target.parentNode) {
    var tohide=fdjtCacheAttrib(target,"clicktohide",fdjtSemiSplit);
    var toshow=fdjtCacheAttrib(target,"clicktoshow",fdjtSemiSplit);
    var totoggle=fdjtCacheAttrib(target,"clicktotoggle",fdjtSemiSplit);
    if (tohide) {
      var i=0; while (i<tohide.length) {
	var elt=document.getElementById(tohide[i++]); 
	if (elt) elt.style.display='none';}}
    if (toshow) {
      var i=0; while (i<toshow.length) {
	var elt=document.getElementById(toshow[++i]);
	if (elt)
	  if (fdjtIsBlockElt(elt)) elt.style.display='block';
	  else elt.style.display='block';}}
    if (totoggle) {
      var i=0; while (i<totoggle.length) {
	var elt=document.getElementById(totoggle[i++]);
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
      if (evt.preventDefault) evt.preventDefault(); else evt.returnValue=false;
      evt.cancelBubble=true;
      return false;}
    target=target.parentNode;}
}

/* SETCLEAR */

function fdjtSetClear_onclick(evt)
{
  evt=evt||event||null;
  var target=$T(evt);
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
  evt=evt||event||null;
  var elt=$T(evt);
  fdjtCheshire_stop(evt);
  if ((elt) && (fdjtHasAttrib(elt,'isempty'))) {
    elt.value='';
    elt.removeAttribute('isempty');}
  fdjtShowHelp_onfocus(evt);
}

function fdjtAutoPrompt_onblur(evt)
{
  evt=evt||event||null;
  var elt=$T(evt);
  if (elt.value==='') {
    elt.setAttribute('isempty','yes');
    var prompt=(elt.prompt)||(elt.getAttribute('prompt'));
    if ((prompt===null) && (elt.className==='autoprompt'))
      prompt=elt.title;
    elt.value=prompt;}
  else elt.removeAttribute('isempty');
  fdjtHideHelp_onblur(evt);
}

function fdjtAutoPrompt_setup(elt)
{
  if (!(elt)) elt=document.body;
  var elements=$$('INPUT',elt).concat($$('TEXTAREA',elt));
  var i=0; if (elements) while (i<elements.length) {
      var elt=elements[i++];
      if (((elt.tagName==="TEXTAREA") ||
	   ((elt.tagName==="INPUT") && (elt.type==='text'))) &&
	  ((fdjtHasClass(elt,'autoprompt')) ||
	   (elt.prompt) || (fdjtHasAttrib(elt,'prompt')))) {
	var prompt=(elt.prompt)||elt.getAttribute('prompt');
	if (!(prompt))
	  if (fdjtHasClass(elt,'autoprompt'))
	    prompt=elt.title;
	  else continue;
	if (prompt)
	  if ((!(elt.value)) || (elt.value=='') || (elt.value===prompt)) {
	    elt.value=prompt;
	    elt.setAttribute('isempty','yes');
	    fdjtRedisplay(elt);}
	if ((!(elt.onfocus)) && (!(elt.getAttribute("onfocus"))))
	  elt.onfocus=fdjtAutoPrompt_onfocus;
	if ((!(elt.onblur)) && (!(elt.getAttribute("onblur"))))
	  elt.onblur=fdjtAutoPrompt_onblur;}}
}

// Removes autoprompt text from empty fields
function fdjtAutoPrompt_cleanup(form)
{
  var elements=((form) ?
		($$('INPUT',form).concat($$('TEXTAREA',form))) :
		($$('INPUT').concat($$('TEXTAREA'))));
  var i=0; if (elements) while (i<elements.length) {
      var elt=elements[i++];
      if (fdjtHasAttrib(elt,'isempty')) elt.value="";}
}

/* Tabs */

function fdjtTab_onclick(evt,shown)
{
  if (!(shown)) shown="shown";
  fdjtCheshire_stop(evt);
  var elt=$T(evt);
  if (elt) {
    while (elt.parentNode)
      if (fdjtHasAttrib(elt,"contentid")) break;
      else elt=elt.parentNode;
    if ((!(elt)) || (!(elt.getAttribute))) return;
    var select_var=elt.getAttribute('selectvar');
    var tabcookie=elt.getAttribute('tabcookie');
    var content_id=elt.getAttribute('contentid');
    var content=document.getElementById(content_id);
    var select_elt=document.getElementById(select_var+'_INPUT');
    var parent=elt.parentNode;
    var sibs=parent.childNodes;
    var tabdomain=false; var tabpath=false;
    if (parent.getAttribute('tabcookies')) {
      var tcinfo=parent.getAttribute('tabcookies');
      var slashpos=tcinfo.indexOf('/');
      if (slashpos) {
	tabdomain=tcinfo.slice(0,slashpos);
	tabpath=tcinfo.slice(0,slashpos);}
      else tabdomain=tcinfo;}
    if (content===null) {
      fdjtLog("No content for "+content_id);
      return;}
    // if (evt.preventDefault) evt.preventDefault(); else evt.returnValue=false; 
    // evt.cancelBubble=true;
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
	  if (cdoc) {
	    cdoc.removeAttribute(shown);
	    cdoc.className=cdoc.className;}
	  fdjtRedisplay(node,cdoc);}}}
    if (fdjtHasAttrib(elt,shown))
      elt.removeAttribute(shown);
    else elt.setAttribute(shown,'yes');
    if (fdjtHasAttrib(content,shown))
      content.removeAttribute(shown);
    else content.setAttribute(shown,'yes');
    if (tabcookie) {
      var eqpos=tabcookie.indexOf('=');
      if (eqpos<0) fdjtSetCookie(tabcookie,cid);
      else fdjtSetCookie(tabcookie.slice(0,eqpos),
			 tabcookie.slice(eqpos+1),
			 false,tabdomain,tabpath);}
    // Force a redisplay on CSS-challenged browsers
    fdjtRedisplay(elt,content);
    return false;}
}

function fdjtSelectTab(tabbar,contentid)
{
  var tabs=$$(".tab",tabbar);
  var i=0; while (i<tabs.length) {
    var tab=tabs[i++];
    if (tab.getAttribute("contentid"))
      if ((tab.getAttribute("contentid"))===contentid)
	tab.setAttribute("shown","shown");
      else if (tab.getAttribute("shown")) {
	var cid=tab.getAttribute("contentid");
	var content=$(cid);
	tab.removeAttribute("shown");
	if (!(content))
	  fdjtWarn("No reference for tab content %o",cid);
	else content.removeAttribute("shown");}
      else tab.removeAttribute("shown");}
  if ($(contentid))
    $(contentid).setAttribute("shown","shown");
  else fdjtWarn("No reference for tab content %o",contentid);
}

function fdjtSelectedTab(tabbar)
{
  var tabs=$$(".tab",tabbar);
  var i=0; while (i<tabs.length) {
    var tab=tabs[i++];
    if (tag.getAttribute("shown"))
      return tag.getAttribute("contentid");}
  return false;
}

/* Anchor submit buttons */

function fdjtAnchorSubmit_onclick(evt)
{
  var target=evt.target;
  var anchor=fdjtGetParentByTagName(target,'a');
  var form=fdjtGetParentByTagName(anchor,'form');
  if (anchor.getAttribute("NAME"))
    form.appendChild
      (fdjtInput("HIDDEN",anchor.getAttribute("NAME"),
		 anchor.getAttribute("VALUE")));
  // This should really come up with some way to run the onsbumit
  // handler
  fdjtAutoPrompt_cleanup(form);
  return form.submit();
}

function fdjtAnchorSubmit_setup(root)
{
  root=root||document.body;
  var asubmit=fdjtGetChildrenByClassName(root,"fdjtsubmit");
  var i=0; while (i<asubmit.length)
	     asubmit[i++].onclick=fdjtAnchorSubmit_onclick;
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

function fdjtCheckSpan(varname,value,checked,title)
{
  var checkbox=fdjtInput("CHECKBOX",varname,value);
  var checkspan=fdjtSpan("checkspan");
  if (checked) {
    checkspan.setAttribute('ischecked','true');
    checkbox.checked=true;}
  else {
    checkbox.checked=false;}
  checkspan.onclick=fdjtCheckSpan_onclick;
  var elements=[]; var checkbox_added=false;
  var i=4; while (i<arguments.length) {
    var arg=arguments[i++];
    if (arg===true) {
      elements.push(checkbox);
      checkbox_added=true;}
    else elements.push(arg);}
  if (!(checkbox_added)) fdjtAppend(checkspan,checkbox);
  if (elements.length)
    fdjtAddElements(checkspan,elements);
  else fdjtAppend(checkspan,value);
  if (title) checkspan.title=title;
  return checkspan;
}

function fdjtCheckSpan_update(checkspan,checked)
{
  var inputs=fdjtGetChildrenByTagName(checkspan,'INPUT');
  var checkspans=fdjtGetChildrenByClassName(checkspan,"checkspan");
  if (checked)
    checkspan.setAttribute('ischecked','true');
  else checkspan.removeAttribute('ischecked');
  {var i=0; while (i<inputs.length) {
      var input=inputs[i++];
      if ((input.type==='radio') || (input.type==='checkbox'))
	input.checked=checked;
      else i++;}}
  {var i=0; while (i<checkspans.length) {
      if (checked)
	checkspans[i++].setAttribute('ischecked','true');
      else checkspans[i++].removeAttribute('ischecked');}}
}

function fdjtCheckSpan_onclick(evt)
{
  evt=evt||event||null;
  var target=$T(evt); var checkspan=$P(".checkspan",target);
  fdjtCheshire_stop(evt);
  while (target.parentNode) {
    if (target.nodeType!=1) target=target.parentNode;
    else if (fdjtHasClass(target,'checkspan')) break;
    else if (target.tagName==='A') return;
    else if (target.tagName==='INPUT') return;
    else target=target.parentNode;}
  if (!((target) && (fdjtHasClass(target,'checkspan')))) return;
  var inputs=fdjtGetChildrenByTagName(target,'INPUT');
  var i=0; while (i<inputs.length) {
    var input=inputs[i++];
    if ((input.type==='radio') || (input.type==='checkbox'))
      if (input.checked)
	return fdjtCheckSpan_update(checkspan,false);
      else return fdjtCheckSpan_update(checkspan,true);
    else i++;}
}

function fdjtCheckSpan_onchange(evt)
{
  evt=evt||event||null;
  var target=$T(evt); var checkspan=$P(".checkspan",target);
  fdjtCheckSpan_update(checkspan,target.checked);
  $T(evt).blur();
}

function fdjtCheckSpan_old_onclick(event)
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
  if (!(checkspan)) {
    var elements=fdjtGetElementsByClassName('checkspan');
    var i=0; if (elements) while (i<elements.length) {
	var checkspan=elements[i++];
	fdjtCheckSpan_setup(checkspan);}}
  else {
    var checkspans=((fdjtHasClass(checkspan,"checkspan"))?
		    (new Array(checkspan)):
		    (fdjtGetElementsByClassName('checkspan',checkspan)));
    var i=0; while (i<checkspans.length) {
      var checkspan=checkspans[i++];
      if (!(checkspan.onclick)) checkspan.onclick=fdjtCheckSpan_onclick;
      var inputs=fdjtGetElementsByTagName("INPUT",checkspan);
      var j=0; while (j<inputs.length) {
	var input=inputs[j++];
	if ((input.type==='radio')||(input.type==='checkbox')) {
	  var checked=input.checked;
	  if (checked === null) {
	    child.checked=false;
	    checkspan.removeAttribute('ischecked');}
	  else if (checked) {
	    checkspan.setAttribute('ischecked','yes');}
	  else checkspan.removeAttribute('ischecked');
	  break;}}}}
}

/* Class toggling */

function fdjtToggleClass_onclick(evt)
{
  evt=(evt)||(event);
  if ((evt.target)&&(evt.target.getAttribute)&&
      (evt.target.getAttribute("toggle"))) {
    var toggle=evt.target.getAttribute("toggle");
    var eqpos=toggle.indexOf('=');
    var elt=$(toggle.slice(0,eqpos));
    var classname=toggle.slice(eqpos+1);
    if ((elt)&&(classname)) fdjtToggleClass(elt,classname);}
}

/* Flashing */

/* This is intended for translucent entities which get rendered
   temporarily opaque for a time, typically when they change. */

function fdjtFlash(elt,milliseconds,opacity)
{
  elt=$(elt);
  if (typeof opacity === 'string') {
    fdjtAddClass(elt,opacity);
    setTimeout(function() {fdjtDropClass(elt,opacity);},milliseconds);}
  else {
    var oldopacity=elt.style.opacity;
    elt.style.opacity=opacity;
    setTimeout(function() {elt.style.opacity=oldopacity;},milliseconds);}
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
    var elt=$T(evt);
    var val=elt.value;
    elt.value="";
    handler(val);
    return false;}
  else return;
}
function fdjtMultiText_onkeypress(evt,tagname)
{
  var enter_chars=
    fdjtCacheAttrib($T(evt),"enterchars",fdjtStringToKCodes,[-13]);
  if (!(tagname)) tagname="span";
  var ch=evt.charCode, kc=evt.keyCode;
  if ((kc===13)||
      ((enter_chars) && (enter_chars.indexOf) &&
       ((enter_chars.indexOf(ch)>=0) ||
	(enter_chars.indexOf(-kc)>=0)))) {
    var elt=$T(evt); var value, new_elt;
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
    if (evt.preventDefault) evt.preventDefault(); else evt.returnValue=false;
    evt.cancelBubble=true;
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

var fdjt_cohi_classname="cohi";
var fdjt_trace_cohi=false;
var _fdjt_cohi_name=false;

function fdjtCoHi_highlight(namearg,classname_arg)
{
  var classname=((classname_arg) || (fdjt_cohi_classname));
  var newname=((typeof namearg === 'string') ? (namearg) : (namearg.name));
  if (_fdjt_cohi_name===newname) return;
  if (fdjt_trace_cohi)
    fdjtLog("[%fs] Changing '%s' highlight from %o to %o",
	    fdjtElapsedTime(),classname,_fdjt_cohi_name,(newname||"false"));
  if (_fdjt_cohi_name) {
    var drop=document.getElementsByName(_fdjt_cohi_name);
    var i=0, n=drop.length;
    if (fdjt_trace_cohi)
      fdjtLog("[%fs] Uncohighlighting %d elements named %s with '%s'",
	      fdjtElapsedTime(),n,_fdjt_cohi_name,classname);
    while (i<n) fdjtDropClass(drop[i++],classname);}
  _fdjt_cohi_name=newname||false;
  if (newname) {
    var elts=document.getElementsByName(newname);
    var n=elts.length, i=0;
    if (fdjt_trace_cohi)
      fdjtLog("[%fs] Cohlighting %d elements named %s with '%s'",
	      fdjtElapsedTime(),n,newname,classname);
    while (i<n) fdjtAddClass(elts[i++],classname);}
}

var fdjtCoHi_delay=100;
var _fdjt_cohi_timer={};

function fdjtCoHi_onmouseover(evt,classname_arg)
{
  var target=$T(evt);
  while (target)
    if ((target.tagName==='INPUT') || (target.tagName==='TEXTAREA') ||
	((target.tagName==='A') && (target.href)))
      return;
    else if (target.name) break;  
    else target=target.parentNode;
  if (!(target)) return;
  fdjtDelayHandler(fdjtCoHi_delay,fdjtCoHi_highlight,target.name,_fdjt_cohi_timer);
}

function fdjtCoHi_onmouseout(evt,classname_arg)
{
  var target=$T(evt);
  while (target)
    if ((target.name) && (target.name===_fdjt_cohi_name)) {
      fdjtDelayHandler(fdjtCoHi_delay,fdjtCoHi_highlight,false,_fdjt_cohi_timer);
      break;}
    else target=target.parentNode;
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
  // fdjtLog("RadioSelect of %o with %o/%o under %o",elt,radioname,selname,under);
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

var fdjt_trace_delays=false;
var fdjt_global_delays=[];

function fdjtDelayHandler(delay,handler,arg,context,delayname)
{
  if (!(context)) context=arg;
  else if (context===true) context=fdjt_global_delays;
  if (!(delayname)) delayname=handler.name||"delay";
  if (context[delayname]) {
    var info=context[delayname];
    /* Don't delay for what you're already doing. */
    if ((info.handler===handler) && (info.arg===arg)) {
      if (fdjt_trace_delays) {
	var now=new Date();
	fdjtLog("(%s:%dms) Alreadying delaying #%o from %o:%o %o of %o with %o",
		now.toLocaleTimeString(),now.getTime(),
		info.timeout,info.start.toLocaleTimeString(),info.start.getTime(),
		(info.handler.name||info.handler),info.arg,info,info.start,
		delayname,context);}
      return;}
    if (fdjt_trace_delays)
      fdjtLog("Clearing delay %o[%o]=%o %o(%o)",
	      context,delayname,info,info.handler,info.arg);
    clearTimeout(info.timeout);
    context[delayname]=false;}
  var info={}; info.handler=handler; info.arg=arg; info.start=new Date();
  context[delayname]=info;
  info.timeout=setTimeout(function() {
      if (fdjt_trace_delays) {
	var now=new Date();
	fdjtLog("(%s:%d(e)) Gratifying delay #%o after %oms %o of %o info=%o %o(%o)",
		now.toLocaleTimeString(),fdjtElapsedTime(now),
		info.timeout,now.getTime()-info.start.getTime(),
		context,delayname,
		info,(info.handler.name||info.handler),info.arg);}
      context[delayname]=false;
      handler(arg);},
    delay);
  if (fdjt_trace_delays)
    fdjtLog("(%s:%dms) Set delay [#%o:%oms] %o on %o; info=%o %o(%o)",
	    info.start.toLocaleTimeString(),info.start.getTime(),
	    info.timeout,delay,delayname,context,
	    info,info.handler,info.arg);
}

/* Gradual transformation */

function fdjtGradually(nsteps,interval,startval,endval,stepfn)
{
  var args=[]; var timer;
  var delta=(endval-startval)/nsteps; 
  var val=startval; args.push(startval);
  var i=5; while (i<arguments.length) args.push(arguments[i++]);
  stepfn.apply(this,args);
  timer=window.setInterval(function() {
      val=val+delta;
      if (((delta<0) && (val<endval)) ||
	  ((delta>0) && (val>endval))) {
	args[0]=false; stepfn.apply(this,args);
	clearInterval(timer);}
      else {
	args[0]=val; stepfn.apply(this,args);}},
    interval);
  return timer;
}

/* Checking control */

/* Some events, like onselect, don't seem to get control key information.
   This checks control key information and updates the target to reflect it.
   To cover most of the bases, this should probably be on onkeyup, onkeydown,
   and a few others.
*/

function fdjtCheckControl_onevent(evt)
{
  evt=evt||event||null;
  var target=$T(evt);
  if (typeof evt.ctrlKey === 'undefined') return;
  if (evt.ctrlKey) target.setAttribute('controldown','yes');
  else target.removeAttribute('controldown');
}

function fdjtCheckShift_onevent(evt)
{
  evt=evt||event||null;
  var target=$T(evt);
  if (typeof evt.shiftKey === 'undefined') return;
  if (evt.shiftKey) target.setAttribute('shiftdown','yes');
  else target.removeAttribute('shiftdown');
}

function fdjtCheckAlt_onevent(evt)
{
  evt=evt||event||null;
  var target=$T(evt);
  if (typeof evt.altKey === 'undefined') return;
  if (evt.altKey) target.setAttribute('altdown','yes');
  else target.removeAttribute('altdown');
}

function fdjtCancelBubble(evt)
{
  evt=evt||event||null;
  evt.cancelBubble=true;
}

/* Setup */

function fdjtNodeSetup()
{
  var setups=fdjtGetChildrenByClassName(document.body,"onsetup");
  var i=0; while (i<setups.length) {
    var node=setups[i++];
    if (node.onsetup) node.onsetup.call(node);
    else if (node.getAttribute("onsetup")) {
      var fn=new Function(node.getAttribute("onsetup"));
      fn.call(node);}}
}

fdjtAddSetup(fdjtDomutils_setup);
fdjtAddSetup(fdjtAutoPrompt_setup);
fdjtAddSetup(fdjtCheckSpan_setup);
//fdjtAddSetup(fdjtAdjustFontSizes);
fdjtAddSetup(fdjtMarkReduced);
fdjtAddSetup(fdjtNodeSetup,true);
fdjtAddSetup(fdjtAnchorSubmit_setup);

fdjtLoadMessage("Loaded handlers.js");

/* Emacs local variables
;;;  Local variables: ***
;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
;;;  End: ***
*/

