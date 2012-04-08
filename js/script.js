
var options = [];
chrome.extension.sendRequest({options: "get"}, function(opt){
    options = opt;
});

function lastQuery()
{
    var regex = new RegExp('[\?\&]q=([^\&#]+)');
    if(regex.test(window.location.href)) {
        var q = window.location.href.split(regex);
        q = q[q.length - 2].replace(/\+/g," ");

        if(options.dev)
            console.log(q)

        return decodeURIComponent(q);
    }
}

search(lastQuery());


var lasttime;
function qsearch(direct) {

    var instant = document.getElementsByClassName("gssb_a");
    if (instant.length !== 0 && !direct){
        var selected_instant = instant[0];
        
        var query = selected_instant.childNodes[0].childNodes[0].childNodes[0].
                    childNodes[0].childNodes[0].childNodes[0].innerHTML;
        query = query.replace(/<\/?(?!\!)[^>]*>/gi, '');

        if(options.dev)
            console.log(query);

        search(query);

    } else {
        search(document.getElementsByName("q")[0].value);
    }


}

// instant search
document.getElementsByName("q")[0].onkeyup = function(e){

    if(options.dev)
        console.log(e.keyCode);

    var fn = 'qsearch()';
    if(e.keyCode == 40 || e.keyCode == 38)
        fn = 'qsearch(true)';

    clearTimeout(lasttime);
    lasttime = setTimeout(fn, 700);

    // instant search suggestions box onclick
    document.getElementsByClassName("gssb_c")[0].onclick = function(){
        if(options.dev)
            console.log("clicked")

        qsearch(true);
    };
};

// click on search button
document.getElementsByName("btnG")[0].onclick = function(){
    qsearch();
};

function search(query)
{
   var request = {query: query};
    chrome.extension.sendRequest(request, function(response){
        renderZeroClick(response, query);
    });
    if (options.dev)
        console.log("query:", query);
 
}

function renderZeroClick(res, query) 
{
    if (options.dev)
        console.log(res);
    
    // disable on images
    if (document.getElementById('isr_pps') !== null)
        return;

    if (res['AnswerType'] !== "") {
        displayAnswer(res['Answer']);
    } else if (res['Type'] == 'A' && res['Abstract'] !== "") {
        displaySummary(res, query);
    } else {     
        switch (res['Type']){
            case 'E':
                displayAnswer(res['Answer']);
                break;

            case 'A':
                displayAnswer(res['Answer']);
                break;

            case 'C':
                displayCategory(res, query);
                break;

            case 'D':
                displayDisambiguation(res, query);
                break;

            default:
                hideZeroClick();
                break;
                    
        } 
    }
}

function hideZeroClick()
{
    var ddg_result = document.getElementById("ddg_zeroclick");
    if (ddg_result !== null)
        ddg_result.style.display = 'none';
}

function showZeroClick()
{
    var ddg_result = document.getElementById("ddg_zeroclick");
    if (ddg_result !== null)
        ddg_result.style.display = 'block';
}

function createResultDiv()
{
    var result = document.getElementById("center_col");
    var ddg_result = document.getElementById("ddg_zeroclick");
    showZeroClick();
    if (ddg_result === null) {
        result.innerHTML = '<div id="ddg_zeroclick"></div>' + result.innerHTML;
        ddg_result = document.getElementById("ddg_zeroclick");
    }
    return ddg_result;
}

function resultsLoaded()
{
    return document.getElementById("center_col") !== null;
}

function displayAnswer(answer)
{
    if (answer === '') {
        hideZeroClick();
        return;
    }
    if (resultsLoaded()) {
        var ddg_result = createResultDiv();
        ddg_result.className = "ddg_answer";
        ddg_result.innerHTML = answer;
    } else {
        setTimeout('displayAnswer("'+answer+'");', 200);
    }
}

function displaySummary(res, query) {
    var result = ''

    var img_url = res['AbstractURL'];
    var official_site = '';
    var first_category = ''
    var hidden_categories = '';


    if (res['Results'].length !== 0) {
        if(res['Results'][0]['Text'] === "Official site") {
            official_site = ' | ' + res['Results'][0]['Result'];
            img_url = res['Results'][0]['FirstURL'];
        }
    } 
    

    for (var i = 0; i < res['RelatedTopics'].length; i++){
        if (res['RelatedTopics'].length === 0)
            break;
        
        var link = res['RelatedTopics'][i]['Result'].
                    match(/<a href=".*">.*<\/a>/);
        
        if (i < 2) {
            var first = (i === 0)? ' class="first_category"': '';
            first_category += '<div class="ddg_zeroclick_category"'+ first + '>' + 
                                link +
                              '</div>';
        } else {
            hidden_categories += '<div class="ddg_zeroclick_category">' + 
                                link +
                              '</div>';
        }
    }

    if (hidden_categories !== '') {
        hidden_categories  = '<div id="ddg_zeroclick_more">' +
                                '<a href="javascript:;" onclick="' + 
                                    "this.parentElement.style.display='none';" +
                                    "this.parentElement.nextElementSibling.style.display='block'" +
                                '"> More related topics </a>' +
                             '</div>' + 
                                '<div style="display:none">' + 
                                    hidden_categories +
                                '</div>';
    }


    result += '<div id="ddg_zeroclick_header">' +
                '<a class="ddg_head" href="' + res['AbstractURL'] + '">'+ 
                    (res['Heading'] === ''? "&nbsp;": res['Heading']) +
                '</a>' + 
                '<a class="ddg_more" href="https://duckduckgo.com/?q='+ 
                    encodeURIComponent(query)
                +'"> See DuckDuckGo results </a>' +
                '</div>';
    
    if (res['Image']) {
        result += '<div id="ddg_zeroclick_image">' + 
                    '<a href="' + img_url +'">' + 
                        '<img class="ddg_zeroclick_img" src="' + res['Image']  +
                        '" />' +
                    '</a>' +
                  '</div>';
    }
    
    var source_base_url = res['AbstractURL'].match(/http.?:\/\/(.*?\.)?(.*\..*?)\/.*/)[2];
    var more_image = '<img src="http://duckduckgo.com/i/'+ source_base_url +'.ico" />';
    if (source_base_url === "wikipedia.org")
        more_image = '<img src="http://duckduckgo.com/assets/icon_wikipedia.v101.png" />';

    result += '<div id="ddg_zeroclick_abstract"><p>' + res['Abstract'] +
                '</p><div id="ddg_zeroclick_official_links">' + 
                    more_image + 
                    '<a class="ddg_more_link" href="' + res['AbstractURL'] + '"> More at ' +
                        res['AbstractSource'] +
                    '</a>' + official_site +
                '</div>' +
                 first_category + 
                 hidden_categories + 
              '</div><div class="clear"></div>';


    if(resultsLoaded()) {
        var ddg_result = createResultDiv();
        ddg_result.className = '';
        ddg_result.innerHTML = result;
    } else {
        setTimeout(function(){
            displaySummary(res, query);
        }, 200);
    }

}

function displayDisambiguation(res, query){
    
    var result = '';
    result += '<div id="ddg_zeroclick_header"> Meanings of ' +
                    res['Heading'] +

                '<a class="ddg_more" href="https://duckduckgo.com/?q='+ 
                    encodeURIComponent(query)
                +'"> See DuckDuckGo results </a>' +

              '</div>';

    var disambigs = '' 
    var hidden_disambigs = '';
    var others = '';
    var nhidden = 0;

   for (var i = 0; i < res['RelatedTopics'].length; i++){
        if (res['RelatedTopics'].length === 0)
            break;
        
        if (options.dev)
            console.log(res['RelatedTopics'][i]['Result']);
        
        // other topics
        if(res['RelatedTopics'][i]['Topics']) {
            var topics = res['RelatedTopics'][i]['Topics'];
            var output = '';
            for(var j = 0; j < topics.length; j++){
                output += '<div class="wrapper">' +
                            '<div class="icon_disambig">' + 
                                '<img src="' + topics[j]['Icon']['URL'] +'" />' +
                            '</div>' +
                            '<div class="ddg_zeroclick_disambig">' +
                                topics[j]['Result'] +
                            '</div>' +
                          '</div>';
            }
            others += '<div class="disambig_more">' +
                                '<a href="javascript:;" onclick="' + 
                                    "this.parentElement.nextElementSibling.style.display='block';" +
                                    "this.parentElement.innerHTML = '" + res['RelatedTopics'][i]['Name']  + "<hr>';" +
                                '"> ' + res['RelatedTopics'][i]['Name']  + ' ('+ topics.length + ')</a>' +
                             '</div>' + 
                                '<div style="display:none">' + 
                                    output +
                                '</div>';
            
            continue;
        }
            
 
        if (i <= 2) {
            disambigs += '<div class="wrapper">' +
                            '<div class="icon_disambig">' + 
                                '<img src="' + res['RelatedTopics'][i]['Icon']['URL'] +'" />' +
                            '</div>' +
                            '<div class="ddg_zeroclick_disambig">' +
                                res['RelatedTopics'][i]['Result'] +
                            '</div>' +
                          '</div>';
        } else {
            hidden_disambigs += '<div class="wrapper">' +
                                    '<div class="icon_disambig">' + 
                                        '<img src="' + res['RelatedTopics'][i]['Icon']['URL'] +'" />' +
                                    '</div>' +
                                    '<div class="ddg_zeroclick_disambig">' +
                                        res['RelatedTopics'][i]['Result'] +
                                    '</div>' +
                                  '</div>'; 
            nhidden++;
        }
    }
    
    if (hidden_disambigs!== '') {
        hidden_disambigs  = '<div class="disambig_more">' +
                                '<a href="javascript:;" onclick="' + 
                                    "this.parentElement.style.display='none';" +
                                    "this.parentElement.nextElementSibling.style.display='block'" +
                                '"> More ('+ nhidden + ')</a>' +
                             '</div>' + 
                                '<div style="display:none">' + 
                                    hidden_disambigs+
                                '</div>';
    }


    result += '<div id="ddg_zeroclick_abstract">' + 
                  disambigs +
                  hidden_disambigs +
                  others +
              '</div><div class="clear"></div>';
              
    
    if (options.dev)
        console.log(result);

    if(resultsLoaded()) {
        var ddg_result = createResultDiv();
        ddg_result.className = '';
        ddg_result.innerHTML = result;
    } else {
        setTimeout(function(){
            displayDisambiguation(res, query);
        }, 200);
    }

}

function displayCategory(res, query){
    var result = '';
    result += '<div id="ddg_zeroclick_header">' +
                    res['Heading'] +
                '<a class="ddg_more" href="https://duckduckgo.com/?q='+ 
                    encodeURIComponent(query)
                +'"> See DuckDuckGo results </a>' +
              '</div>';
    
    var categories = '';
    var hidden_categories = '';
    var nhidden = 0;
    for (var i = 0; i < res['RelatedTopics'].length; i++){
        if (res['RelatedTopics'].length === 0)
            break;
        
        if (options.dev)
            console.log(res['RelatedTopics'][i]['Result']);
 
        if (i <= 2) {
            categories += '<div class="wrapper">' +
                            '<div id="ddg_zeroclick_img" class="icon_category">' + 
                                '<img src="' + res['RelatedTopics'][i]['Icon']['URL'] +'" />' +
                            '</div>' +
                            '<div id="ddg_zeroclick_category_item">' +
                                res['RelatedTopics'][i]['Result'] +
                            '</div>' +
                          '</div>';
        } else {
            hidden_categories += '<div class="wrapper">' +
                                '<div id="ddg_zeroclick_img" class="icon_category">' + 
                                    '<img src="' + res['RelatedTopics'][i]['Icon']['URL'] +'" />' +
                                '</div>' +
                                '<div id="ddg_zeroclick_category_item">' +
                                    res['RelatedTopics'][i]['Result'] +
                                '</div>' +
                              '</div>';

            nhidden++;
        }

    }
    
    if (hidden_categories !== '') {
        hidden_categories = '<div class="category_more">' +
                                '<a href="javascript:;" onclick="' + 
                                    "this.parentElement.style.display='none';" +
                                    "this.parentElement.nextElementSibling.style.display='block'" +
                                '"> More ('+ nhidden + ')</a>' +
                             '</div>' + 
                                '<div style="display:none">' + 
                                    hidden_categories+
                                '</div>';
 
    }

    result += '<div id="ddg_zeroclick_abstract">' + 
                    categories +
                    hidden_categories +
                '</div>';
                
    
    if (options.dev)
        console.log(result);

    if(resultsLoaded()) {
        var ddg_result = createResultDiv();
        ddg_result.className = '';
        ddg_result.innerHTML = result;
    } else {
        setTimeout(function(){
            displayCategory(res, query);
        }, 200);
    }

}

