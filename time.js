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

/* Time functions */

var fdjtTime=
  (function (){
    function fdjtTime() {
      return (new Date()).getTime();}
    fdjtTime.revid="$Id$";
    fdjtTime.version=parseInt("$Revision$".slice(10,-1));

    var fdjt_loaded=(new Date()).getTime();
    fdjtTime.tick=function(){
      return (new Date()).getTime()/1000;};

    fdjtTime.tick2string=function(tick){
      return (new Date(tick*1000)).toString();};

    fdjtTime.tick2date=function(tick){
      return (new Date(tick*1000)).toDateString();};

    fdjtTime.dateString=function(tstamp){
      return tstamp.toDateString();};
    fdjtTime.tick2string=function(tick){
      return (new Date(tick*1000)).toString();};
    fdjtTime.tick2date=function(tick){
      return (new Date(tick*1000)).toDateString();};

    fdjtTime.secs2string=function(interval){
      if (interval===1)
	return _("%1 second",interval);
      else if (interval<10)
	return _("%1 seconds",interval);
      else if (interval<60)
	return _("~%1 seconds",Math.round(interval/60));
      else if (interval<120) {
	var minutes=Math.floor(interval/60);
	var seconds=Math.round(interval-(minutes*60));
	if (seconds===1)
	  return _("one minute, one second");
	else return _("one minute, %1 seconds",seconds);}
      else if (interval<3600) {
	var minutes=Math.floor(interval/60);
	return _("~%1 minutes",minutes);}
      else if (interval<(2*3600)) {
	var hours=Math.floor(interval/3600);
	var minutes=Math.round((interval-(hours*3600))/60);
	if (minutes===1)
	  return _("one hour and one minutes");
	else return _("one hour, %1 minutes",minutes);}
      else if (interval<(24*3600)) {
	var hours=Math.floor(interval/3600);
	return _("~%1 hours",hours);}
      else if (interval<(2*24*3600)) {
	var hours=Math.floor((interval-24*3600)/3600);
	if (hours===1)
	  return _("one day and one hour");
	else return _("one day, %1 hours",hours);}
      else if (interval<(7*24*3600)) {
	var days=Math.floor(interval/(24*3600));
	return _("%1 days",days);}
      else if (interval<(14*24*3600)) {
	var days=Math.floor((interval-(7*24*3600))/(24*3600));
	if (days===1)
	  return "one week and one day";
	else return _("one week and %1 days",days);}
      else {
	var weeks=Math.floor(interval/(7*24*3600));
	var days=Math.round((interval-(days*7*24*3600))/(7*24*3600));
	return _("%1 weeks, %2 days",weeks,days);}};

    fdjtTime.secs2short=function(interval){
      // This is designed for short intervals
      if (interval<0.001)
	return Math.round(interval*1000000)+"us";
      else if (interval<0.1)
	return Math.round(interval*1000)+"ms";
      else if (interval<120)
	return (Math.round(interval*100)/100)+"s";
      else {
	var min=Math.round(interval/60);
	var secs=Math.round(interval-min*6000)/100;
	return min+"m"+secs+"s";}};

    fdjtTime.runTimes=function(pname,start){
      var point=start; var report="";
      var i=2; while (i<arguments.length) {
	var phase=arguments[i++]; var time=arguments[i++];
	report=report+"; "+phase+": "+
	  ((time.getTime()-point.getTime())/1000)+"s";
	point=time;}
      return pname+" "+((point.getTime()-start.getTime())/1000)+"s"+report;};

    fdjtTime.diffTime=function(time1,time2){
      if (!(time2)) time2=new Date();
      var diff=time1.getTime()-time2.getTime();
      if (diff>0) return diff/1000; else return -(diff/1000);
    };

    fdjtTime.loaded=(new Date()).getTime();

    fdjtTime.ET=function(arg){
      if (!(arg)) arg=new Date();
      return (arg.getTime()-fdjt_loaded)/1000;};

    return fdjtTime;})();

var fdjtET=fdjtTime.ET;

/* Emacs local variables
;;;  Local variables: ***
;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
;;;  End: ***
*/
