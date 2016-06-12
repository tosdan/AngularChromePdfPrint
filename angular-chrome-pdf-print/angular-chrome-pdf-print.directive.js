/* globals angular,$,console */
/**
 * @author Daniele Tosi
 * @license MIT
 * {@link https://github.com/tosdan/AngularChromePdfPrint GitHub Repository}
 */
(function () {
    'use strict';

    angular
        .module("angular-chrome-pdf-print", [])
        .directive("angularChromePdfPrint", angularChromePdfPrint);

    function angularChromePdfPrint($q, $timeout, $parse) {

        var directive = {
            restrict: "A",
            link: link
        };
        return directive;

        function link(scope, dirElem, attrs) {
            var urls = $parse(attrs.urls)(scope),
                busy = !!attrs.busy ? $parse(attrs.busy) : null,
                allSrcLoaded = false,
                parentElem = dirElem.parent(),
                iframeCache = [];
            
            
            function printIframeContent(iframe) {
                iframe.focus();
                iframe.contentWindow.print();                
            } // printIframeContent
            
            
            function concatTimeoutPrintPromise(promise, iframe, index, array) {
                return promise.then(function () {
                    return $timeout(function () {
                        printIframeContent(iframe);
                    }, (500 * +(!!index)));
                    // al primo giro non c'è attesa: index = 0, !!0 => false, +false => 0 (mentre !!(n>0) => true, +true => 1)
                });
            } // concatTimeoutPrintPromise
            
            
            function donePrinting() {
                allSrcLoaded = true;
                dirElem.prop('disabled', false);
            } // donePrinting
            
            
            function getLoadIframePromise(url) {
                var q = $q.defer();

                var $iframe = getNewIframe();
                var iframe = $iframe[0];
                iframeCache.push(iframe);

                iframe.onload = function () {
                    q.resolve();
                    printIframeContent(iframe);
                };

                $iframe.attr('src', url);
                parentElem.after($iframe);

                return q.promise;
            } // getLoadIframePromise

            
            function concatIframeLoadPromise(prevPromise, url, index, array) {
                return prevPromise.then(function () {
                    return getLoadIframePromise(url);
                });
            } // concatIframeLoadPromise


            function setBusy(promise) {
                if (!!busy && busy.assign) {
                    busy.assign(scope, promise);
                }
            } // setBusy
            
            
            function clickHandler() {
                var printingPromise;
                dirElem.prop('disabled', true);

                if (!allSrcLoaded) {
                    printingPromise = urls.reduce(concatIframeLoadPromise, $q.resolve());
                } else {
                    printingPromise = iframeCache.reduce(concatTimeoutPrintPromise, $q.resolve());
                }
                printingPromise.then(donePrinting);
                setBusy(printingPromise);
            } // clickHandler
            
            
            function init() {                
                if (!!urls && urls.length) {                    
                    if (!angular.isArray(urls)) {
                        urls = [urls];
                    }

                    dirElem.bind('click', clickHandler);

                } else {
                    console.error('Attributo "urls" mancante.');
                }
                
            } // init
            init();
            
        } // link

    } // angularChromePdfPrint
    
    function getNewIframe() {
        var ngIframe = angular.element('<iframe></iframe>');
        ngIframe.attr('width', '0px');
        ngIframe.attr('height', '0px');
        ngIframe.css('display', 'none');
        ngIframe.css('visibility', 'hidden');
        return ngIframe;
    } // getNewIframe

}()); // module