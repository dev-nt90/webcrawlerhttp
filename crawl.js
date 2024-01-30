/* 
    If handling a URL with file path '.' and '..' markers, handle the pathing logic.
    e.g. /path/to/./resolve -> /path/to/resolve
         /path/to/../resolve -> /path/resolve
*/
function resolveDotSegments(inputPath){
    const outputSegments = [];
    const inputSegments = inputPath.split('/');

    for(const segment of inputSegments){
        if(segment === '..'){
            outputSegments.pop();
        }
        else if(segment !== '.' && segment !== ''){
            outputSegments.push(segment);
        }
    }

    const outputPath = outputSegments.join('/');
    return outputPath;
}

/* 
    Convert the Scheme and Host to Lowercase:
        Example: HTTP://Example.com becomes http://example.com

    Decode Percent-Encoding:
        Example: %20 becomes a space ( )

    Remove Default Ports:
        If a URL includes the default port (e.g., http://example.com:80), remove it.
        Example: http://example.com:80 becomes http://example.com

    Remove Dot Segments (e.g., . and ..):
        Example: /path/./to/../resource becomes /path/resource

    Sort Query Parameters:
        If there are query parameters, sort them alphabetically.
        Example: ?b=2&a=1 becomes ?a=1&b=2

    Remove Fragment:
        Example: http://example.com#section1 becomes http://example.com
*/
function normalizeURL(input){
    
    try{
        // do the initial decode to enable the URL ctor to extract the query params from the pathname
        // I don't know why this is required, but I spent far too long wrestling with it to care now.
        const decoded = decodeURIComponent(input);

        const inputAsUrl = new URL(decoded);
        
        inputAsUrl.protocol = inputAsUrl.protocol.toLowerCase();
        inputAsUrl.port = '';
        inputAsUrl.hash = '';
        inputAsUrl.pathname = resolveDotSegments(inputAsUrl.pathname);
        inputAsUrl.searchParams.sort();

        // TODO: why is decodeURI named that way, and why does decodeURIComponent do the whole URI?
        return decodeURIComponent(inputAsUrl);
    }
    catch(err){
        console.error(err.message);
    }
}

function getURLsFromHTML(htmlBody, baseURL){
    const urls = [];
    const {JSDOM} = require('jsdom');
    const dom = new JSDOM(htmlBody);

    const links = dom.window.document.querySelectorAll('a');

    for(let link of links){
        const href = link.getAttribute('href');
        if(href.startsWith('/')){
            // TODO: this assumes the relative links will always start with a "/"
            const linkWithLeadingSlashRemoved = href.slice(1); 
            const newLink = baseURL.concat('', linkWithLeadingSlashRemoved);

            urls.push(newLink)
        }
        else{
            urls.push(href);
        }   
    }

    return urls;
}

async function crawlPage(baseURL, currentURL, pages){
    try{
        // HACK: use the URL object to find the domain... 
        const baseURLObj = new URL(baseURL);
        const currentURLObj = new URL(currentURL);

        if(baseURLObj.hostname !== currentURLObj.hostname){
            // ...and bail out of scraping sites other than the target
            console.log(`mismatched base and current url hostnames; base hostname: ${baseURLObj.hostname}; current hostname: ${currentURLObj.hostname}`);
            return;
        }

        // normalize the URL, then figure out if we have seen this URL before, or if its equal to the base
        const currentURLNormalized = normalizeURL(currentURL);

        if(pages[currentURLNormalized] && currentURL !== baseURL){
            // if we've already seen this page, and it's not the base, increment and bail
            console.log(`found existing URL: ${currentURLNormalized}`);
            console.log(`current count: ${pages[currentURLNormalized]}`);
            pages[currentURLNormalized]++;
            return;
        }
        else if(baseURL !== currentURL){
            // otherwise if it's not the base, it's a new page, so add the key and set the value to 1
            pages[currentURLNormalized] = 1;
        }

        // get the content of the current page
        const response = await fetch(currentURL);
        const text = await tryGetResponseText(response);

        // get the internal links from the response content
        const links = getURLsFromHTML(text, baseURL);
        console.log(`found links ${links}`);

        for(let link of links){
            // to avoid infinite recursion, skip any links to the base and the current url
            if(link === currentURL || link === baseURL){
                continue;
            }
            console.log(`recursing into ${link}`);

            await crawlPage(baseURL, link, pages);
        }
    }
    catch(err){
        console.error(err.message);
    }
}

async function tryGetResponseText(response){
    if(!response){
        throw new Error(`Something went wrong with fetching the page. Response is undefined.`);
    }
    else if (response.status >= 400){
        throw new Error(`Something went wrong with fetching the page. Url: ${url} | Status: ${response.status}`);
    }
    // 'content-type' => { name: 'Content-Type', value: 'text/html; charset=utf-8' },
    // TODO: why is the get syntax able to find this value but indexing directly is not?
    else if (!response.headers.get('content-type').includes('text/html')){
        throw new Error(`Unsupported content type of ${response.headers['content-type'].value}`);
    }

    try{
        return await response.text();
    }
    catch(err){
        console.error(`something went wrong while getting response text: ${err.message}`);
    }
}

module.exports = {
    normalizeURL,
    getURLsFromHTML,
    crawlPage
}