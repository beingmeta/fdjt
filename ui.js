/* -*- Mode: Javascript; -*- */

/* ######################### fdjt/ui.js ###################### */

/* Copyright (C) 2009-2012 beingmeta, inc.
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

var fdjtUI=((typeof fdjtUI === 'undefined')?{}:(fdjtUI));
fdjtUI.CoHi=(fdjtUI.CoHi)||{classname: "cohi"};
fdjtUI.AutoPrompt=(fdjtUI.AutoPrompt)||{};
fdjtUI.InputHelp=(fdjtUI.InputHelp)||{};
fdjtUI.Ellipsis=(fdjtUI.Ellipsis)||{};
fdjtUI.Expansion=(fdjtUI.Expansion)||{};
fdjtUI.Collapsible=(fdjtUI.Collapsible)||{};
fdjtUI.Tabs=(fdjtUI.Tabs)||{};
fdjtUI.MultiText=(fdjtUI.MultiText)||{};
fdjtUI.Reticle=(fdjtUI.Reticle)||{};


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


/* Text highlighting */

fdjtUI.Highlight=(function(){
    var highlight_class="fdjthighlight";
    var hasClass=fdjtDOM.hasClass;
    var hasParent=fdjtDOM.getParent;

    function textnode(s){
	return document.createTextNode(s);}

    function clear_highlights(node,hclass){
	var h=fdjtDOM.getChildren(
	    node||document.body,"."+(hclass||highlight_class));
	h=fdjtDOM.toArray(h);
	var i=0 , lim=h.length;
	while (i<lim) {
	    var hnode=h[i++];
	    if (hnode.firstChild)
		fdjtDOM.replace(hnode,hnode.firstChild);}}
    function highlight_node(node,hclass,htitle){
	if (!(hclass)) hclass=highlight_class;
	if (hasClass(node,hclass)) return node;
	var hispan=fdjtDOM("span."+hclass);
	if (htitle) hispan.title=htitle;
	fdjtDOM.replace(node,hispan);
	hispan.appendChild(node);}
    function highlight_text(text,hclass,htitle){
	var tnode=fdjtDOM("span."+(hclass||highlight_class),text);
	if (htitle) tnode.title=htitle;
	return tnode;}
    function highlight_node_range(node,start,end,hclass,htitle){
	var stringval=node.nodeValue;
	var parent=node.parentNode;
	if ((end===false)||(typeof end === 'undefined'))
	    end=stringval.length;
	if (start===end) return;
	var beginning=((start>0)&&(textnode(stringval.slice(0,start))));
	var middle=highlight_text(stringval.slice(start,end),hclass,htitle);
	var ending=((end<stringval.length)&&
		    (textnode(stringval.slice(end))));
	if ((beginning)&&(ending)) {
	    parent.replaceChild(ending,node);
	    parent.insertBefore(middle,ending);
	    parent.insertBefore(beginning,middle);}
	else if (beginning) {
	    parent.replaceChild(middle,node);
	    parent.insertBefore(beginning,middle);}
	else if (ending) {
	    parent.replaceChild(ending,node);
	    parent.insertBefore(middle,ending);}
	else parent.replaceChild(middle,node);}
    function highlight_range(range,hclass,htitle){
	range=fdjtDOM.refineRange(range);
	var starts_in=range.startContainer;
	var ends_in=range.endContainer;
	if (starts_in===ends_in)
	    return highlight_node_range(
		starts_in,range.startOffset,range.endOffset,
		hclass,htitle);
	else {
	    var scan=starts_in;
	    while ((scan)&&(!(scan.nextSibling)))
		scan=scan.parentNode;
	    scan=scan.nextSibling;
	    while (scan) {
		if (scan===ends_in) break;
		else if (hasParent(ends_in,scan))
		    scan=scan.firstChild;
		else {
		    highlight_node(scan);
		    while ((scan)&&(!(scan.nextSibling)))
			scan=scan.parentNode;
		    scan=scan.nextSibling;}}
	    // Do the ends
	    highlight_node_range(
		starts_in,range.startOffset,false,hclass,htitle);
	    highlight_node_range(ends_in,0,range.endOffset,hclass,htitle);}}

    highlight_range.clear=clear_highlights;
    highlight_range.highlight=highlight_range;
    return highlight_range;})();



/* CheckSpans:
   Text regions which include a checkbox where clicking toggles the checkbox. */

(function(){
    var hasClass=fdjtDOM.hasClass;
    var addClass=fdjtDOM.addClass;
    var dropClass=fdjtDOM.dropClass;
    var toggleClass=fdjtDOM.toggleClass;
    var getParent=fdjtDOM.getParent;
    var getChildren=fdjtDOM.getChildren;
    var getChild=fdjtDOM.getChild;

    function CheckSpan(spec,varname,val,checked){
	var input=fdjtDOM.Input('input[type=checkbox]',varname,val);
	var span=fdjtDOM(spec||"span.checkspan",input);
	if (checked) {
	    input.checked=true;
	    fdjtDOM.addClass(span,"ischecked");}
	else input.checked=false;
	if (arguments.length>4) 
	    fdjtDOM.appendArray(span,arguments,4);
	return span;}
    fdjtUI.CheckSpan=CheckSpan;

    function checkable(elt){
	return (elt.nodeType===1)&&
	    (elt.tagName==='INPUT')&&
	    ((elt.type=='checkbox')||(elt.type=='radio'));}
    function getcheckable(elt){
	if (checkable(elt)) return elt;
	var cb=getParent(elt,checkable);
	if (cb) return cb;
	cb=getChildren(elt,'input');
	if (cb.length) {
	    var i=0; var lim=cb.length;
	    while (i<lim)
		if (checkable(cb[i])) return cb[i]; else i++;
	    return false;}
	else return false}

    function checkspan_set(target,checked) {
	if (typeof target === 'string') target=fdjtID(target);
	else if (target.length) {
	    var i=0, lim=target.length;
	    while (i<lim) checkspan_set(target[i++],checked);
	    return;}
	if ((!(target))||(!(target.nodeType))) return;
	var checkspan=((hasClass(target,"checkspan"))?(target):
		       (getParent(target,".checkspan")));
	if (!(checkspan)) return false;
	var checkbox=((checkable(target))&&(target))||
	    (getcheckable(target))||
	    (getcheckable(checkspan));
	if (!(checkbox)) return false;
	if (typeof checked === 'undefined')
	    // When the second argument isn't provided, we toggle the
	    //  checkbox
	    checked=(!(checkbox.checked));
	var changed=false;
	if (checkbox.checked!==checked) {
	    checkbox.checked=checked; changed=true;}
	// We change this anyway, just in case there's been a glitch
	if (checked) addClass(checkspan,"ischecked");
	else dropClass(checkspan,"ischecked");
	if (changed) {
	    var evt=document.createEvent("HTMLEvents");
	    evt.initEvent("change",false,true);
	    checkbox.dispatchEvent(evt);}
	if ((changed)&&(checkbox.type==='radio')) {
	    var form=checkbox.form;
	    var name=checkbox.name;
	    var tosync=fdjtDOM.getChildren(form,'input');
	    var i=0; var lim=tosync.length;
	    while (i<lim) {
		var input=tosync[i++];
		if ((input.type==='radio')&&(input.name===name)) {
		    var altspan=getParent(input,".checkspan");
		    var changed=
			(((input.checked)&&(!(hasClass(altspan,"ischecked"))))||
			 ((!(input.checked))&&(hasClass(altspan,"ischecked"))));
		    if (changed) {
			if (input.checked)
			    addClass(altspan,"ischecked");
			else dropClass(altspan,"ischecked");
			var evt=document.createEvent("HTMLEvents");
			evt.initEvent("change",false,true);
			input.dispatchEvent(evt);}}}}}
    fdjtUI.CheckSpan.set=checkspan_set;

    function checkspan_onclick(evt) {
	evt=evt||event;
	var target=evt.target||evt.srcTarget;
	if (((target.tagName)&&(target.tagName==="INPUT"))||
	    (getParent(target,"input"))) {
	    fdjtUI.cancel(evt);
	    setTimeout(function(){checkspan_set(target);},100);
	    return false;}
	else {
	    checkspan_set(target);
	    fdjtUI.cancel(evt);}
	return false;}
    fdjtUI.CheckSpan.onclick=checkspan_onclick;    

    function changed(evt) {
	evt=evt||event;
	var target=fdjtUI.T(evt);
	if ((target.type==='radio')||(target.type==='checkbox')) {
	    var checkspan=fdjtDOM.getParent(target,'.checkspan');
	    if (checkspan)
		((target.checked)?(fdjtDOM.addClass):(fdjtDOM.dropClass))(
		    checkspan,"ischecked");}}
    fdjtUI.CheckSpan.changed=changed;    

    })();


/* Progress boxes */

(function(){
    function ProgressBar(arg){
	if (typeof arg==='undefined')
	    arg=fdjtDOM("div.fdjtprogress",
			fdjtDOM("div.indicator"),fdjtDOM("div.message"));
	else if (typeof arg==='string')
	    arg=fdjtDOM("div.fdjtprogress",
			fdjtDOM("HR"),fdjtDOM("div.message",arg));
	this.dom=arg;
	return this;}

    function setProgress(pb,progress,total){
	if (typeof pb==='string')
	    pb=document.getElementById(pb);
	if (typeof total==='number')
	    progress=100*(progress/total);
	var dom=((pb.dom)||(pb));
	var rule=fdjtDOM.getChildren(dom,"div.indicator")[0];
	rule.style.width=progress+"%";}
    function setMessage(pb){
	if (typeof pb==='string')
	    pb=document.getElementById(pb);
	var dom=((pb.dom)||(pb));
	var oldmsg=fdjtDOM.getChildren(dom,".message")[0];
	var newmsg=fdjtDOM("div.message");
	fdjtDOM.appendArray(newmsg,fdjtDOM.Array(arguments,1));
	dom.replaceChild(newmsg,oldmsg);}
	
    ProgressBar.setProgress=setProgress;
    ProgressBar.setMessage=setMessage;
    ProgressBar.prototype.setProgress=function(progress,total){
	setProgress(this.dom,progress,total);};
    ProgressBar.prototype.setMessage=function(val){
	var dom=this.dom;
	var oldmsg=fdjtDOM.getChildren(dom,".message")[0];
	var newmsg=fdjtDOM("div.message");
	fdjtDOM.appendArray(newmsg,fdjtDOM.Array(arguments));
	dom.replaceChild(newmsg,oldmsg);};

    fdjtUI.ProgressBar=ProgressBar;})();


/* Automatic help display on focus */

(function(){

    var hasClass=fdjtDOM.hasClass;
    var addClass=fdjtDOM.addClass;
    var dropClass=fdjtDOM.dropClass;

    function show_help_onfocus(evt){
	var target=fdjtDOM.T(evt);
	while (target)
	    if ((target.nodeType==1) &&
		((target.tagName === 'INPUT') ||
		 (target.tagName === 'TEXTAREA')) &&
		(target.getAttribute('helptext'))) {
		var helptext=fdjtID(target.getAttribute('helptext'));
		if (helptext) fdjtDOM.addClass(helptext,"showhelp");
		return;}
	else target=target.parentNode;}
    function autoprompt_onfocus(evt){
	evt=evt||event||null;
	var elt=fdjtDOM.T(evt);
	if ((elt) && (hasClass(elt,'isempty'))) {
	    elt.value=''; dropClass(elt,'isempty');}
	show_help_onfocus(evt);}

    function hide_help_onblur(evt){
	var target=fdjtDOM.T(evt);
	while (target)
	    if ((target.nodeType==1) &&
		((target.tagName === 'INPUT') || (target.tagName === 'TEXTAREA')) &&
		(target.getAttribute('HELPTEXT'))) {
		var helptext=fdjtID(target.getAttribute('HELPTEXT'));
		if (helptext) dropClass(helptext,"showhelp");
		return;}
	else target=target.parentNode;}
    function autoprompt_onblur(evt){
	var elt=fdjtDOM.T(evt);
	if (elt.value==='') {
	    addClass(elt,'isempty');
	    var prompt=(elt.prompt)||(elt.getAttribute('prompt'))||(elt.title);
	    if (prompt) elt.value=prompt;}
	else dropClass(elt,'isempty');
	hide_help_onblur(evt);}
    
    // Removes autoprompt text from empty fields
    function autoprompt_cleanup(form) {
	var elements=fdjtDOM.getChildren(form,".isempty");
	if (elements) {
	    var i=0; var lim=elements.length;
	    while (i<elements.length) elements[i++].value="";}}
    function autoprompt_onsubmit(evt) {
	var form=fdjtDOM.T(evt);
	autoprompt_cleanup(form);}

    var isEmpty=fdjtString.isEmpty;
    // Adds autoprompt handlers to autoprompt classes
    function autoprompt_setup(arg,nohandlers) {
	var forms=
	    ((arg.tagName==="FORM")?[arg]:
	     (fdjtDOM.getChildren(arg||document.body,"FORM")));
	var i=0; var lim=forms.length;
	while (i<lim) {
	    var form=forms[i++];
	    var inputs=fdjtDOM.getChildren
	    (form,"INPUT.autoprompt,TEXTAREA.autoprompt");
	    if (inputs.length) {
		var j=0; var jlim=inputs.length;
		while (j<jlim) {
		    var input=inputs[j++];
		    input.blur();
		    if (isEmpty(input.value)) {
			addClass(input,"isempty");
			var prompt=(input.prompt)||
			    (input.getAttribute('prompt'))||(input.title);
			if (prompt) input.value=prompt;}
		    if (!(nohandlers)) {
			fdjtDOM.addListener(input,"focus",autoprompt_onfocus);
			fdjtDOM.addListener(input,"blur",autoprompt_onblur);}}
		if (!(nohandlers))
		    fdjtDOM.addListener(form,"submit",autoprompt_onsubmit);}}}
    
    fdjtUI.AutoPrompt.setup=autoprompt_setup;
    fdjtUI.AutoPrompt.onfocus=autoprompt_onfocus;
    fdjtUI.AutoPrompt.onblur=autoprompt_onblur;
    fdjtUI.AutoPrompt.onsubmit=autoprompt_onsubmit;
    fdjtUI.AutoPrompt.cleanup=autoprompt_cleanup;
    fdjtUI.InputHelp.onfocus=show_help_onfocus;
    fdjtUI.InputHelp.onblur=hide_help_onblur;})();



/* Text input boxes which create checkspans on enter. */

(function(){
    function multitext_keypress(evt,sepch){
	evt=(evt)||(event);
	var ch=evt.charCode;
	var target=fdjtUI.T(evt);
	if (typeof sepch === 'string') sepch=sepch.charCodeAt(0);
	if ((ch!==13)||((sepch)&&(sepch!=ch))) return;
	fdjtUI.cancel(evt);
	var checkspec=target.getAttribute("data-checkspec")||"div.checkspan";
	var checkbox=
	    fdjtDOM.Input("[type=checkbox]",target.name,target.value);
	var checkelt=fdjtDOM(checkspec,checkbox,target.value);
	checkbox.checked=true;
	fdjtDOM.addClass(checkelt,"ischecked");
	fdjtDOM(target.parentNode," ",checkelt);
	target.value='';}
    fdjtUI.MultiText.keypress=multitext_keypress;})();


/* Tabs */

(function(){
    var hasClass=fdjtDOM.hasClass;
    var addClass=fdjtDOM.addClass;
    var dropClass=fdjtDOM.dropClass;
    
    function tab_onclick(evt,shownclass){
	var elt=fdjtUI.T(evt);
	if (!(shownclass)) {
	    shownclass=
		fdjtDOM.findAttrib(elt,"shownclass","http://fdjt.org/")||
		"fdjtshown";}
	if (elt) {
	    var content_id=false;
	    while (elt.parentNode) {
		if (content_id=fdjtDOM.getAttrib(elt,"contentid")) break;
		else elt=elt.parentNode;}
	    if (!(content_id)) return;
	    var content=document.getElementById(content_id);
	    var parent=fdjtDOM.getParent(elt,".tabs")||elt.parentNode;
	    var sibs=fdjtDOM.getChildren(parent,".tab")||parent.childNodes;
	    if (content===null) {
		fdjtLog("No content for "+content_id);
		return;}
	    var i=0; while (i<sibs.length) {
		var node=sibs[i++]; var cid;
		if ((node.nodeType===1) &&
		    (cid=fdjtDOM.getAttrib(node,"contentid"))) {
		    if (!(cid)) continue;
		    var cdoc=document.getElementById(cid);
		    if (node===elt) {}
		    else if (hasClass(node,shownclass)) {
			dropClass(node,shownclass);
			if (cdoc) dropClass(cdoc,shownclass);}}}
	    if (hasClass(elt,shownclass)) {
		dropClass(elt,shownclass);
		dropClass(content,shownclass);}
	    else {
		addClass(elt,shownclass);
		addClass(content,shownclass);}
	    var tabstate=fdjtDOM.findAttrib(elt,'tabstate');
	    if (!(tabstate)) {}
	    else if (tabstate==='#') {
		var scrollstate={};
		fdjtUI.scrollSave(scrollstate);
		document.location.hash=tabstate+content_id;
		fdjtUI.scrollRestore(scrollstate);}
	    else fdjtState.setCookie(tabstate,content_id);
	    // This lets forms pass tab information along
	    return false;}}
    fdjtUI.Tabs.click=tab_onclick;
    
    function select_tab(tabbar,contentid,shownclass){
	if (!(shownclass)) {
	    shownclass=
		fdjtDOM.findAttrib(tabbar,"shownclass","http://fdjt.org/")||
		"fdjtshown";}
	var tabseen=false;
	var tabs=fdjtDOM.getChildren(tabbar,".tab");
	var i=0; while (i<tabs.length) {
	    var tab=tabs[i++];
	    if ((tab.getAttribute("contentid"))===contentid) {
		addClass(tab,shownclass); tabseen=true;}
	    else if (hasClass(tab,shownclass)) {
		dropClass(tab,shownclass);
		var cid=fdjtDOM.getAttrib(tab,"contentid");
		var content=(cid)&&fdjtID(cid);
		if (!(content))
		    fdjtWarn("No reference for tab content %o",cid);
		else dropClass(content,shownclass);}
	    else dropClass(tab,shownclass);}
	if (fdjtID(contentid)) {
	    if (tabseen) addClass(contentid,shownclass);
	    else fdjtLog.warn("a tab for %s was not found in %o",
			      contentid,tabbar);}
	else fdjtLog.warn("No reference for tab content %o",contentid);}
    fdjtUI.Tabs.selectTab=select_tab;
    
    function setupTabs(elt){
	if (!(elt)) elt=fdjtDOM.$(".tabs[tabstate]");
	else if (typeof elt === 'string') elt=fdjtID(elt);
	if ((!(elt))||(!(elt.getAttribute("tabstate")))) return;
	var tabstate=elt.getAttribute("tabstate");
	var content_id=false;
	if (tabstate==='#') {
	    content_id=document.location.hash;
	    if (content_id[0]==='#') content_id=content_id.slice(1);
	    var content=((content_id)&&(fdjtID(content_id)));
	    if (!(content)) return;
	    var ss={}; fdjtUI.scrollSave(ss);
	    window.scrollTo(0,0);
	    if (!(fdjtDOM.isVisible(content)))
		fdjtUI.scrollRestore(ss);}
	else content_id=fdjtState.getQuery(tabstate)||
	    fdjtState.getCookie(tabstate);
	if (!(content_id)) return;
	if (content_id[0]==='#') content_id=content_id.slice(1);
	if (content_id) select_tab(elt,content_id);}
    fdjtUI.Tabs.setup=setupTabs;
    
    function selected_tab(tabbar){
	var tabs=fdjtDOM.getChildren(tabbar,".tab");
	var i=0; while (i<tabs.length) {
	    var tab=tabs[i++];
	    if (hasClass(tag,"shown"))
		return tag.getAttribute("contentid");}
	return false;}
    fdjtUI.Tabs.getSelected=selected_tab;}());



/* Collapse/Expand */

fdjtUI.Expansion.toggle=function(evt,spec,exspec){
  evt=evt||event;
    var target=fdjtUI.T(evt);
    var wrapper=fdjtDOM.getParent(target,spec||".fdjtexpands");
    if (wrapper) fdjtDOM.toggleClass(wrapper,exspec||"fdjtexpanded");};
fdjtUI.Expansion.onclick=fdjtUI.Expansion.toggle;

fdjtUI.Collapsible.click=function(evt){
  evt=evt||event;
  var target=fdjtUI.T(evt);
  if (fdjtUI.isDefaultClickable(target)) return;
  var wrapper=fdjtDOM.getParent(target,".collapsible");
  if (wrapper) {
    fdjtUI.cancel(evt);
    fdjtDOM.toggleClass(wrapper,"expanded");};};

fdjtUI.Collapsible.focus=function(evt){
  evt=evt||event;
  var target=fdjtUI.T(evt);
  var wrapper=fdjtDOM.getParent(target,".collapsible");
  if (wrapper) {
    fdjtDOM.toggleClass(wrapper,"expanded");};};


/* Temporary Scrolling */

(function(){
    var saved_scroll=false;
    var use_native_scroll=false;
    var preview_elt=false;

    function scroll_discard(ss){
	if (ss) {
	    ss.scrollX=false; ss.scrollY=false;}
	else saved_scroll=false;}

    function scroll_save(ss){
	if (ss) {
	    ss.scrollX=window.scrollX; ss.scrollY=window.scrollY;}
	else {
	    if (!(saved_scroll)) saved_scroll={};
	    saved_scroll.scrollX=window.scrollX;
	    saved_scroll.scrollY=window.scrollY;}}
    
    function scroll_offset(wleft,eleft,eright,wright){
	var result;
	if ((eleft>wleft) && (eright<wright)) return wleft;
	else if ((eright-eleft)<(wright-wleft)) 
	    return eleft-Math.floor(((wright-wleft)-(eright-eleft))/2);
	else return eleft;}

    function scroll_into_view(elt,topedge){
	if ((topedge!==0) && (!topedge) && (fdjtDOM.isVisible(elt)))
	    return;
	else if ((use_native_scroll) && (elt.scrollIntoView)) {
	    elt.scrollIntoView(top);
	    if ((topedge!==0) && (!topedge) && (fdjtDOM.isVisible(elt,true)))
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
	    
	    var targetx=scroll_offset(winx,left,left+width,winxedge);
	    var targety=
		(((topedge)||(topedge===0)) ?
		 ((typeof topedge === "number") ? (top+topedge) : (top)) :
		 (scroll_offset(winy,top,top+height,winyedge)));
	    
	    var vh=fdjtDOM.viewHeight();
	    var x=0; var y;
	    var y_target=top+(height/3);
	    if ((2*(height/3))<((vh/2)-50))
		y=y_target-vh/2;
	    else if ((height)<(vh-100))
		y=top-(50+(height/2));
	    else y=top-50;

	    window.scrollTo(x,y);}}

    fdjtUI.scrollTo=function(target,id,context,discard,topedge){
	scroll_discard(discard);
	if (id) document.location.hash=id;
	if (context) {
	    setTimeout(function() {
		scroll_into_view(context,topedge);
		if (!(fdjtDOM.isVisible(target))) {
		    scroll_into_view(target,topedge);}},
		       100);}
	else setTimeout(function() {scroll_into_view(target,topedge);},100);};

    function scroll_preview(target,context,delta){
	/* Stop the current preview */
	if (!(target)) {
	    stop_preview(); return;}
	/* Already previewing */
	if (target===preview_elt) return;
	if (!(saved_scroll)) scroll_save();
	if (typeof target === 'number')
	    window.scrollTo(((typeof context === 'number')&&(context))||0,target);
	else scroll_into_view(target,delta);
	preview_elt=target;}

    function scroll_restore(ss){
	if (preview_elt) {
	    preview_elt=false;}
	if ((ss) && (typeof ss.scrollX === "number")) {
	    // fdjtLog("Restoring scroll to %d,%d",ss.scrollX,ss.scrollY);    
	    window.scrollTo(ss.scrollX,ss.scrollY);
	    return true;}
	else if ((saved_scroll) &&
		 ((typeof saved_scroll.scrollY === "number") ||
		  (typeof saved_scroll.scrollX === "number"))) {
	    // fdjtLog("Restoring scroll to %o",_fdjt_saved_scroll);
	    window.scrollTo(saved_scroll.scrollX,saved_scroll.scrollY);
	    saved_scroll=false;
	    return true;}
	else return false;}

    function stop_preview(){
	fdjtDOM.dropClass(document.body,"preview");
	if ((preview_elt) && (preview_elt.className))
	    fdjtDOM.dropClass(preview_elt,"previewing");
	preview_elt=false;}

    fdjtUI.scrollSave=scroll_save;
    fdjtUI.scrollRestore=scroll_restore;
    fdjtUI.scrollIntoView=scroll_into_view;
    fdjtUI.scrollPreview=scroll_preview;
    fdjtUI.scrollRestore=scroll_restore;}());


/* Smart (DOM-aware) scrolling */

(function(){
    var getGeometry=fdjtDOM.getGeometry;
    var getDisplay=fdjtDOM.getDisplay;
    var getStyle=fdjtDOM.getStyle;

    function smartScroll(win,off,content){
	if (typeof content==='undefined') content=win;
	if (off<=0) {win.scrollTop=0; return;}
	else {
	    var block=findBreak(content,off,content);
	    if (!(block)) {win.scrollTop=off; return;}
	    var geom=getGeometry(block,content||win);
	    if ((geom-top-off)<(win.offsetTop/4))
		win.scrollTop=geom.top;
	    else win.scrollTop=off;}}
    function findBreak(node,off,container){
	var style=getStyle(node);
	var display=style.display;
	if ((display==='block')||(display==='table-row')||
	    (display==='list-item')||(display==='preformatted')) {
	    var geom=getGeometry(node,container);
	    if (geom.top>off) return node;
	    else if (geom.bottom>off) {
		if (style.pageBreakInside==='avoid')
		    return node;
		var children=node.childNodes;
		var i=0, lim=children.length;
		while (i<lim)  {
		    var child=children[i++];
		    var bk=((child.nodeType===1)&&
			    (findBreak(child,off,container)));
		    if (bk) return bk;}
		return node;}
	    else return false;}
	else return false;}

    fdjtUI.smartScroll=smartScroll;})();


/* Delays */

(function(){
    var timeouts={};
    
    fdjtUI.Delay=function(interval,name,fcn){
	window.setTimeout(fcn,interval);};}());

/* Triggering submit events */

(function(){
    function dosubmit(evt){
	evt=evt||event;
	var target=fdjtUI.T(evt);
	var form=fdjtDOM.getParent(target,"FORM");
	var submit_event = document.createEvent("HTMLEvents");
	submit_event.initEvent('submit',false,true);
	form.dispatchEvent(submit_event);
	form.submit();}
    fdjtUI.dosubmit=dosubmit;}());

/* Looking for vertical box overflow */

(function(){
    var addClass=fdjtDOM.addClass;
    var dropClass=fdjtDOM.dropClass;
    var getGeometry=fdjtDOM.getGeometry;
    var getInsideBounds=fdjtDOM.getInsideBounds;
    function checkOverflow(node){
	var geom=getGeometry(node);
	var inside=getInsideBounds(node);
	if (inside.bottom>geom.bottom) addClass(node,"overflow");
	else dropClass(node,"overflow");}
    fdjtUI.Overflow=checkOverflow;}());


/* Reticle based functions */

(function() {
    var getGeometry=fdjtDOM.getGeometry;
    var vreticle=false;
    var hreticle=false;
    function setXY(x,y){
	if  (vreticle) (vreticle).style.left=x+'px';
	if  (hreticle) (hreticle).style.top=y+'px';}
    function setupReticle(){
	if (!(vreticle)) {
	    vreticle=fdjtDOM("div.reticle.vertical#VRETICLE"," ")
	    fdjtDOM.prepend(document.body,vreticle);}
	if (!(hreticle)) {
	    hreticle=fdjtDOM("div.reticle.horizontal#HRETICLE"," ")
	    fdjtDOM.prepend(document.body,hreticle);}
	fdjtDOM.addListener(document,"mousemove",mousemove);
	fdjtDOM.addListener(document,"click",doflash);
	fdjtUI.Reticle.live=true;}
    
    function doflash(evt){flash();}

    function mousemove(evt){
	var target=fdjtUI.T(evt);
	var x=evt.clientX, y=evt.clientY;
	var geom=getGeometry(target);
	/*
	fdjtLog("mousemove cx=%d,cy=%d,sx=%d,sy=%d t=%o geom=%j",
		evt.clientX,evt.clientY,evt.screenX,evt.screenY,
		target,geom);
	*/
	setXY(evt.clientX,evt.clientY);}
    
    var highlighted=false;
    
    function highlight(flag){
	if (typeof flag === 'undefined') flag=(!(higlighted));
	if (flag) {
	    if (vreticle) fdjtDOM.addClass(vreticle,"highlight");
	    if (hreticle) fdjtDOM.addClass(hreticle,"highlight");
	    highlighted=true;}
	else {
	    if (vreticle) fdjtDOM.dropClass(vreticle,"highlight");
	    if (hreticle) fdjtDOM.dropClass(hreticle,"highlight");
	    highlighted=false;}}
    
    function flash(howlong){
	if (typeof howlong === 'undefined') howlong=1500;
	if (highlighted) return;
	else {
	    highlight(true);
	    setTimeout(function(){highlight(false);},howlong);}}

    fdjtUI.Reticle.setup=setupReticle;
    fdjtUI.Reticle.highlight=highlight;
    fdjtUI.Reticle.flash=flash;
    fdjtUI.Reticle.onmousemove=mousemove;
    fdjtUI.Reticle.setXY=setXY;
    fdjtUI.Reticle.live=false;})();


/* Image swapping */

(function(){
    function ImageSwap(img,interval){
	if (typeof img==='string') img=fdjtID(img);
	if (!(img)) return false;
	if (!(interval))
	    interval=((img.getAttribute('data-interval'))?
		      (parseInt((img.getAttribute('data-interval')))):
		      (ImageSwap.interval));
	if (!(img.getAttribute("data-images"))) {
	    img.setAttribute("data-images",img.src);}
	if (!(img.defaultsrc)) img.defaultsrc=img.src;
	var images=(img.getAttribute('data-images')).split(';');
	if (images.length===0) return false;
	else if (images.length===1) {
	    img.src=images[0];
	    return false;}
	var counter=0;
	return setInterval(function(){
	    img.src=images[counter++];
	    if (counter>=images.length) counter=0;},
			   interval);}
	    
    ImageSwap.reset=function(img){
	if (img.defaultsrc) img.src=img.defaultsrc;};
    ImageSwap.interval=1000;

    fdjtUI.ImageSwap=ImageSwap;})();


/* Miscellaneous event-related functions */

(function(){
    var hasClass=fdjtDOM.hasClass;
    
    fdjtUI.T=function(evt) {
	evt=evt||event; return (evt.target)||(evt.srcElement);};

    fdjtUI.nodefault=function(evt){
	evt=evt||event;
	if (evt.preventDefault) evt.preventDefault();
	else evt.returnValue=false;
	return false;};

    fdjtUI.isClickable=function(target){
	if (target instanceof Event) target=fdjtUI.T(target);
	while (target) {
	    if (((target.tagName==='A')&&(target.href))||
		(target.tagName==="INPUT") ||
		(target.tagName==="TEXTAREA") ||
		(target.tagName==="SELECT") ||
		(target.tagName==="OPTION") ||
		(hasClass(target,"checkspan"))||
		(hasClass(target,"clickable"))||
		(hasClass(target,"isclickable")))
		return true;
	    else if (target.onclick)
	      return true;
	    else target=target.parentNode;}
	return false;};

    fdjtUI.isDefaultClickable=function(target){
	if (target instanceof Event) target=fdjtUI.T(target);
	while (target) {
	    if (((target.tagName==='A')&&(target.href))||
		(target.tagName==="INPUT") ||
		(target.tagName==="TEXTAREA") ||
		(target.tagName==="SELECT") ||
		(target.tagName==="OPTION") ||
		(hasClass(target,"isclickable")))
		return true;
	    else target=target.parentNode;}
	return false;};

    fdjtUI.cancel=function(evt){
	evt=evt||event;
	if (evt.preventDefault) evt.preventDefault();
	else evt.returnValue=false;
	evt.cancelBubble=true;
	return false;};
    fdjtUI.nobubble=function(evt){
	evt=evt||event;
	evt.cancelBubble=true;};

    function submitEvent(arg){
	var form=((arg.nodeType)?(arg):(fdjtUI.T(arg)));
	while (form) {
	    if (form.tagName==='FORM') break;
	    else form=form.parentNode;}
	if (!(form)) return;
	var submit_evt = document.createEvent("HTMLEvents");
	submit_evt.initEvent("submit", true, true);
	form.dispatchEvent(submit_evt);
	return;}
    fdjtUI.submitEvent=submitEvent;

    function focusEvent(arg){
	var elt=((arg.nodeType)?(arg):(fdjtUI.T(arg)));
	var focus_evt = document.createEvent("HTMLEvents");
	focus_evt.initEvent("focus", true, true);
	elt.dispatchEvent(focus_evt);
	return;}
    fdjtUI.focusEvent=focusEvent;

    function disableForm(form){
	if (typeof form === 'string') form=fdjtID(form);
	if (!(form)) return;
	var elements=fdjtDOM.getChildren(
	    form,"button,input,optgroup,option,select,textarea");
	var i=0; var lim=elements.length;
	while (i<lim) elements[i++].disabled=true;}
    fdjtUI.disableForm=disableForm;
    
}());

/* Ellipsis */

(function(){
    var ellipsize=fdjtString.ellipsize;
    var getParent=fdjtDOM.getParent;
    var addClass=fdjtDOM.addClass;
    var dropClass=fdjtDOM.dropClass;
    var toggleClass=fdjtDOM.toggleClass;

    function Ellipsis(spec,string,lim){
	var content=ellipsize(string,lim);
	if (content.length===string.length) {
	    if (spec) return fdjtDOM(spec,string);
	    else return document.createTextNode(string);}
	var pct=Math.round((100*(content.length))/string.length);
	var elt=fdjtDOM(spec||"span.ellipsis",content); elt.title=string;
	if (spec) addClass(elt,"ellipsis");
	var remaining=string.slice(content.length);
	var elided=fdjtDOM("span.elided",remaining);
	var elision=fdjtDOM(
	    "span.elision",fdjtString("…%d%% more…",100-pct));
	elt.appendChild(elided); elt.appendChild(elision);
	return elt;}
    fdjtUI.Ellipsis=Ellipsis;

    Ellipsis.expand=function(node){
	if (typeof node === 'string') node=fdjtID(node);
	var ellipsis=getParent(node,".ellipsis");
	addClass(ellipsis,"expanded");
    	dropClass(ellipsis,"compact");};
    Ellipsis.contract=function(node){
	if (typeof node === 'string') node=fdjtID(node);
	var ellipsis=getParent(node,".ellipsis");
	addClass(ellipsis,"compact");
    	dropClass(ellipsis,"expanded");};
    Ellipsis.toggle=function(arg){
	if (!(arg)) arg=event;
	if (typeof arg === 'string') arg=fdjtID(arg);
	else if (arg.nodeType) {}
	else arg=fdjtUI.T(arg);
	var ellipsis=getParent(arg,".ellipsis");
	if (hasClass(ellipsis,"expanded")) {
	    addClass(ellipsis,"compact");
	    dropClass(ellipsis,"expanded");}
	else {
	    addClass(ellipsis,"expanded");
	    dropClass(ellipsis,"compact");}};
})();

/* Emacs local variables
   ;;;  Local variables: ***
   ;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
   ;;;  End: ***
*/
