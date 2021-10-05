const https = require('https');
const fs = require('fs');
const path = require('path');
const JSDOM = require("jsdom").JSDOM;

function numberlength(num) {
        return num.toString().length;
}

function pad(n, width, z='0') {
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
  }

function getHtml(url) {
    return new Promise((resolve, reject) => {
        console.log('Started Downloading html');
        https.get(url, (res) => {
            try {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => { console.log('Finished Downloading html'); resolve(data); });
            } catch (e) {
                reject(e);
            }
        }).on('error', reject);
    });
}

function extractLinks(html, ext) {
        return Object.values((new JSDOM(html)).window.document.querySelectorAll("a"))
            .map(({ href }) => href)
            .filter(link => link && link.indexOf(`.${ext}`) > 0)
    }

    async function download(textUrl, ext) {
        const url = new URL(textUrl);
        const links = extractLinks(await getHtml(url), ext);
        await Promise.all(links.map((link, i) => downloadFile(new URL(link, url.origin), pad(i, numberlength(links.length)), ext)));
     
    }


function downloadFile(url, prefix) {
    const filename = `${prefix}-${url.href.split('/').pop()}`;
    const dest = path.join(__dirname, filename);
    
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        console.log(`Downloading file: ${filename} from: ${url.href} to: ${dest}`); 
        https.get(url, (res) => {
            res.pipe(file);
            file.on('finish', () => file.close(() => { console.log(`File ${filename} was saved successfully`); resolve(); }));
        }).on('error', (err) => { fs.unlink(dest); reject(err.message); });
    });
    
};

      
download("https://courses.edx.org/courses/course-v1:LouvainX+Louv1.1x+3T2018/ddbe8f03f98d42969782afbf3f6f7620/", 'pdf');


