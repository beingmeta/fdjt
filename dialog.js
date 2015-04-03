/* -*- Mode: Javascript; -*- */

/* ################# fdjt/dialog.js ###################### */

/* Copyright (C) 2012-2015 beingmeta, inc.

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
/* jshint browser: true */

/* Non-blocking alerts and messages */

fdjt.Dialog=(function(){
    
    "use strict";
    var fdjtDOM=fdjt.DOM;
    var fdjtLog=fdjt.Log;
    var fdjtUI=fdjt.UI;
    var fdjtID=fdjt.ID;
    var Template=fdjt.Template;
    var template=fdjt.Template;
    var Templates=fdjt.Templates;

    var hasClass=fdjtDOM.hasClass;
    var addClass=fdjtDOM.addClass;
    var addListener=fdjtDOM.addListener;
    var removeListener=fdjtDOM.removeListener;

    var countdown_serial=1; var countdown_tickers={};

    var redx_png="data:image/png;base64,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";

    function Dialog(spec){
        if (!(spec)) spec={};
        else if (typeof spec === "string") spec={spec: spec};
        var box=fdjtDOM((spec.spec)||("div.fdjtdialog"));
        if (spec.classes) {
            box.className=(box.className||"")+
                ((box.className)?(" "):(""))+
                spec.classes;}
        if (spec.style) box.setAttribute("style",spec.style);
        if (!((spec.modal)||(spec.keep)||
              (hasClass(box,"fdjtmodal"))||
              (hasClass(box,"fdjtkeep")))) {
            var countdown=fdjtDOM("div.countdown","Closing…");
            countdown.id="FDJTCOUNTDOWN"+(countdown_serial++);
            box.appendChild(countdown);}
        if (!((spec.modal)||(spec.noclose)||(hasClass(box,"fdjtmodal")))) {
            var close_button=fdjtDOM.Image(redx_png,"closebutton","Close");
            addListener(close_button,"click",close_dialog_handler);
            addListener(close_button,"touchend",close_dialog_handler);
            addListener(close_button,"touchstart",fdjtUI.cancel);
            close_button.title="click to close";
            box.appendChild(close_button);}
        if (spec.title) {
            if (spec.title.nodeType) elts.push(spec.title);
            else {
                var title_text=template(spec.title,spec,spec.data);
                box.title=title_text;
                box.appendChild(fdjtDOM("div.title",title_text));}}
        var elts=[]; var i=1, lim=arguments.length;
        while (i<lim) {
            var arg=arguments[i++];
            if (!(arg)) {}
            else if (arg.nodeType) box.appendChild(arg);
            else if (typeof arg === "string") {
                arg=Templates[arg]||arg;
                var ishtml=(arg.indexOf('<')>=0);
                var istemplate=(arg.search("{{")>=0);
                if ((ishtml)&&(istemplate))
                    box.appendChild(Template.toDOM(arg,spec));
                else if (ishtml)
                    fdjtDOM.append(box,arg);
                else if (istemplate)
                    box.appendChild(document.createTextNode(template(arg,spec)));
                else box.appendChild(document.createTextNode(arg));}
            else box.appendChild(document.createTextNode(arg.toString));}
        if ((spec.id)&&(!(box.id))) box.id=spec.id;
        fdjtDOM.addListeners(box,spec);
        return box;}
    var makeDialog=Dialog;

    function remove_dialog(evt){
        evt=evt||window.event;
        var target=((evt)?((evt.nodeType)?(evt):(fdjtUI.T(evt))):
                    ((fdjtID("FDJTALERT"))||(fdjtID("FDJTDIALOG"))));
        var box=fdjtDOM.getParent(target,".fdjtdialog");
        if (box) {
            var countdown=fdjtDOM.getChild(box,".countdown");
            if ((countdown)&&(countdown.id)) {
                var ticker=countdown_tickers[countdown.id];
                if (ticker) clearInterval(ticker);
                delete countdown_tickers[countdown.id];}
            clear_countdown(box);
            fdjtDOM.remove(box);}}
    
    function close_dialog(evt,fast){
        evt=evt||window.event;
        var target=((evt)?((evt.nodeType)?(evt):(fdjtUI.T(evt))):
                    ((fdjtID("FDJTALERT"))||(fdjtID("FDJTDIALOG"))));
        if ((evt)&&(!(evt.nodeType))) fdjtUI.cancel(evt);
        var box=fdjtDOM.getParent(target,".fdjtdialog");
        if (box) {
            clear_countdown(box);
            if (fast) fdjtDOM.remove(box);
            else {
                if ((fdjtDOM.transitionEnd)&&
                    (!(fdjtDOM.hasClass(box,"closing")))) {
                    fdjtDOM.addListener(box,fdjtDOM.transitionEnd,function(){
                        fdjtDOM.remove(box);});
                    fdjtDOM.addClass(box,"closing");}
                else fdjtDOM.remove(box);}}}
    Dialog.close=close_dialog;
    
    function clear_countdown(box){
        var countdown=fdjtDOM.getChild(box,".countdown");
        if (countdown) {
            var ticker=countdown_tickers[countdown.id];
            delete countdown_tickers[countdown.id];
            if (ticker) clearInterval(ticker);
            fdjtDOM.remove(countdown);}}

    function close_dialog_handler(evt){
        evt=evt||window.event;
        fdjtUI.cancel(evt);
        close_dialog(evt);}

    function stop_countdown_onclick(evt){
        evt=evt||window.event;
        var target=fdjtUI.T(evt);
        var box=fdjtDOM.getParent(target,".fdjtdialog");
        clear_countdown(box);
        box.style[fdjtDOM.transitionDelay]="";
        box.style[fdjtDOM.transitionDuration]="";
        fdjtDOM.dropClass(box,"countdown");
        fdjtDOM.dropClass(box,"closing");
        fdjtUI.cancel(evt);}

    function alertBox(){
        var args=fdjtDOM.toArray(arguments);
        var box=Dialog.apply(null,[{}].concat(args));
        addClass(box,"fdjtalert");}
    Dialog.alertBox=alertBox;
    fdjtUI.alertBox=alertBox;

    function alertfn(){
        var curbox=fdjtID("FDJTALERT");
        if (curbox) {
            curbox.id="";
            fdjtDOM.dropClass(curbox,"closing");
            remove_dialog(curbox);}
        var args=fdjtDOM.toArray(arguments);
        var box=Dialog.apply(null,[{}].concat(args));
        box.id="FDJTALERT"; fdjtDOM.prepend(document.body,box);
        return box;}
    Dialog.alert=alertfn;
    fdjtUI.alert=alertfn;
    fdjt.alert=alertfn;

    function setCountdown(box,timeout,whendone){
        var countdown=fdjtDOM.getChild(box,".countdown");
        countdown.innerHTML="…"+timeout+"…";
        var n=timeout;
        box.style[fdjtDOM.transitionDelay]=(n/2)+"s";
        box.style[fdjtDOM.transitionDuration]=(n/2)+"s";
        var ticker=setInterval(function(){
            if (n<=0) {
                clearInterval(ticker); ticker=false;
                delete countdown_tickers[countdown.id];
                if (whendone) whendone();
                fdjtDOM.remove(box);}
            else countdown.innerHTML="…"+(n--)+"…";},
                               1000);
        countdown_tickers[countdown.id]=ticker;
        countdown.onclick=stop_countdown_onclick;
        addListener(countdown,"touchend",stop_countdown_onclick);
        addListener(countdown,"touchstart",fdjtUI.cancel);
        setTimeout(function(){fdjtDOM.addClass(box,"closing");},10);
        return box;}
    Dialog.setCountdown=setCountdown;
    fdjtUI.setCountdown=setCountdown;

    function alertFor(timeout){
        var curbox=fdjtID("FDJTALERT");
        if (curbox) {
            curbox.id="";
            fdjtDOM.dropClass(curbox,"closing");
            remove_dialog(curbox);}
        var args=[{timeout: timeout}].concat(fdjtDOM.slice(arguments,1));
        var box=Dialog.apply(null,args);
        box.id="FDJTALERT"; fdjtDOM.prepend(document.body,box);
        setCountdown(box,timeout);
        return box;}
    Dialog.alertFor=alertFor;
    fdjtUI.alertFor=alertFor;

    function message(spec){
        var curbox=fdjtID("FDJTMESSAGE");
        if (curbox) {
            curbox.id="";
            fdjtDOM.dropClass(curbox,"closing");
            remove_dialog(curbox);}
        var args=fdjtDOM.toArray(arguments);
        var box=Dialog.apply(null,args);
        if (spec.timeout) setCountdown(box,spec.timeout);
        box.id="FDJTMESSAGE"; fdjtDOM.prepend(document.body,box);
        return box;}
    Dialog.message=message;
    fdjt.message=message;

    function makeChoice(spec,close_choice,i){
        var dom=spec.dom||
            ((spec.label)&&(fdjtDOM("button",spec.label)))||
            fdjtDOM("button","Choice "+i);
        dom.onmousedown=fdjtUI.cancel;
        dom.onmouseup=fdjtUI.cancel;
        dom.tabIndex=i;
        if (spec.title) dom.title=spec.title;
        dom.onclick=function(evt){
            evt=evt||window.event;
            var target=fdjtUI.T(evt);
            var choices=fdjtDOM.getParent(target,".choices");
            var cursel=fdjtDOM.getChild(choices,".selected");
            if (cursel===dom) {}
            else {
                if (cursel) {
                    fdjtDOM.dropClass(cursel,"selected");
                    cursel.blur();}
                fdjtDOM.addClass(dom,"selected");
                dom.focus();}
            if (spec.handler) spec.handler();
            fdjtUI.cancel(evt);
            close_choice();};
        addListener(dom,"touchstart",fdjtUI.cancel);
        addListener(dom,"touchend",dom.onclick);
        return dom;}

    function choose(spec){
        var box=false; var selection=-1, buttons=[], choices;
        var close_button=false, onchoose=false;
        function close_choice(){
            var i=0, lim=buttons.length;
            while (i<lim) {
                var button=buttons[i++];
                if (button.onclick)
                    removeListener(button,"touchend",button.onclick);
                removeListener(button,"touchstart",fdjtUI.cancel);
                button.onclick=null;
                button.onmousedown=null;
                button.onmouseup=null;}
            if (close_button) {
                removeListener(close_button,"touchend",close_button.onclick);
                removeListener(close_button,"touchstart",fdjtUI.cancel);
                close_button.onclick=null;}
            if (box) box.onclick=null;
            if (box) box.onkeydown=null;
            if (box) {
                var timeout=setTimeout(function(){
                    if (spec.onclose) spec.onclose(box);
                    remove_dialog(box);
                    clearTimeout(timeout);
                    timeout=false;},
                                       500);}}
        if (typeof spec === "function") 
            choices=[{label: "Cancel"},
                     {label: "OK",handler: spec,isdefault: true}];
        else if (spec.constructor === Array) choices=spec;
        else if (spec.choices) choices=spec.choices;
        else if ((spec.label)&&(spec.handler)) 
            choices=[{label: "Cancel"},spec];
        else if (spec.handler) 
            choices=[{label: "Cancel"},
                     {label: "OK",
                      handler: spec.handler,
                      isdefault: spec.isdefault}];
        else if (choices.length) choices=spec;
        else {
            fdjtLog.warn("Bad spec %o to fdjtUI.choose");
            return;}
        if (spec.onchoose) onchoose=spec.onchoose;
        var i=0, lim=choices.length;
        while (i<lim) {
            var choice=choices[i];
            var button=makeChoice(choice,close_choice,i);
            buttons.push(button);
            if ((selection<0)&&(choice.isdefault)) {
                button.setAttribute("autofocus","autofocus");
                fdjtDOM.addClass(button,"selected");
                selection=i;}
            i++;}
        if ((selection<0)&&(!(spec.nodefault))) {
            fdjtDOM.addClass(buttons[i],"selected");
            selection=0;}
        box=makeDialog(
            spec,fdjtDOM("div.message",fdjtDOM.slice(arguments,1)),
            fdjtDOM("div.choices",buttons));
        close_button=fdjtDOM.getChild(box,".closebutton");
        if (spec.cancel) {
            removeListener(close_button,"touchend",close_button.onclick);
            close_button.onclick=close_choice;
            addListener(close_button,"touchend",close_button.onclick);}
        else fdjtDOM.remove(close_button);
        
        var cancel=(spec.cancel)||false;
        
        // For accessibility, handle tab/enter
        box.onkeydown=function(evt){
            evt=evt||window.event;
            var kc=evt.keyCode;
            if (kc===9) {
                if (evt.shiftKey) selection--; else selection++;
                if (selection<0) selection=buttons.length-1;
                else if (selection>=buttons.length) selection=0;
                if (selection>=0) buttons[selection].focus();
                fdjtUI.cancel(evt);}
            else if (kc===13) {
                if ((selection>=0)&&(choices[selection])&&
                    (choices[selection].handler)) {
                    (choices[selection].handler)();}
                if ((onchoose)&&(selection>=0)&&(choices[selection]))
                    onchoose(choices[selection],box);
                close_choice();
                fdjtUI.cancel(evt);}
            else if ((cancel)&&(kc===27)) {
                close_choice();
                fdjtUI.cancel(evt);}};
        fdjtDOM.addClass(box,"fdjtconfirm"); box.id="FDJTDIALOG";
        fdjtDOM.prepend(document.body,box);
        if (spec.timeout)
            setCountdown(box,spec.timeout,function(){
                if (spec.noauto) {
                    close_choice();
                    return;}
                if ((selection>=0)&&(choices[selection])&&
                    (choices[selection].handler)) {
                    (choices[selection].handler)();}
                if ((onchoose)&&(selection>=0)&&(choices[selection]))
                    onchoose(choices[selection],box);});
        if (selection>=0) buttons[selection].focus();
        return box;}
    Dialog.Choice=choose;
    Dialog.choose=choose;
    fdjtUI.choose=choose;
    fdjt.Choice=choose;

    fdjt.UI.Dialog=Dialog;
    return Dialog;})();

/* Emacs local variables
   ;;;  Local variables: ***
   ;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
   ;;;  indent-tabs-mode: nil ***
   ;;;  End: ***
*/

