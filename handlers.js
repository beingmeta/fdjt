/* -*- Mode: Javascript; -*- */

/* Copyright (C) 2008-2009 beingmeta, inc.
   This file is a part of the FDJT web toolkit (www.fdjt.org)
   This file provides DHTML handlers for a variety of UI conventions
   and interactions.
*/

var fdjt_handlers_id="$Id$";
var fdjt_handlers_version=parseInt("$Revision$".slice(10,-1));

fdjtLoadMessage("Loading handlers.js");

/* INPUT SHOWHELP */

function fdjtShowHelp_onfocus(evt)
{
  var target=evt.target;
  fdjtStopCheshire(evt);
  while (target)
    if ((target.nodeType==1) &&
	((target.tagName === 'INPUT') || (target.tagName === 'TEXTAREA')) &&
	((target.hasAttribute) ? (target.hasAttribute('HELPTEXT')) :
	 (target.getAttribute('HELPTEXT')))) {
      var helptext=document.getElementById(target.getAttribute('HELPTEXT'));
      if (helptext) {
	if (fdjtBlockEltp(helptext))
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
  // fdjtLog('target='+target);
  while (target.parentNode)
    if ((fdjtHasAttrib(target,'CLICKTOHIDE')) ||
	(fdjtHasAttrib(target,'CLICKTOSHOW')) ||
	(fdjtHasAttrib(target,'CLICKTOTOGGLE'))) {
      var tohide=target.getAttribute('CLICKTOHIDE');
      var toshow=target.getAttribute('CLICKTOSHOW');
      var toflip=target.getAttribute('CLICKTOTOGGLE');
      if (tohide) tohide=tohide.split(',');
      if (toshow) toshow=toshow.split(',');
      if (toflip) toflip=toflip.split(',');
      if (tohide) {
	var i=0; while (i<tohide.length) {
	  var elt=document.getElementById(tohide[i]); 
	  if (elt) elt.style.display='none';
	  i++;}}
      if (toshow) {
	var i=0; while (i<toshow.length) {
	  var elt=document.getElementById(toshow[i]); 
	  if (elt)
	    if (fdjtBlockEltp(elt)) elt.style.display='block';
	    else elt.style.display='block';
	  i++;}}
      if (toflip) {
	var i=0; while (i<toflip.length) {
	  var elt=document.getElementById(toflip[i]);
	  if (elt) {
	    var display=elt.style.display;
	    if ((display===null) || (display===''))
	      display=window.getComputedStyle(elt,null).display;
	    if (display==='none')
	      if (fdjtBlockEltp(elt)) elt.style.display='block';
	      else elt.style.display='inline';
	    else elt.style.display='none';
	    target.setAttribute('displayed',elt.style.display);}
	  i++;}}
      return;}
    else target=target.parentNode;
}

/* SETCLEAR */

function fdjtSetClear_onclick(evt)
{
  var target=evt.target;
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
  fdjtStopCheshire(evt);
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
  var elements=document.getElementsByTagName('INPUT');
  var i=0; if (elements) while (i<elements.length) {
    var elt=elements[i++];
    if ((elt.type==='text') &&
	((elt.className==='autoprompt') ||
	 (fdjtHasAttrib(elt,'prompt')))) {
      var prompt=elt.getAttribute('prompt');
      if (prompt===null)
	if (elt.className==='autoprompt')
	  prompt=elt.title;
	else continue;
      // fdjtLog('Considering '+elt+' class='+elt.className+' value='+elt.value);
      if ((elt.value=='') || (elt.value==prompt)) {
	// fdjtLog('Marking empty');
	elt.value=prompt;
	elt.setAttribute('isempty','yes');}}}
}

// Removes autoprompt text from empty fields
function fdjtAutoPrompt_cleanup()
{
  var elements=document.getElementsByTagName('INPUT');
  var i=0; if (elements) while (i<elements.length) {
    var elt=elements[i++];
    if (fdjtHasAttrib(elt,'isempty'))
      elt.value="";}
}

/* Tabs */

function fdjtTab_onclick(evt)
{
  var elt=evt.target;
  if (elt) {
    while (elt.parentNode)
      if (fdjtHasAttrib(elt,"contentid")) break;
      else elt=elt.parentNode;
    if (elt===null) return;
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
      if ((node.nodeType===1) && (node.className==='tab')) {
	var cid=node.getAttribute('contentid');
	var cdoc=document.getElementById(cid);
	if (node===elt) {}
	else if (fdjtHasAttrib(node,'shown')) {
	  node.removeAttribute('shown');
	  if (cdoc) cdoc.removeAttribute('shown');}}}
    if (fdjtHasAttrib(elt,'shown'))
      elt.removeAttribute('shown');
    else elt.setAttribute('shown','yes');
    if (fdjtHasAttrib(content,'shown'))
      content.removeAttribute('shown');
    else content.setAttribute('shown','yes');
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
  while (target.parentNode) {
    if (target.nodeType!=1) target=target.parentNode;
    else if (target.className==='checkspan') break;
    else if (target.tagName==='A') return;
    else if (target.tagName==='INPUT') {
      clickinput=target; target=target.parentNode;} /* return; */
    else target=target.parentNode;}
  // if (target) fdjtLog('Found checkspan '+target);
  if (target) {
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
var fdjt_cheshirefinish=null;

function fdjtCheshire_handler(event)
{
  if ((fdjt_cheshiresteps) &&
      (fdjt_cheshirecountdown<=0)) {
    console.log('closing window');
    clearInterval(fdjt_cheshiretimer);
    if (fdjt_cheshirefinish)
      fdjt_cheshirefinish();
    else window.close();}
  else if ((fdjt_cheshiresteps) &&
	   (fdjt_cheshirecountdown)) {
    fdjt_cheshirecountdown=fdjt_cheshirecountdown-1;
    var ratio=(fdjt_cheshirecountdown/fdjt_cheshiresteps)*0.8;
    // console.log('opacity='+ratio);
    fdjt_cheshireelt.style.opacity=ratio;}
  else {}
}

function fdjtStartCheshire(eltid,interval,steps)
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

function fdjtStopCheshire(event)
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
function fdjtMultiText_onkeypress(evt)
{
  var ch=evt.charCode, kc=evt.keyCode;
  if (kc===13) {
    var elt=evt.target;
    if (elt.value==="") return;
    var new_elt=elt.cloneNode(false);
    new_elt.value="";
    fdjtInsertBefore(elt,new_elt);
    elt.blur; new_elt.focus();
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
var _fdjt_cohi_elt=false;
var _fdjt_cohi_timer=false;

function fdjtCoHi_highlight(target,classname_arg)
{
  // fdjtLog("cohi target=%o cohi=%o",target,target.fdjt_cohi);
  if ((!(target)) || (target===_fdjt_cohi_elt)) {
    if (_fdjt_cohi_timer) clearTimeout(sbookHUD_hider);
    _fdjt_cohi_timer=false;
    return;}
  else {
    var classname=((classname_arg) || (fdjt_cohi_classname));
    var cohi=((target.fdjt_cohi) || (target.getAttribute("cohi")) || (false));
    if (_fdjt_cohi_elt)
      fdjtCoHi_unhighlight(_fdjt_cohi_elt,classname);
    _fdjt_cohi_elt=target;
    fdjtAddClass(target,classname);
    if (cohi) fdjtAddClass(cohi,classname);
    else {}}
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
  else if (target===_fdjt_cohi_elt) {
    if (_fdjt_cohi_timer) clearTimeout(sbookHUD_hider);
    _fdjt_cohi_timer=false;
    return;}
  else fdjtCoHi_highlight(target);
}

function fdjtCoHi_onmouseout(evt,classname_arg)
{
  if (_fdjt_cohi_elt)
    _fdjt_cohi_timer=
      setTimeout(function () {fdjtCoHi_unhighlight();},20);
}

/* Completion */

/* This is big enough that perhaps it should be in its own file,
   but it's living here for now. */

function _fdjt_get_completions(input_elt,create)
{
  if (input_elt.fdjt_completions)
    return input_elt.fdjt_completions;
  else if (input_elt.getAttribute("COMPLETIONS")) {
    var elt=$(input_elt.getAttribute("COMPLETIONS"));
    if (!(elt))
      if (create) elt=fdjtCompletions(input_elt.getAttribute("COMPLETIONS"));
      else return false;
    input_elt.fdjt_completions=elt;
    elt.fdjt_input=input_elt;
    return elt;}
  else {
    var id=input_elt.name+"_COMPLETIONS";
    var elt=$(id);
    input_elt.setAttribute("COMPLETIONS",id);
    if (!(elt))
      if (create) elt=fdjtCompletions(id);
      else return false;
    elt.fdjt_input=input_elt;
    input_elt.fdjt_completions=elt;
   return elt;}
}

function fdjtCompletions(id,completions)
{
  var div=fdjtDiv("completions");
  div.id=id;
  div.onclick=fdjtComplete_onclick;
  fdjtAddCompletions(div,completions);
  return div;
}

function fdjtAddCompletions(div,completions)
{
  if (typeof div === "string") div=document.getElementById(div);
  if (!(div instanceof Node))
    throw {name: 'NotANode', irritant: div};
  else if ((completions) && (completions instanceof Array)) {
    var i=0; while (i<completions.length) {
      var completion=completions[i++];
      var key; var value; var content=[];
      if (typeof completion === "string") {
	key=value=completion; content.push(completion);}
      else if (typeof completion != "object") {
	completion=completion.toString();
	key=value=completion; content.push(completion);}
      else if (completion.getCompletionEntry) {
	completion=completion.getCompletionEntry();
	if (completion instanceof Node)
	  value=key=completion;
	else {
	  key=completion.key;
	  value=((completion.value) || (key));
	  content=((completion.content) || (value));}}
      else {
	key=completion.key;
	value=((completion.value) || (key));
	content=((completion.content) || (value));}
      if (key instanceof Node)
	fdjtAppend(div,key);
      else if (key) {
	var completion_div=fdjtDiv("completion",content);
	completion_div.completion_key=key;
	completion_div.completion_value=value;
	fdjtAppend(div,completion_div);}}}
  return div;
}

function fdjtComplete(input_elt,string,options)
{
  var values=[];
  var completions=_fdjt_get_completions(input_elt);
  if (!(completions)) return;
  var prefix=false; var nocase=false;
  if (typeof options === "string") {
    prefix=(options.search(/\bprefix\b/)>=0);
    nocase=(options.search(/\bnocase\b/)>=0);}
  /*
  fdjtLog("fdjtComplete input_elt=%o, comp=%o, string=%o, ac=%o, n=%d",
	  input_elt,completions,
	  string,completions,completions.childNodes.length);
  */
  if (nocase)
    if (typeof string === "string")
      string=new RegExp(string,"gi");
    else if (string instanceof RegExp)
      string=new RegExp(string.source,"gi");
    else throw { name: "TypeError",
	     irritant: string,
	     expected: "string or regex"};
  var children=completions.childNodes;
  var i=0; while (i<children.length) {
    var child=children[i++];
    if (child.nodeType===Node.ELEMENT_NODE) {
      var value=false;
      var key=child.completion_key;
      if (!(key)) {
	key=child.getAttribute("KEY");
	if (key) child.completion_key=key;}
      if (key) {
	var keys=((key instanceof Array) ? (key) :
		  (typeof key === "string") ?
		  (new Array(key)) : (new Array(key.toString())));
	var j=0; while ((j<keys.length) && (!(value))) {
	  var key=keys[j++];
	  if ((prefix) ? (key.search(string)===0) :
	      (key.search(string)>=0)) 
	    if (child.completion_value)
	      value=child.completion_value;
	    else if (child.hasAttribute("VALUE")) {
	      value=child.completion_value;
	      child.completion_value=value;}
	    else value=keys[0];}
	if (value) {
	  values.push(value);
	  child.setAttribute("displayed","yes");}
	else child.setAttribute("displayed","no");}}}
  if (values.length) completions.style.display='block';
  else completions.style.display='none';
  return values;
}

function fdjtCompletionText(input_elt)
{
  if (input_elt.getCompletionText)
    return input_elt.getCompletionText();
  else return input_elt.value;
}

function fdjtHandleCompletion(input_elt,value)
{
  if (input_elt.handleCompletion)
    return input_elt.getCompletionText(value);
  else input_elt.value=value;
}

function fdjtComplete_onclick(evt)
{
  var target=evt.target;
  // fdjtLog("complete onclick %o",target);
  while (target)
    if (target.completion_key) break;
    else target=target.parentNode;
  if (!(target)) return;
  var completions=target;
  while (completions)
    if (completions.fdjt_input) break;
    else completions=completions.parentNode;
  if (!(completions)) return;
  var input_elt=completions.input_elt;
  var value=((target.completion_value) ||
	     (target.getAttribute("value")) ||
	     (target.completion_key));
  fdjtHandleCompletion(input_elt,value);
  completions.style.display='none';
}

var _fdjt_completion_timer=false;

function fdjtComplete_show(evt)
{
  var target=evt.target;
  var keycode=evt.keyCode;
  var value=fdjtCompletionText(target);
  var options=(target.getAttribute("COMPLETEOPTS")||"");
  if (_fdjt_completion_timer) 
    clearTimeout(_fdjt_completion_timer);
  if (value!="")
    fdjt_completion_timer=
      setTimeout(function () {
	  fdjtComplete(target,value,options);},100);
}

function fdjtComplete_onkeypress(evt)
{
  var target=evt.target;
  var keycode=evt.keyCode;
  var value=fdjtCompletionText(target);
  var options=(target.getAttribute("COMPLETEOPTS")||"");
  if (_fdjt_completion_timer) 
    clearTimeout(_fdjt_completion_timer);
  if (false) { /*  ((keycode) && (keycode===0x09) && (evt.ctrlKey)) */
    // Tab completion
    var results=fdjtComplete(target,value,options);
    if (results.length===1) {
      fdjtHandleCompletion(target,results[0]);
      target.fdjt_completions.style.display='none';}
    else if (results.length>0) {
      target.fdjt_completions.style.display='block';}
    else {}}
  else _fdjt_completion_timer=
	 setTimeout(function () {
	     fdjtComplete(target,fdjtCompletionText(target),options);},100);
}

function fdjtComplete_hide(evt)
{
  var target=evt.target;
  if ((target) && (target.fdjt_completions))
    target.fdjt_completions.style.display='none';
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

function fdjt_setup()
{
  if (fdjt_setup_started) return;
  fdjt_setup_started=true;
  fdjtLog("fdjt_setup running");
  fdjt_autoprompt_setup();
  fdjt_checkspan_setup(null);
  fdjt_adjust_font_sizes();
  fdjt_mark_reduced();
  fdjt_setup_done=true;
  fdjtLog("fdjt_setup run");
}

fdjtLoadMessage("Loaded handlers.js");

