
////////////
(function(){
    ////////////    
        // _st is not always, not correctly or not immediately available when previewing in the interface?
        var toJSON   =  ( _st ? _st.util.encodeJson : JSON.stringify );
        var fromJSON =  ( _st ? _st.util.decodeJson : JSON.parse     );
        
        var getSortedKeys = function( obj ){
        // returns a sorted array of keys from obj
            var keys = []; 
            for( var k in obj ) keys.push( parseInt( k, 10 ) );
            keys.sort();
            return keys;
        };
        
        var sameKeys = function( a, b ){
            return toJSON( getSortedKeys( a ) ) === toJSON( getSortedKeys( b ) );
        };
        
        var toPermissionObject = function( obj, pkey ){	
            var keys = getSortedKeys( obj );		
            var result = {};
            for( var i=0; i<keys.length; i++ ){
                result[ keys[i] ] = keys[i] <= pkey;
            }
            return result;		
            
        };
        
        var fromPermissionObject = function( obj ){
            var keys = getSortedKeys( obj );		
            var result;
            for( var i=0; i<keys.length; i++ ){
                if( obj[keys[i]] ) result = keys[i];
            }
            return "" + result;		
        };
        
        var parseItems = function( str ){
        // parse items by newlines, strip spaces, * and - from the lines
            var trimmer = /^[\s\uFEFF\xA0\*\-]+|[\s\uFEFF\xA0]+$/g;		
            var sx = str.split("\n");
            for( var i=0; i<sx.length; i++ ){
                sx[i] = sx[i].replace( trimmer, '' );
            }
            return sx;
        };
    
        var iframe_widget = function( title, id, template, cssText ){
            
            // Create iframe
            var iframe = document.createElement('iframe');
            
            iframe.className = id;
            iframe.style.cssText = cssText;
            iframe.id = id;

            document.body.appendChild(iframe);
            
            if(!document.getElementById('r42CookieBg')) {
                var dimDiv = document.createElement('div');
                dimDiv.id = 'r42CookieBg';
                dimDiv.style.display = "block";
                document.body.appendChild(dimDiv);
            }
            
            var win = iframe.contentWindow;				
            var doc = win.document;	
            
            var includes = function(){
              window.send = function( msg, arg ){
                window.parent._stCookiePopup['send_' + msg]( arg );
              };
              window.redraw = function(){		
                window.parent._stCookiePopup.reconfigureView();
                document.body.innerHTML = window.parent._stCookiePopup.Mustache.render( window.template, window.parent._stCookiePopup.view );
              };
            };	
            
    
            // Format the code to write to the iframe
            var nl = "\n";
            var wrappedCode = '<!DOCTYPE html>' + nl + '<head><title> Relay42 Cookie ' + title +  '</title>'
                            + '<style>' + nl + (window._stCookiePopup.config.css||"") + nl + '</style>'
                            + '<scri' + 'pt> window.template = ' + toJSON( template ) + '; (' + includes + ')();</sc' + 'ript>'
                            + '</head><body class="' + title + '">' 
                            + window._stCookiePopup.Mustache.render( template, window._stCookiePopup.view ) + '</body>';
    
            // Init function to be called from iframe
            doc.open();
            doc.write( wrappedCode );
            doc.close();
            
            return iframe;
        };
    
        var isEmptyObject = function( obj ){  
        // returns true if obj is like {}
            if( typeof obj !== "object" ) return true; 
            for ( var prop in obj ){ 
                if( obj.hasOwnProperty( prop ) ) return false; 
            } return true; 
        };
    
        var create_widget = function( tag, css ){
        // creates and appends a new dom node
            var widget = document.createElement( tag );
            widget.style.cssText = css;
            document.body.appendChild( widget );
            return widget;
        };
        
    
    
    /* ST-COOKIE-POPUP */
    
        window._stCookiePopup = {};
        window._stCookiePopup.view = {};
        
        window._stCookiePopup.configure = function( cfg ){ 
            
            // clean up the config
            this.config =  fromJSON( toJSON( cfg ) );
            this.config.eventualPermissionObject = toPermissionObject( this.config.groups, this.config.eventualPermission );
            this.config.defaultPermissionObject  = toPermissionObject( this.config.groups, this.config.defaultPermission  );
            this.config.maxViews = parseInt( this.config.maxViews+"", 0 );					
            for( var k in this.config.items ) this.config.items[k] = parseItems( this.config.items[k] );
            
            // request current permission object		
            this.level = _st.cookiepermission.getCookiePreferences();
            
            // is permission set? is it set to the same set of group-numbers as exist today?
            if( sameKeys( this.level, this.config.groups ) ){
              this.permission = true;    			
            } else {
              this.permission = false;
              this.level = this.config.defaultPermissionObject;  
            }
            
            // request current popup view count
            this.views = _st.cookiepermission.getPopupViewCount();
            
            // do we have a maximum and is the number of views higher or equal to this maximum?
            if( !this.permission && (this.config.maxViews !== -1) && (this.views >= this.config.maxViews)  ){
                this.level = this.config.eventualPermissionObject;
                this.permission = true;
                _st.cookiepermission.setCookiePreferences( this.level );
                eval( this.config.onAutoAccept || "" );			
                _st.core.executeTags();
            }
            
            this.reconfigureView();
            
        };
        
        
        window._stCookiePopup.reconfigureView = function(){		
            
            // split permission items in two arrays
            this.view.items_yes = []; 
            this.view.items_no  = [];
            for( var k in this.config.items ){
                if( this.level[k] ) this.view.items_yes = this.view.items_yes.concat( this.config.items[k] );
                else                this.view.items_no  = this.view.items_no.concat( this.config.items[k] );  
            }
            
            // set level as a usable value
            this.view.level_no = fromPermissionObject( this.level );
            this.view.level_id = this.config.groups[ this.view.level_no ].groupId;
            this.view.level_name = this.config.groups[ this.view.level_no ].name;
            
            // provide groups as an array
            this.view.groups = [];
            for( var k in this.config.groups ){			
                this.view.groups.push( { number: k, name: this.config.groups[k].name, active: this.level[k], selected: this.view.level_no === k } );
            }
        };
        
        window._stCookiePopup.showIfNotSet = function(){
            if( !this.permission ) this.showPopup();
        };
        
    /* EVENTS */    
        
        window._stCookiePopup.send_level = function( level ){
            if( level ) this.level = toPermissionObject( this.config.groups, level );		
        };
        
        window._stCookiePopup.send_popup_accept = function(){
            _st.cookiepermission.setCookiePreferences( this.level );
            this.permission = true;
            eval( this.config.onPopupAccept || "" );
            this.hideSettings();
            this.hidePopup();
            this.hideBlocker();
            _st.core.executeTags();
        };
        
        window._stCookiePopup.send_popup_close = function(){
            _st.cookiepermission.setCookiePreferences({1: true, 2: false, 3: false});
            this.permission = true;
            eval( this.config.onPopupClose || "" );
            this.hideSettings();
            this.hidePopup();
            this.hideBlocker();
        };
        
        window._stCookiePopup.send_popup_settings = function(){
           eval( this.config.onPopupSettings || "" );
           this.showSettings();   
        };
        
        window._stCookiePopup.send_settings_accept = function(){
            _st.cookiepermission.setCookiePreferences( this.level );
            this.permission = true;
            eval( this.config.onSettingsAccept || "" );
            this.hideSettings();
            this.hidePopup();
            this.hideBlocker();
            _st.core.executeTags();
        };
        
        window._stCookiePopup.send_settings_close = function(){
            eval( this.config.onCloseSettings || "" );
            this.hideBlocker();
            this.hideSettings();
        };
        
    /* BLOCKER */
    
        var blocker;
        
        window._stCookiePopup.hideBlocker = function(){
            if( blocker ) document.body.removeChild( blocker );
            blocker = undefined;
        };
        window._stCookiePopup.showBlocker = function(){
            this.hideBlocker();
            blocker = create_widget("div",this.config.cssBlocker);
        };
        
    /* POPUP */
       
        window._stCookiePopup.hidePopup = function(){
            var popup = document.getElementById("r42CookieBar");
            if( popup ) {                
                popup.setAttribute('style','display:none');
                document.body.removeChild( popup );
                if(document.getElementById("r42CookieBg")) {
                    var bg = document.getElementById("r42CookieBg");
                    bg.parentNode.removeChild(bg);
					document.body.focus(); // for a11y
                }
            }
        };
        window._stCookiePopup.showPopup = function(){
            eval( this.config.onShowPopup || '' );
            this.views = this.views + 1;  
            _st.cookiepermission.setPopupViewCount( this.views );
            this.hidePopup();
            
            var popup = iframe_widget( 'popup', 'r42CookieBar', this.config.htmlPopup, this.config.cssPopup);  
            
            var r42PopupOriginalHeight = parseInt(popup.style.height, 10);
            var r42PopupAtBottom = parseInt(popup.style.bottom, 10) == 0;
			
			/* a11y */
			var keepFocus = function (context) {
				var tabbableElements = 'a[href], input[type=button], button';
				
				var allTabbableElements = context.querySelectorAll(tabbableElements);
				// exclude hidden elements
				allTabbableElements =  Array.prototype.filter.call(allTabbableElements, function(element) {
					if (element.offsetWidth > 0 && element.offsetHeight > 0) {
						return element;
					}
  				});

				var firstTabbableElement = allTabbableElements[0];
				var lastTabbableElement = allTabbableElements[allTabbableElements.length - 1];

				var keyListener = function (event) {
					var keyCode = event.which || event.keyCode; // Get the current keycode

					// Polyfill to prevent the default behavior of events
					event.preventDefault = event.preventDefault || function () {
						event.returnValue = false;
					};

					// If it is TAB
					if (keyCode === 9) {
						// Move focus to first element that can be tabbed if Shift isn't used
						if (event.target === lastTabbableElement && !event.shiftKey) {
							event.preventDefault();
							firstTabbableElement.focus();

						// Move focus to last element that can be tabbed if Shift is used
						} else if (event.target === firstTabbableElement && event.shiftKey) {
							event.preventDefault();
							lastTabbableElement.focus();
						}
					}
				};

				context.addEventListener('keydown', keyListener, false);
			};
			
			try {
				if (popup) {
					var cookieHeading = popup.contentWindow.document.querySelectorAll('.cookieHeading')[0];

					if (cookieHeading) {
						cookieHeading.focus();
					}

					keepFocus(popup.contentWindow.document);
				}
			} catch(e) {
				// ignore
			}
			/*-- end a11y --*/
            
            var resizeFunction = function() {
                var popup = document.getElementById("r42CookieBar");
                if( popup && popup.contentDocument.body) {
                    popup.style.height = Math.max(popup.contentDocument.body.offsetHeight, r42PopupOriginalHeight) + "px";

                    var diff = (popup.offsetTop + popup.offsetHeight) - document.documentElement.clientHeight;

					if(diff > 0 && r42PopupAtBottom) {
						popup.style.bottom = diff + "px";
					}
                }
            };
                
            if(window.attachEvent) {
                window.attachEvent('onresize', resizeFunction);
            } else if(window.addEventListener) {
                window.addEventListener('resize', resizeFunction);
            }
			
			popup.onload = function() {
            	resizeFunction();
			};
            
            resizeFunction();
        };
        
    /* SETTINGS */
    
        var settings;
        
        window._stCookiePopup.hideSettings = function(){
            if( settings ) { 
                document.body.removeChild( settings );
                //var bg = document.getElementById("r42CookieBg");
                //bg.parentNode.removeChild(bg);
            }
            settings = undefined;
        };
        window._stCookiePopup.showSettings = function(){
            eval( this.config.onShowSettings || '' ); 
            this.hideSettings();
            this.showBlocker();
            settings = iframe_widget( 'settings', 'r42CookieSettings', this.config.htmlSettings, this.config.cssSettings);
        };
        
    
    /* jshint ignore:start */
    // MUSTACHE
    !function(e,t){t(e.Mustache={})}(window._stCookiePopup,function(e){function t(e){return"function"==typeof e}function n(e){return e.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g,"\\$&")}function r(e,t){return d.call(e,t)}function o(e){return!r(v,e)}function i(e){return String(e).replace(/[&<>"'\/]/g,function(e){return g[e]})}function s(t,r){function i(){if(_&&!m)for(;g.length;)delete v[g.pop()];else g=[];_=!1,m=!1}function s(e){if("string"==typeof e&&(e=e.split(y,2)),!f(e)||2!==e.length)throw new Error("Invalid tags: "+e);p=new RegExp(n(e[0])+"\\s*"),l=new RegExp("\\s*"+n(e[1])),h=new RegExp("\\s*"+n("}"+e[1]))}if(!t)return[];var p,l,h,d=[],v=[],g=[],_=!1,m=!1;s(r||e.tags);for(var U,E,j,T,C,S,V=new c(t);!V.eos();){if(U=V.pos,j=V.scanUntil(p))for(var P=0,A=j.length;A>P;++P)T=j.charAt(P),o(T)?g.push(v.length):m=!0,v.push(["text",T,U,U+1]),U+=1,"\n"===T&&i();if(!V.scan(p))break;if(_=!0,E=V.scan(x)||"name",V.scan(w),"="===E?(j=V.scanUntil(k),V.scan(k),V.scanUntil(l)):"{"===E?(j=V.scanUntil(h),V.scan(b),V.scanUntil(l),E="&"):j=V.scanUntil(l),!V.scan(l))throw new Error("Unclosed tag at "+V.pos);if(C=[E,j,U,V.pos],v.push(C),"#"===E||"^"===E)d.push(C);else if("/"===E){if(S=d.pop(),!S)throw new Error('Unopened section "'+j+'" at '+U);if(S[1]!==j)throw new Error('Unclosed section "'+S[1]+'" at '+U)}else"name"===E||"{"===E||"&"===E?m=!0:"="===E&&s(j)}if(S=d.pop())throw new Error('Unclosed section "'+S[1]+'" at '+V.pos);return u(a(v))}function a(e){for(var t,n,r=[],o=0,i=e.length;i>o;++o)t=e[o],t&&("text"===t[0]&&n&&"text"===n[0]?(n[1]+=t[1],n[3]=t[3]):(r.push(t),n=t));return r}function u(e){for(var t,n,r=[],o=r,i=[],s=0,a=e.length;a>s;++s)switch(t=e[s],t[0]){case"#":case"^":o.push(t),i.push(t),o=t[4]=[];break;case"/":n=i.pop(),n[5]=t[2],o=i.length>0?i[i.length-1][4]:r;break;default:o.push(t)}return r}function c(e){this.string=e,this.tail=e,this.pos=0}function p(e,t){this.view=e,this.cache={".":this.view},this.parent=t}function l(){this.cache={}}var h=Object.prototype.toString,f=Array.isArray||function(e){return"[object Array]"===h.call(e)},d=RegExp.prototype.test,v=/\S/,g={"&":"&","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;","/":"&#x2F;"},w=/\s*/,y=/\s+/,k=/\s*=/,b=/\s*\}/,x=/#|\^|\/|>|\{|&|=|!/;c.prototype.eos=function(){return""===this.tail},c.prototype.scan=function(e){var t=this.tail.match(e);if(!t||0!==t.index)return"";var n=t[0];return this.tail=this.tail.substring(n.length),this.pos+=n.length,n},c.prototype.scanUntil=function(e){var t,n=this.tail.search(e);switch(n){case-1:t=this.tail,this.tail="";break;case 0:t="";break;default:t=this.tail.substring(0,n),this.tail=this.tail.substring(n)}return this.pos+=t.length,t},p.prototype.push=function(e){return new p(e,this)},p.prototype.lookup=function(e){var n,r=this.cache;if(e in r)n=r[e];else{for(var o,i,s=this,a=!1;s;){if(e.indexOf(".")>0)for(n=s.view,o=e.split("."),i=0;null!=n&&i<o.length;)i===o.length-1&&null!=n&&(a="object"==typeof n&&n.hasOwnProperty(o[i])),n=n[o[i++]];else null!=s.view&&"object"==typeof s.view&&(n=s.view[e],a=s.view.hasOwnProperty(e));if(a)break;s=s.parent}r[e]=n}return t(n)&&(n=n.call(this.view)),n},l.prototype.clearCache=function(){this.cache={}},l.prototype.parse=function(e,t){var n=this.cache,r=n[e];return null==r&&(r=n[e]=s(e,t)),r},l.prototype.render=function(e,t,n){var r=this.parse(e),o=t instanceof p?t:new p(t);return this.renderTokens(r,o,n,e)},l.prototype.renderTokens=function(e,t,n,r){for(var o,i,s,a="",u=0,c=e.length;c>u;++u)s=void 0,o=e[u],i=o[0],"#"===i?s=this._renderSection(o,t,n,r):"^"===i?s=this._renderInverted(o,t,n,r):">"===i?s=this._renderPartial(o,t,n,r):"&"===i?s=this._unescapedValue(o,t):"name"===i?s=this._escapedValue(o,t):"text"===i&&(s=this._rawValue(o)),void 0!==s&&(a+=s);return a},l.prototype._renderSection=function(e,n,r,o){function i(e){return s.render(e,n,r)}var s=this,a="",u=n.lookup(e[1]);if(u){if(f(u))for(var c=0,p=u.length;p>c;++c)a+=this.renderTokens(e[4],n.push(u[c]),r,o);else if("object"==typeof u||"string"==typeof u||"number"==typeof u)a+=this.renderTokens(e[4],n.push(u),r,o);else if(t(u)){if("string"!=typeof o)throw new Error("Cannot use higher-order sections without the original template");u=u.call(n.view,o.slice(e[3],e[5]),i),null!=u&&(a+=u)}else a+=this.renderTokens(e[4],n,r,o);return a}},l.prototype._renderInverted=function(e,t,n,r){var o=t.lookup(e[1]);return!o||f(o)&&0===o.length?this.renderTokens(e[4],t,n,r):void 0},l.prototype._renderPartial=function(e,n,r){if(r){var o=t(r)?r(e[1]):r[e[1]];return null!=o?this.renderTokens(this.parse(o),n,r,o):void 0}},l.prototype._unescapedValue=function(e,t){var n=t.lookup(e[1]);return null!=n?n:void 0},l.prototype._escapedValue=function(t,n){var r=n.lookup(t[1]);return null!=r?e.escape(r):void 0},l.prototype._rawValue=function(e){return e[1]},e.name="mustache.js",e.version="2.0.0",e.tags=["{{","}}"];var _=new l;e.clearCache=function(){return _.clearCache()},e.parse=function(e,t){return _.parse(e,t)},e.render=function(e,t,n){return _.render(e,t,n)},e.to_html=function(n,r,o,i){var s=e.render(n,r,o);return t(i)?void i(s):s},e.escape=i,e.Scanner=c,e.Context=p,e.Writer=l});
    /* jshint ignore:end */
    ////
    })();
    /////
    
    
_stCookiePopup.configure({"maxViews":"-1","defaultPermission":3,"eventualPermission":3,"groups":{"1":{"name":"Noodzakelijk","groupId":"f62f3713-1138-4b52-b1cb-7a2c39a48abc"},"2":{"name":"Functioneel","groupId":"289ccdd5-613c-4368-b467-89fc958416b4"},"3":{"name":"Extern","groupId":"097a77de-99c8-45b6-a8ce-9814b9b5f8e9"}},"items":{"1":"Noodzakelijk en Statistiek","2":"Functioneel","3":"Marketing en Social","never":""},"onShowPopup":"try {\n\t_st.counter.call('6'); // Shown\n\t\n\t// Google Analytics event\n\t_st.util.gtagPush('ga',{\n\t\t'event_category': 'Cookiebar',\n\t\t'event_action': 'Shown',\n\t\t'non_interaction': 1\n\t});\n} catch (e) {\n\ttry {\n\t\ttry {\n\t\t\tRaven.captureException(e);\n\t\t} catch (e) {\n\t\t\t// Ignore\n\t\t}\n\t\t\n\t\t_st.counter.call('38'); // ShowPopupError\n\t} catch (e) {\n\t\t// Ignore\n\t}\n}","onPopupAccept":"try {\n\t_st.counter.call('4'); // Accept\n\n\t// Set cookies\n\t_st.util.setCookie('cookieConsentStatus','1|2|3', 365, 'ns.nl');\n\t_st.util.setCookie('cookiePref', '1|2|3', 365, 'ns.nl');\n\t\n\t// R42 event\n\t_st.event.publish('cookieConsent', 'consentGiven');\n\t\n\t// R42 Engagement\n\t_st.tracking.sendEngagement('CookieAccept', {'accepted': 'yes', 'level': '1|2|3'});\n\t_st.tracking.sendEngagement('cookieConsentStatus', {'accepted': 'yes', 'level': '1|2|3'});\n\t\n\t// Google Analytics event\n\t_st.util.gtagPush('ga',{\n\t\t'dimension21': '1|2|3',\n\t\t'event_category': 'Cookiebar',\n\t\t'event_action': 'Accepted',\n\t\t'event_label': '1|2|3',\n\t\t'non_interaction': 1\n\t});\n} catch (e) {\n\ttry {\n\t\ttry {\n\t\t\tRaven.captureException(e);\n\t\t} catch (e) {\n\t\t\t// Ignore\n\t\t}\n\t\t\n\t\t_st.counter.call('39'); // AcceptError\n\t} catch (e) {\n\t\t// Ignore\n\t}\n}","onPopupSettings":"","onPopupClose":"try {\n\t_st.counter.call('5'); // Deny\n\t\n\t// Cookies\n\t_st.util.setCookie('cookieConsentStatus','1', 365, 'ns.nl');\n\t_st.util.setCookie('cookiePref', '1', 365, 'ns.nl');\n\n\t// R42 Engagement\n\t_st.tracking.sendEngagement('CookieAccept', {'accepted': 'no', 'level': '1'});\n\t_st.tracking.sendEngagement('cookieConsentStatus', {'accepted': 'no', 'level': '1'});\n\t\n\t// Google Analytics event\n\t_st.util.gtagPush('ga',{\n\t\t'dimension21': '1',\n\t\t'event_category': 'Cookiebar',\n\t\t'event_action': 'Declined',\n\t\t'event_label': '1',\n\t\t'non_interaction': 1\n\t});\n\n} catch (e) {\n\ttry {\n\t\ttry {\n\t\t\tRaven.captureException(e);\n\t\t} catch (e) {\n\t\t\t// Ignore\n\t\t}\n\t\t\n\t\t_st.counter.call('40'); // onPopupCloseError\n\t} catch (e) {\n\t\t// Ignore\n\t}\n}","onShowSettings":"","onSettingsAccept":"","onSettingsClose":"","onAutoAccept":"","htmlPopup":"<section class=\"cookieSection\">\n\n\t<h1 class=\"cookieHeading\" tabindex=\"-1\">\n\t\t<span lang=\"en\">Cookies</span> op NS.nl\n\t</h1>\n\n\t<p class=\"cookieText\">\n\t\t\n\t\t<span class=\"cookieText--small\">\n\t\t\tOp websites van NS gebruiken NS en derde partijen tracking cookies (e.a. technologieën). Met deze cookies wordt informatie over uw internet-, aankoop- en leesgedrag (van nieuwsbrieven) binnen (en mogelijk ook buiten) onze websites verzameld om advertenties, content en commerci&euml;le e-mailcommunicatie aan uw interesses en profiel  aan te kunnen passen. U kunt uw gegeven toestemming altijd weer intrekken. Meer informatie vindt u op <a href=\"http://www.ns.nl/cookiebeleid\" target=\"_blank\">ns.nl/cookiebeleid</a>.\n\t\t</span>\n\t\t\n\t\t<span class=\"cookieText--large\">\n\t\t\tDe websites van NS Groep N.V. maken gebruik van cookies en daarmee vergelijkbare technieken. NS gebruikt functionele en analytische cookies om u een optimale gebruikerservaring te bieden op haar websites. Daarnaast plaatsen NS en derde partijen tracking cookies. Deze cookies kunnen informatie over u verzamelen en uw internet-, aankoop- en leesgedrag (van nieuwsbrieven) binnen (en mogelijk ook buiten) onze websites volgen. Met deze informatie kunnen advertenties, content en commerci&euml;le e-mailcommunicatie aan uw interesses en profiel worden aangepast. Klik op \"Akkoord\" of \"Niet akkoord\" om de tracking cookies te accepteren of te weigeren. U kunt uw gegeven toestemming altijd weer intrekken. Meer informatie vindt u op <a href=\"http://www.ns.nl/cookiebeleid\" target=\"_blank\">ns.nl/cookiebeleid</a>.\n\t\t</span>\n\t\t\n\t</p>\n\n\t<div class=\"cookieButtons\">\n\n\t\t<a class=\"button cancel\" href=\"javascript:send('popup_close')\">Niet akkoord</a>\n\n\t\t<a class=\"button accept\" href=\"javascript:send('popup_accept')\">Akkoord</a>\n\n\t</div>\n\n</section>","htmlSettings":"<a class='popup-close' href='javascript:send(\"settings_close\")'><span class=\"icon\"></span></a>\n<div class='scroll'>\n\t\n\t<h1>Cookie instellingen</h1>\n\n\t<h2>Kies uw gewenste instelling</h2>\n\t{{#groups}}\n\t<div class='keuze'>\n\t\t<input type=\"radio\" id=\"keuze{{number}}\" name='keuze' {{#selected}}checked{{/selected}} onchange='send(\"level\", {{number}}); redraw();'><label for=\"keuze{{number}}\">{{name}}</label>\n\t</div>\t\t\t\n\t{{/groups}}\n\n\n\t<div class='groups'>\n\t\t<h2>Voor <i>{{level_name}}</i> plaatsen wij de volgende cookies:</h2>\n\t\t<ul>\n\t\t\t{{#items_yes}}\t\n\t\t\t\t<li>{{.}}</li>\t\t\n\t\t\t{{/items_yes}}\n\t\t</ul>\n\t</div>\t\n</div>\n\n\n<div class='buttons'>\n\t<a class='button save' href='javascript:send(\"settings_accept\")'>Opslaan</a>\n\t<a class='button cancel' href='javascript:send(\"settings_close\")'>Annuleren</a>\n</div>","cssPopup":"","cssSettings":"","cssBlocker":"","css":"html,body,section{-webkit-box-sizing:border-box;box-sizing:border-box;height:100%}body{margin:0;padding:0;line-height:1.5;color:#060922;font-family:\"NS Sans\",\"Segoe UI\",Myriad,Verdana,sans-serif}a{color:#0079d3}.button{display:inline-block;font-size:.9375rem;line-height:25px;text-align:center;text-decoration:none;color:#060922;font-weight:normal;padding:10px 12px;-webkit-box-shadow:0 -0.125rem 0 #e6e6e9 inset;box-shadow:0 -0.125rem 0 #e6e6e9 inset;border-radius:4px}@media screen and (min-width: 640px){.button{min-width:7.5rem}}@media screen and (min-width: 480px){.button{padding-left:18px;padding-right:18px}}.accept{background-color:#0079d3;-webkit-box-shadow:0 -0.125rem 0 #005ca0 inset;box-shadow:0 -0.125rem 0 #005ca0 inset;color:#fff}.cancel{background-color:#e6e6e9;-webkit-box-shadow:0 -0.125rem 0 #b5b5bc inset;box-shadow:0 -0.125rem 0 #b5b5bc inset;color:#070721}.cookieSection{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;-webkit-box-orient:vertical;-webkit-box-direction:normal;-webkit-flex-direction:column;-ms-flex-direction:column;flex-direction:column;-webkit-box-pack:justify;-webkit-justify-content:space-between;-ms-flex-pack:justify;justify-content:space-between;background-color:#fff;padding:20px;font-size:.75rem}@media screen and (min-device-width: 480px){.cookieSection{font-size:.8125rem}}.cookieHeading{-webkit-flex-basis:auto;-ms-flex-preferred-size:auto;flex-basis:auto;font-size:1.75rem;color:#003082;font-weight:normal;margin-top:0;margin-bottom:20px}.cookieHeading:focus{outline:0}@media screen and (min-device-width: 640px){.cookieHeading{font-size:1.875rem}}.cookieText{-webkit-flex-basis:100%;-ms-flex-preferred-size:100%;flex-basis:100%;overflow:auto;height:55vh;margin-top:0;margin-bottom:0;padding-bottom:19px}@media screen and (min-device-width: 320px){.cookieText{height:45vh}}@media screen and (min-device-width: 912px){.cookieText{height:auto}}@media screen and (min-width: 600px){.cookieText--small{display:none}}.cookieText--large{display:none}@media screen and (min-width: 600px){.cookieText--large{display:block}}.cookieButtons{-webkit-flex-basis:auto;-ms-flex-preferred-size:auto;flex-basis:auto;position:relative;text-align:right;padding-top:20px}.cookieButtons:before{position:absolute;top:-20px;right:0;left:0;display:block;content:'';height:20px;background:-webkit-gradient(linear, left top, left bottom, from(rgba(255,255,255,0)), to(#fff));background:linear-gradient(to bottom, rgba(255,255,255,0) 0%, #fff 100%)}.cookieButtons .button{margin-right:10px}.cookieButtons .button+.button{margin-right:0}@media screen and (min-width: 480px){.cookieButtons .button{margin-right:20px}}"});
