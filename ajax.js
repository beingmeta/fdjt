/* -*- Mode: Javascript; -*- */

/* Copyright (C) 2007-2010 beingmeta, inc.
   This file is a part of the FDJT web toolkit (www.fdjt.org)
   This file provides an abstraction layer for Ajax calls

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

var fdjtAjax=
    (function(){
	
	function compose_uri(base_uri,args){
	    var uri=base_uri; var need_amp=false;
	    if (base_uri[-1]==='&') need_amp=false;
	    else if (base_uri.indexOf('?')>=0) need_amp=true;
	    else uri=base_uri+"?";
	    var i=0; while (i<args.length) {
		uri=uri+((need_amp) ? ("&") : (""))+args[i]+"="+args[i+1];
		need_amp=true;
		i=i+2;}
	    return uri;}

	var trace_ajax=false;
	
	function fdjtAjax(callback,base_uri,args){
	    var req=new XMLHttpRequest();
	    req.onreadystatechange=function () {
		if ((req.readyState == 4) && (req.status == 200)) {
		    callback(req);}};
	    var uri=compose_uri(base_uri,args);
	    req.open("GET",uri,true);
	    req.withCredentials='yes';
	    req.send(null);
	    return req;}
	fdjtAjax.revid="$Id: ajax.js 241 2010-04-27 19:47:00Z haase $";
	fdjtAjax.version=parseInt("$Revision: 241 $".slice(10,-1));

	fdjtAjax.textCall=function(callback,base_uri){
	    return fdjtAjax(function(req) {
		callback(req.responseText);},
			    base_uri,fdjtDOM.Array(arguments,2));};

	fdjtAjax.jsonCall=function(callback,base_uri){
	    return fdjtAjax(function(req) {
		callback(JSON.parse(req.responseText));},
			    base_uri,fdjtDOM.Array(arguments,2));};

	fdjtAjax.xmlCall=function(callback,base_uri){
	    return fdjtAjax(function(req) {
		callback(req.responseXML);},
			    base_uri,fdjtDOM.Array(arguments,2));};

	fdjtAjax.jsonpCall=function(uri,id,cleanup){
	    if ((id)&&($ID(id))) return false;
	    var script_elt=fdjtNewElement("SCRIPT");
	    if (id) script_elt.id=id;
	    if (cleanup) script_elt.oncleanup=cleanup;
	    script_elt.language='javascript';
	    script_elt.src=uri;
	    document.body.appendChild(script_elt);};

	fdjtAjax.jsonpFinish=function(id){
	    var script_elt=$ID(id);
	    if (!(script_elt)) return;
	    if (script_elt.oncleanup) script_elt.oncleanup();
	    fdjtDOM.remove(script_elt);};

	function add_query_param(parameters,name,value){
	    return ((parameters)?(parameters+"&"):(""))+
		name+"="+encodeURIComponent(value);}

	function formParams(form) {
	    fdjtUI.AutoPrompt.cleanup(form);
	    var parameters=false;
	    var inputs=fdjtDOM.getChildren(form,"INPUT");
	    var i=0; while (i<inputs.length) {
		var input=inputs[i++];
		if (!(input.disabled)) {
		    if (((input.type==="RADIO") || (input.type==="CHECKBOX")) ?
			(input.checked) : (true))
			parameters=add_query_param(parameters,input.name,input.value);
		    else parameters=add_query_param(parameters,input.name,input.value);}}
	    var textareas=fdjtDOM.getChildren(form,"TEXTAREA");
	    i=0; while (i<textareas.length) {
		var textarea=textareas[i++];
		if (!(textarea.disabled)) {
		    parameters=add_query_param(parameters,textarea.name,textarea.value);}}
	    var selectboxes=fdjtDOM.getChildren(form,"SELECT");
	    i=0; while (i<selectboxes.length) {
		var selectbox=selectboxes[i++]; var name=selectbox.name;
		var options=fdjtDOM.getChildren(selectbox,"OPTION");
		var j=0; while (j<options.length) {
		    var option=options[j++];
		    if (option.selected)
			parameters=add_query_param(parameters,name,option.value);}}
	    return parameters;}
	fdjtAjax.formParams=formParams;

	function add_field(result,name,value,multifields,downcase) {
	    if (downcase) name=name.toLowerCase();
	    if ((multifields)&&(fdjtKB.contains(multifields,name))) {
		if (result[name]) result[name].push(value);
		else result[name]=[value];}
	    else {
		var cur=result[name];
		if (!cur) result[name]=value;
		else if (cur instanceof Array) cur.push(value);
		else result[name]=[cur,value];}}

	function formJSON(form,multifields,downcase) {
	    fdjtUI.AutoPrompt.cleanup(form);
	    var result={};
	    var inputs=fdjtDOM.getChildren(form,"INPUT");
	    var i=0; while (i<inputs.length) {
		var input=inputs[i++];
		if ((!(input.disabled)) &&
		    (((input.type==="radio") || (input.type==="checkbox")) ?
		     (input.checked) : (true)))
		    add_field(result,input.name,input.value,multifields,downcase||false);}
	    var textareas=fdjtDOM.getChildren(form,"TEXTAREA");
	    i=0; while (i<textareas.length) {
		var textarea=textareas[i++];
		if (!(textarea.disabled)) 
		    add_field(result,textarea.name,textarea.value,multifields,downcase||false);}
	    var selectboxes=fdjtDOM.getChildren(form,"SELECT");
	    i=0; while (i<selectboxes.length) {
		var selectbox=selectboxes[i++]; var name=selectbox.name;
		var options=fdjtDOM.getChildren(selectbox,"OPTION");
		var j=0; while (j<options.length) {
		    var option=options[j++];
		    if (option.selected) add_field(result,name,option.value,multifields,downcase||false);}}
	    return result;}
	fdjtAjax.formJSON=formJSON;

	function ajaxSubmit(form){
	    var ajax_uri=form.getAttribute("ajaxaction");
	    if (!(ajax_uri)) return false;
	    var callback=false;
	    // Whether to do AJAX synchronously or not.
	    var syncp=form.getAttribute("synchronous");
	    if (form.oncallback) callback=form.oncallback;
	    else if (form.getAttribute("ONCALLBACK")) {
		callback=new Function
		("req","form",input_elt.getAttribute("ONCALLBACK"));
		form.oncallback=callback;}
	    if (trace_ajax)
		fdjtLog("Direct %s AJAX submit to %s for %o with callback %o",
			((syncp)?("synchronous"):("asynchronous")),
			ajax_uri,form,callback);
	    // Firefox doesn't run the callback on synchronous calls
	    var success=false; var callback_run=false;
	    var req=new XMLHttpRequest();
	    var params=formParams(form);
	    fdjtDOM.addClass(form,"submitting");
	    if (form.method==="GET")
		req.open('GET',ajax_uri+"?"+params,(!(syncp)));
	    else req.open('POST',ajax_uri,(!(syncp)));
	    req.withCredentials='yes';
	    req.onreadystatechange=function () {
		if (trace_ajax)
		    fdjtLog("Got callback (%d,%d) %o for %o, calling %o",
			    req.readyState,req.status,req,ajax_uri,callback);
		if ((req.readyState === 4) && (req.status>=200) && (req.status<300)) {
		    fdjtDOM.dropClass(form,"submitting");
		    success=true; 
		    if (callback) callback(req,form);
	      	    callback_run=true;}};
	    try {
		if (form.method==="GET") req.send();
		else {
		    req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		    req.send(params);}
		success=true;}
	    catch (ex) {}
	    if ((syncp) && (!(callback_run))) {
		if (trace_ajax)
		    fdjtLog("Running callback (rs=%d,status=%d) %o for %o, calling %o",
			    req.readyState,req.status,req,ajax_uri,callback);
		if ((req.readyState === 4) && (req.status>=200) && (req.status<300)) {
		    fdjtDOM.dropClass(form,"submitting");
		    success=true;
		    if (callback) callback(req,form);}};
	    return success;}
	fdjtAjax.formSubmit=ajaxSubmit;

	function jsonpSubmit(form){
	    var jsonp_uri=form.getAttribute("jsonpuri");
	    if (!(jsonp_uri)) return false;
	    var success=false;
	    var jsonid=((form.id)?("JSONP"+form.id):("FORMJSONP"));
	    var params=formParams(form);
	    fdjtDOM.addClass(form,"submitting");
	    try {
		jsonpCall(jsonp_uri+"?"+params,jsonid,
			  function(){fdjtDropClass(form,"submitting")});}
	    catch (ex) {
		jsonpFinish(jsonid);
		fdjtLog.warn("Attempted JSONP call signalled %o",ex);
		return false;}
	    return true;}

	function form_submit(evt){
	    evt=evt||event||null;
	    var form=fdjtUI.T(evt);
	    fdjtUI.AutoPrompt.cleanup(form);
	    if (fdjtDOM.hasClass(form,"submitting")) {
		fdjtDOM.dropClass(form,"submitting");
		return;}
	    // if (form.fdjtlaunchfailed) return;
	    form.fdjtsubmit=true;
	    fdjtDOM.addClass(form,"submitting");
	    if (ajaxSubmit(form)) {
		// fdjtLog("Ajax commit worked");
		fdjtUI.cancel(evt);
		return false;}
	    else if (jsonpSubmit(form)) {
		// fdjtLog("Json commit worked");
		fdjtUI.cancel(evt);
		return false;}
	    else return;}

	function copy_args(args,i){
	    var lim=args.length; if (!(i)) i=0;
	    var copy=new Array(lim-i);
	    while (i<lim) {copy[i]=args[i]; i++;}
	    return copy;}

	/* Synchronous calls */
	function sync_get(callback,base_uri,args){
	    var req=new XMLHttpRequest();
	    var uri=ajax_uri(base_uri,args);
	    req.open("GET",uri,false);
	    req.send(null);
	    if (callback) return callback(req);
	    else return req;}
	fdjtAjax.get=function(base_uri){
	    return sync_get(false,base_uri,copy_args(arguments,1));};
	fdjtAjax.getText=function(base_uri) {
	    return sync_get(function (req) { return req.responseText; },
			    base_uri,copy_args(arguments,1));};
	fdjtAjax.getJSON=function(base_uri) {
	    return sync_get(function (req) { return JSON.parse(req.responseText); },
			    base_uri,fdjtDOM.Array(arguments,1));};
	fdjtAjax.getXML=function(base_uri) {
	    return fdjtAjaxGet(function (req) { return JSON.parse(req.responseXML); },
			       base_uri,fdjtDOM.Array(arguments,1));};

	fdjtAjax.onsubmit=form_submit;

	return fdjtAjax;})();

/* Emacs local variables
;;;  Local variables: ***
;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
;;;  End: ***
*/
