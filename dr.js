// Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
// http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
/*
 * Dr.js 0.0.6 - Simple JavaScript Documentation
 *
 * Author: Dmitry Baranovskiy (http://dmitry.baranovskiy.com/)
 */
var fs = require("fs"),
    path = require("path"),
    docit = require("./doc.js"),
    format = require("./formatter.js"),
    _ref = require("child_process"),
    spawn = _ref.spawn,
    exec = _ref.exec;
function getPath(filepath) {
    return "docs/" + path.basename(filepath, path.extname(filepath));
}

// exec("mkdir -p docs");
// exec("cp " + __dirname + "/dr.css docs/dr.css");

var files = process.argv.slice(0),
    srcs = [],
    chunks = {},
    title = "",
    output = "",
    scripts = [],
    fileName,
    toc = [];
files.splice(0, 2);

if (!files.length) {
    console.log("\nUsage: node dr <conf.json>");
}

if (files.length == 1 && path.extname(files[0]) == ".json") {
    var json = JSON.parse(fs.readFileSync(files[0], "utf-8"));
    title = json.title;
    files = [];
    for (var i = 0, ii = json.files && json.files.length; i < ii; i++) {
        files.push(json.files[i].path);
        srcs.push(json.files[i].link);
    }
    output = json.output || "";
    scripts = json.scripts || [];
}

console.log("\nTrust me, I am a Dr.js\n");
for (i = 0, ii = files.length; i < ii; i++) {
    var filename = files[i];
    fileName = fileName || filename;
    console.log("Processing " + filename);
    var code = fs.readFileSync(filename, "utf-8"),
        res = docit(code, filename, srcs[i]);
    if (res.sections && res.source) {
        toc = toc.concat(res.toc);
        for (var key in res.chunks) if (res.chunks.hasOwnProperty(key)) {
            chunks[key] = res.chunks[key];
        }
        title = title || res.title;
        console.log("Found \033[32m" + res.sections + "\033[0m sections.");
        console.log("Processing \033[32m" + res.loc + "\033[0m lines of code...");
        srcs[i] || (function (filename) {
            fs.writeFile(getPath(filename) + "-src.html", res.source, function () {
                console.log("Saved to \033[32m" + getPath(filename) + "-src.html\033[0m\n");
            });
        })(filename);
    } else {
        console.log("\033[31mNo comments in Dr.js format found\033[0m");
        break;
    }
}
var TOC = "",
    RES = "";
toc.sort(function (a, b) {
    if (a.name == b.name) {
        return 0;
    }
    if (a.name < b.name) {
        return -1;
    }
    return 1;
});
for (i = 0, ii = toc.length; i < ii; i++) if (!i || toc[i].name != toc[i - 1].name) {
    TOC += format('<li class="dr-lvl{indent}"><a href="#{name}" class="{clas}"><span>{name}{brackets}</span></a></li>', toc[i]);
    RES += chunks[toc[i].name] || "";
}
var html = '<!DOCTYPE html>\n<!-- Generated with Dr.js -->\n<html lang="en"><head><meta charset="utf-8"><title>' + title + ' Reference</title>\n<link rel="stylesheet" href="dr.css" media="screen">\n<link rel="stylesheet" href="dr-print.css" media="print"></head>\n<body id="dr-js"><div id="dr"><ol class="dr-toc" id="dr-toc">' + TOC + '</ol><div class="dr-doc"><h1>' + title + ' Reference</h1>' + RES + "</div></div>\n";
for (i = 0, ii = scripts.length; i < ii; i++) {
    html += '<script src="' + scripts[i] + '"></script>\n';
}
html += "<script>" + fs.readFileSync("toc.js", "utf-8") + "</script>\n</body></html>";
fs.writeFile(output || (getPath(fileName) + ".html"), html, function () {
    console.log("Saved to \033[32m" + (output || getPath(fileName) + ".html") + "\033[0m\n");
});
