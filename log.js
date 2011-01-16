/* -*- Mode: Javascript; -*- */

/* Copyright (C) 2009-2011 beingmeta, inc.
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

function fdjtLog(string){
    var output=false;
    if ((fdjtLog.doformat)&&(typeof fdjtString !== 'undefined'))
	output=fdjtString.apply(null,arguments);
    if (fdjtLog.console_fn) {
	if (output) fdjtLog.console_fn.call(fdjtLog.console,output);
	else fdjtLog.console_fn.apply(fdjtLog.console,arguments);}
    if ((fdjtLog.console)&&(fdjtLog.console.nodeType)) {
	var entry=fdjtDOM("div.fdjtlog",fdjtDOM("span.time",fdjtET()));
	if (output) fdjtDOM(entry,output);
	else fdjtDOM(entry,fdjtString.apply(null,arguments));
	fdjtDOM.append(fdjtLog.console,entry);}
    if ((fdjtLog.useconsole)||
	((!(fdjtLog.console))&&(!(fdjtLog.console_fn))))
	if ((window.console) && (window.console.log) &&
	    (window.console.count)) {
	    if (output)
		window.console.log.call(
		    window.console,"["+fdjtET()+"s] "+output);
	    else {
		var newargs=new Array(arguments.length+1);
		newargs[0]="[%fs] "+string;
		newargs[1]=fdjtET();
		var i=1; var lim=arguments.length;
		while (i<lim) {newargs[i+1]=arguments[i]; i++;}
		window.console.log.apply(window.console,newargs);}}}
fdjtLog.console=null;
fdjtLog.id="$Id$";
fdjtLog.version=parseInt("$Revision$".slice(10,-1));

fdjtLog.warn=function(string){
  if ((!(fdjtLog.console_fn))&&
      (!(window.console)&&(window.console.log)&&(window.console.log.count))) {
    var output=fdjtString.apply(null,arguments);
    alert(output);}
  else fdjtLog.apply(null,arguments);};

fdjtLog.uhoh=function(string){
  if (fdjtLog.debugging) fdjtLog.warn.call(this,arguments);}

fdjtLog.bkpt=function(string){
  var output=false;
  if ((fdjtLog.doformat)&&(typeof fdjtString !== 'undefined'))
    output=fdjtString.apply(null,arguments);
  if (fdjtLog.console_fn)
    if (output) fdjtLog.console_fn(fdjtLog.console,output);
    else fdjtLog.console_fn.apply(fdjtLog.console,arguments);
  else if ((window.console) && (window.console.log) &&
	   (window.console.count))
    if (output)
      window.console.log.call(window.console,output);
    else window.console.log.apply(window.console,arguments);
};

// This is for temporary trace statements; we use a different name
//  so that they're easy to find.
var fdjtTrace=fdjtLog;

/* Emacs local variables
;;;  Local variables: ***
;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
;;;  End: ***
*/
