//@Author: Robert Wettlaufer

var TRENDS = {};

TRENDS.nameSortAscending     = true;
TRENDS.locationSortAscending = true;

TRENDS.blackList = new Array("no","the","a","an","some","any","my","our","their",
                             "her","his","each","every","certain","its","another",
                             "this","that", "without", "your", "cant", "me", "us",
                             "you");

TRENDS.Location = {
    23424977: "U.S.A.",
    23424775: "Canada",
    23424975: "U.K.",
    23424900: "Mexico",
    2358820:  "Baltimore",
    2442047:  "L.A.",
    2367105:  "Boston",
    2459115:  "N.Y.C.",
    2450022:  "Miami",
    23424856: "Japan",
    23424908: "Nigeria",
    2458833:  "New Orleans",
    2357024:  "Atlanta",
    23424738: "U.A.E.",
    23424803: "Ireland",
    2378426:  "Charlotte",
    2451822:  "Milwaukee",
    2427032:  "Indianapolis",
    2471217:  "Philadelphia",
    2391585:  "Detroit",
    2466256:  "Orlando",
    2473224:  "Pittsburgh",
    2480894:  "Richmond",
    2457170:  "Nashville",
    2487956:  "San Francisco",
    28218:    "Manchester"
};

TRENDS.init = function() {
    "use strict";
    // var $location = $("#location"),
    //     key;

    // for (key in TRENDS.Location) {
    //     $location.append('<option></option>').attr("value", key).text(TRENDS.Location[key]);
    // }


    $("#location").change( function() {
        var geoId = $("#location").val();
        TRENDS.get(geoId);
    });

    $("#nameSort").click( function() {
        if (!TRENDS.nameSortAscending) {
            myTrends.drawNameAscending();
            TRENDS.nameSortAscending = true;
        } else {
            myTrends.drawNameDescending();
            TRENDS.nameSortAscending = false;
        }
    });

    $("#locationSort").click( function() {
        if (!TRENDS.locationSortAscending) {
            myTrends.drawLocationAscending();
            TRENDS.locationSortAscending = true;
        } else {
            myTrends.drawLocationDescending();
            TRENDS.locationSortAscending = false;
        }
    });

    TRENDS.get("23424977");
};

TRENDS.get = function( geoId ) {
    var newTrend;

    myAccordion.clear();
    $.ajax({
        url: 'http://api.twitter.com/1/trends/' + geoId + '.json',
        dataType: 'jsonp',
        success: function( data ) {
            $.each(data[0].trends, function( i ) {
                newTrend = new trend(data[0].trends[i].name, data[0].trends[i].url, Number(geoId));
                myAccordion.appendTwitterTerm(newTrend);
                TrendContainer.pushTrend(newTrend.getKey(), newTrend);
                TRENDS.getJsonDefinitions(newTrend);
                myTrends.drawNameAscending();
            });
        }
    });
};


TRENDS.getJsonDefinitions = function( trend ) {
    var $container = $("#" + trend.selectorName),
        url        = 'http://api.urbandictionary.com/v0/define?',
        entry, term, max, i;
    // Check to see if the div has been written to already. This happens when
    // a trend is listed twice in the return, which can happen during the height
    // of a new trend. Grab the next occurence where the 'filled' attribute is 
    // still set to false.
    if ($container.attr('filled') === "true") {
        $container = $("#" + trend.selectorName + '[filled = "false"]');
    }
    $container.attr('filled', 'true');
    $container.append('<span id="ub-title">Related hits from ' +
                       '<a href="http://www.UrbanDictionary.com">UrbanDictionary</a>' +
                       '</span><br /><br />');
    $.getJSON(url, {term: trend.ajaxName}, function( json, textStatus ) {
        if (json.result_type !== "no_results") {
            // Only draw 4 definitions, for now
            max = json.list.length < 4 ? json.list.length : 4;

            for (i = 0; i < max; i++) {
                entry = json.list[i];
                term = new urbanTerm(entry, trend);
                myAccordion.appendTerm(entry, trend);
            }
        } else {
            $container.append('No results found.');
        }
    });
};

TRENDS.getDefinitions = function( trend ) {
    var url = document.URL.substring(0, 52) + "/srv/UBScrape.php?t=";

    $.ajax({
        url:  url + trend.ajaxName,
        dataType: 'xml',
        success: function( data ) {
            ubTermHandler(trend, data);
        }
    });
};

ubTermHandler = function( trend, ubReturn ) {
    var uTerm, term, definition, example, $entry, $container;

    $container = $('#' + trend.selectorName);
    if ($container.data("used") === "true") {
        $container = $('#' + trend.selectorName + ' :last');
    }
    $container.data("used", "true");
    $container.append('<span id="ub-title">Related hits from ' +
                       '<a href="http://www.UrbanDictionary.com">Urban Dictionary</a>' +
                       '</span><br /><br />');
    if (!$(ubReturn).find('Message').text()) {
        $(ubReturn).find('Entry').each(function( index, value ) {
            //-----
            // uTerm = new urbanTerm($(this));
            // TermContainer.push(uTerm);
            //-----
            if ( index < 4 ) {
                $entry     = $(this);
                term       = $entry.find('Term').text();
                definition = $entry.find('Definition').text();
                example    = $entry.find('Example').text();
                myAccordion.appendUrbanDictionary($container, term, definition, example,
                                                  trend.ajaxName.split("+"), true);
            }
        });
    } else {
        $container.append('No results found.');
    }
};

var myAccordion = {

    appendTwitterTerm: function( trend ) {
        var html = '<h3><a href="' + trend.url + '">' + trend.displayName + '</a></h3>' +
            '<div id="' + trend.selectorName + '" style="font-size:80%">' +
            '<a href="' + trend.url + '" style="font-size:70%"><u>Twitter link</u></a>' +
            '<br /><br /></div>';
        $("#accordion").append(html)
            .accordion('destroy')
            .accordion({
                clearStyle: true,
                autoHeight: false
            });
    },

    appendUrbanDictionary: function( container, term, definition, example, words) {
        var html = [], i;

        for (i = 0; i < words.length; i++) {
            definition = formatter.highlight(String(words[i]), definition);
            example    = formatter.highlight(String(words[i]), example);
        }
        html.push('<b>Term: </b>' + term + '<br />');
        html.push('<b>Definition: </b>' + definition + '<br />');
        html.push('<b>Example: </b>' + example + '<br /><br />');
        container.append(html.join(""));
    },


    buildUrbanDictionaryTerm: function( words, definition, example ) {
        var html = [],
            i    = 0;

        for (i; i < words.length; i++) {
            definition = formatter.highlight(String(words[i]), definition);
            example    = formatter.highlight(String(words[i]), example);
        }
        html.push('<b>Term: </b>' + term + '<br />');
        html.push('<b>Definition: </b>' + definition + '<br />');
        html.push('<b>Example: </b>' + example + '<br /><br />');
        return html.join("");
    },

    clear: function() {
        $("#accordion").html('').accordion();
    }
};

var formatter = {

    selector: function( name ) {
        return name.replace(/^#|\s+/g, '');
    },

    ajax: function( name ) {
        return name.replace(/^#/g, '')
            .replace(/([A-Z](?![A-Z]|$))/g, '+$1') //Convert Camel Case
            .replace(/\s+|\&/g, '+')
            .replace(/\+\+/g, '+')
            .replace(/^\+/g, ''); // Remove '+' from start
    },

    geoIdToString: function( id ) {
        return TRENDS.Location[id];
    },

    highlight: function( word, text ) {
        var regEx = new RegExp('(' + word + ')|(' + word.toLowerCase() + ')', "g"),
            i;

        text = text.replace(regEx, function(match) {
            for (i = 0; i < TRENDS.blackList.length; i++) {
                if (match.toUpperCase() === TRENDS.blackList[i].toUpperCase()) {
                    return match;
                }
            }
            return '<span class="wordMatch">' + match + '</span>';
        });
        return text;
    }
};

var myTrends = {
    clear: function() {
        $('#trendEntry tr:gt(1)').remove();
    },
    drawNameAscending: function() {
        myTrends.clear();
        $('#trendEntry').append(TrendContainer.nameAscendingToString());
    },
    drawNameDescending: function() {
        myTrends.clear();
        $('#trendEntry').append(TrendContainer.nameDescendingToString());
    },
    drawLocationAscending: function() {
        myTrends.clear();
        $('#trendEntry').append(TrendContainer.locationAscendingToString());
    },
    drawLocationDescending: function() {
        myTrends.clear();
        $('#trendEntry').append(TrendContainer.locationDescendingToString());
    },
    drawCustomSort: function( sortFunc ) {
        myTrends.clear();
        $('#trendEntry').append(TrendContainer.locationDescendingToString());
    }
};

/*
    Define the 'trend' and 'urbanTerm' objects
 */
function trend( name, url, geoId ) {
    this.displayName  = name;
    this.url          = url;
    this.selectorName = formatter.selector(name);
    this.ajaxName     = formatter.ajax(name);
    this.geoId        = geoId;
    this.geoIdString  = formatter.geoIdToString(geoId);
};

trend.prototype.toRowString = function() {
    return '<tr><td><a href ="' + this.url + '" </a>' + 
                this.displayName + '</td><td>' + this.geoIdString +
            '</td></tr>';
};

trend.prototype.getKey = function() {
    return this.displayName + '-' + this.geoIdString;
};

function urbanTerm( $entry ) {
    this.word       = $entry.find('Term').text();
    this.definition = $entry.find('Definition').text();
    this.example    = $entry.find('Example').text();
    this.upVotes    = parseInt($entry.find('UpVotes').text(), null);
    this.downVotes  = parseInt($entry.find('DownVotes').text(), null);
};

urbanTerm.prototype.getScore = function() {
    return this.upVotes - this.downVotes;
};

urbanTerm.prototype.isPositive = function() {
    return this.getScore > 0;
};

var TrendContainer = function() {
    "use strict";

    var _pushTrend, _getTrend, _clearTrends, _entriesToString, _count, _getSortedArray,
    _nameAscending, _nameDescending, _locationAscending, _locationDescending, i,
    _trendEntries = _trendEntries || {};

    _pushTrend = function( k, v ) {
        if (k === undefined) {
            return false;
        }
        _trendEntries[k] = v;
        return true;
    };

    _getTrend = function( k ) {
        if (k === undefined) {
            return null;
        }
        if (_trendEntries.hasOwnProperty(k)) {
            return trendEntries[k];
        }
    };

    _clearTrends = function() {
        _trendEntries = {};
    };

    _entriesToString = function( func ) {
        var htmlString   = [], sortedTrends = [],
            i;
        sortedTrends = _getSortedArray(func);
        for (i = 0; i < sortedTrends.length; i++) {
            htmlString.push(sortedTrends[i][1].toRowString());
        }
        return htmlString.join("");
    };

    _getSortedArray = function( func ) {
        var returnArray = [],
            key;
        for (key in _trendEntries) {
            if (_trendEntries.hasOwnProperty(key)) {
                returnArray.push([key, _trendEntries[key]]);
            }
        }
        return returnArray.sort(func);
    };

    _nameAscending = function( a, b ) {
        if (a[1].selectorName > b[1].selectorName) {
            return 1;
        } else if (a[1].selectorName < b[1].selectorName) {
            return -1;
        }
        return 0;
    };

    _nameDescending = function( a, b ) {
        if (a[1].selectorName < b[1].selectorName) {
            return 1;
        } else if (a[1].selectorName > b[1].selectorName) {
            return -1;
        }
        return 0;
    };

    _locationAscending = function(a , b ) {
        if (a[1].geoIdString > b[1].geoIdString) {
            return 1;
        }
        if (a[1].geoIdString < b[1].geoIdString) {
            return -1;
        }
        return 0;
    };

    _locationDescending = function( a, b ) {
        if (a[1].geoIdString < b[1].geoIdString) {
            return 1;
        }
        if (a[1].geoIdString > b[1].geoIdString) {
            return -1;
        }
        return 0;
    };

    _count = function() {
        return Object.keys(_trendEntries).length;
    };

    return {
        pushTrend: function( k, v ) {
            return _pushTrend(k, v);
        },
        getTrend: function( k ) {
            return _getTrend(k);
        },
        clearTrends: function() {
            _clearTrends();
        },
        /*
            This function can be used to pass in any kind of sorting function
            you wish to sort the trend objects. The defaults that are bound
            to the table buttons "Name" and "Location" buttons are defined
            below.
         */
        entriesToString: function( func ) {
            return _entriesToString(func);
        },
        nameAscendingToString: function() {
            return _entriesToString(_nameAscending);
        },
        nameDescendingToString: function() {
            return _entriesToString(_nameDescending);
        },
        locationAscendingToString: function() {
            return _entriesToString(_locationAscending);
        },
        locationDescendingToString: function() {
            return _entriesToString(_locationDescending);
        }
    };

}();

var TermContainer = function() {
    "use strict";

    var _pushTerm, _getTerm, _clearTerms, _entriesToString, _count, _getSortedArray,
    _nameAscending, _nameDescending, _locationAscending, _locationDescending,
    i;

    var _termEntries = _termEntries || {};

    _pushTerm = function( k, v ) {
        if (k === undefined) {
            return false;
        }
        _termEntries[k] = v;
        return true;
    };

    _getTerm = function( k ) {
        if (k === undefined) {
            return null;
        }
        if (_termEntries.hasOwnProperty(k)) {
            return _termEntries[k];
        }
    };

    _clearTerms = function() {
        _termEntries = {};
    };

    _entriesToString = function( func ) {
        var htmlString   = [];
        var sortedTerms = [],
            i;
        sortedTerms = _getSortedArray(func);
        for (i = 0; i < sortedTerms.length; i++) {
            htmlString.push(sortedTerms[i][1].toRowString());
        }
        return htmlString.join("");
    };

    _getSortedArray = function(func) {
        var returnArray = [],
            key;
        for (key in _termEntries) {
            if (_termEntries.hasOwnProperty(key)) {
                returnArray.push([key, _termEntries[key]]);
            }
        }
        return returnArray.sort(func);
    };

    _nameAscending = function(a, b) {
        if (a[1].selectorName > b[1].selectorName) {
            return 1;
        } else if (a[1].selectorName < b[1].selectorName) {
            return -1;
        }
        return 0;
    };

    _nameDescending = function(a, b) {
        if (a[1].selectorName < b[1].selectorName) {
            return 1;
        } else if (a[1].selectorName > b[1].selectorName) {
            return -1;
        }
        return 0;
    };

    _locationAscending = function(a, b) {
        if (a[1].geoIdString > b[1].geoIdString) {
            return 1;
        }
        if (a[1].geoIdString < b[1].geoIdString) {
            return -1;
        }
        return 0;
    };

    _locationDescending = function(a, b) {
        if (a[1].geoIdString < b[1].geoIdString) {
            return 1;
        }
        if (a[1].geoIdString > b[1].geoIdString) {
            return -1;
        }
        return 0;
    };

    _count = function() {
        return Object.keys(_termEntries).length;
    };

    return {
        pushTerm: function(k, v) {
            return _pushTerm(k, v);
        },
        getTerm: function(k) {
            return _getTerm(k);
        },
        clearTerms: function() {
            _clearTerms();
        },
        /*
            This function can be used to pass in any kind of sorting function
            you wish to sort the Term objects. The defaults that are bound
            to the table buttons "Name" and "Location" buttons are defined
            below.
         */
        entriesToString: function(func) {
            return _entriesToString(func);
        },
        nameAscendingToString: function() {
            return _entriesToString(_nameAscending);
        },
        nameDescendingToString: function() {
            return _entriesToString(_nameDescending);
        },
        locationAscendingToString: function() {
            return _entriesToString(_locationAscending);
        },
        locationDescendingToString: function() {
            return _entriesToString(_locationDescending);
        }
    };

}();

$(document).ready(TRENDS.init);