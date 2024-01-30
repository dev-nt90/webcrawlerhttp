async function main(){
    // init
    const {argv} = require('node:process');
    const crawl = require('./crawl.js');

    if(argv.length > 3){
        console.error('too many arguments provided');
        process.exit(1);
    }

    if(argv.length < 3){
        console.error('not enough arguments provided');
        process.exit(2);
    }

    if(!argv){
        console.error('unexpected error parsing argv');
        process.exit(3);
    }

    const baseURL = argv[2];
    console.log(`starting at ${baseURL}; ${getTimeStamp()}`);

    // do the thing
    const pages = {baseURL: 0};
    await crawl.crawlPage(baseURL, baseURL, pages);

    // report results
    // TODO: this is ugly, there's probably a better way

    // start + raw content
    appendToLog(`start ${getTimeStamp()}
page counts
===========

`);
    
    for(const [key, value] of Object.entries(pages)){
        let content = `${key}: ${value};
`;
        appendToLog(content);
    }

    // sorted content
    appendToLog(`

sorted output
`);
    const sortedOutput = sortOutput(pages);

    for(const [key, value] of Object.entries(sortedOutput)){
        let content = `${key}: ${value}
`;
        appendToLog(content);
    }

    // exit
    appendToLog(`
============
exit ${getTimeStamp()}

`);
}

function appendToLog(content){
    console.log(`appending to log: ${content}`);

    const fs = require('node:fs');
    fs.writeFileSync(
        './crawl.log', 
        content, 
        {flag: 'a+'}, err => {})
}

function getTimeStamp(){
    const options = 
    { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit', 
        timeZoneName: 'short' 
    };

    return new Date().toLocaleString(undefined, options);
}

function sortOutput(output){
    // HACK: expects output is dictionary
    // HACK: javascript doesn't offer a built-in way to sort a dictionary by its output, so we must either (a) 
    // hand-roll our own sort, or (b) create an array and call sort() on that array 
    // this approach represents the latter
    var items = Object.keys(output)
        .map(
            (key) => {
                // transform each kvp into a 2-item array, meaning "items" is a 2-d array where each array is 2 elements
                return[key, output[key]] 
            });
    items.sort(
        (first, second) => {
            // for each comparison, compare the second item in our 2-item array, which happens to be the "value" from our original dictionary
            return first[1] - second[1] 
        });
    
    return items;
}
main();