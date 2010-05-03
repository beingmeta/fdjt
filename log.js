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

function fdjtLog(string){
  var output=false;
  if ((fdjtLog.doformat)&&(typeof fdjtString !== 'undefined'))
    output=fdjtString.apply(null,arguments);
  if (fdjtLog.console_fn)
    if (output) fdjtLog.console_fn(fdjt_console_obj,output);
    else fdjtLog.console_fn.apply(fdjt_console_obj,arguments);
  else if ((window.console) && (window.console.log) &&
	   (window.console.count))
    if (output)
      window.console.log.call(window.console,output);
    else window.console.log.apply(window.console,arguments);}
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
    if (output) fdjtLog.console_fn(fdjt_console_obj,output);
    else fdjtLog.console_fn.apply(fdjt_console_obj,arguments);
  else if ((window.console) && (window.console.log) &&
	   (window.console.count))
    if (output)
      window.console.log.call(window.console,output);
    else window.console.log.apply(window.console,arguments);
};

/* Emacs local variables
;;;  Local variables: ***
;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
;;;  End: ***
*/
