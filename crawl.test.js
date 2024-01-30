const crawl = require('./crawl');
const {test, expect} = require('@jest/globals');

// normalizeURL tests
test('no change test', () => {
    expect(crawl.normalizeURL('http://dev.test/')).toBe('http://dev.test/')
});

test('fix protocol single char test', () => {
    expect(crawl.normalizeURL('htTp://dev.test/')).toBe('http://dev.test/')
});

test('fix protocol multi char test', () => {
    expect(crawl.normalizeURL('HTTP://dev.test/')).toBe('http://dev.test/')
});

test('single char encoding test', () => {
    expect(crawl.normalizeURL('http://dev.test/asdf%20qwer/')).toBe('http://dev.test/asdf qwer')
});

test('multi char encoding test', () => {
    expect(crawl.normalizeURL('http://dev.test/asdf%20qwer/search%3Ftest%3D1')).toBe('http://dev.test/asdf qwer/search?test=1')
});

test('port strip', () => {
    expect(crawl.normalizeURL('http://dev.test:8080/asdf/')).toBe('http://dev.test/asdf')
});

test('param sort idempotent test', () => {
    expect(crawl.normalizeURL('http://dev.test/asdf_qwer/search%3Ftest%3D1%26yest%3D2')).toBe('http://dev.test/asdf_qwer/search?test=1&yest=2')
});

test('param sort test', () => {
    expect(crawl.normalizeURL('http://dev.test/asdf_qwer/search%3Fyest%3D1%26test%3D2')).toBe('http://dev.test/asdf_qwer/search?test=2&yest=1')
});

test('remove fragment', () => {
    expect(crawl.normalizeURL('http://dev.test/asdf_qwer#content')).toBe('http://dev.test/asdf_qwer')
});

// getURLsFromHTML tests
test('home link test', () => {
    expect(
        crawl.getURLsFromHTML(
            `<html>
            <body>
            <a href="http://dev.test/"></a>
            </body>
            </html>`, 
            'http://dev.test/'))
    .toStrictEqual(['http://dev.test/'])
});

test('one relative link test', () => {
    expect(
        crawl.getURLsFromHTML(
            `<html>
            <body>
            <a href="/search"></a>
            </body>
            </html>`, 
            'http://dev.test/'))
    .toStrictEqual(['http://dev.test/search'])
});