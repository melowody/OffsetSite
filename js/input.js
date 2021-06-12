const sqlPromise = initSqlJs({
    locateFile: file => `./${file}`
});
const dataPromise = fetch("./data/addresses.db").then(res => res.arrayBuffer());
var db;
var reader = new commonmark.Parser();
var writer = new commonmark.HtmlRenderer();
var cookie;

async function init() {
    const [SQL, buf] = await Promise.all([sqlPromise, dataPromise]);
    db = new SQL.Database(new Uint8Array(buf));
}

$(document).ready(function() {
    cookie = getCookie("theme");
    document.getElementById('switch').innerHTML = `${cookie == "Light" ? "Dark" : "Light"} Theme`;

    document.querySelectorAll(`link[title="${cookie}"]`).forEach(element => element.removeAttribute("disabled"));
    document.querySelectorAll(`link[title="${cookie == "Light" ? "Dark" : "Light"}"]`).forEach(element => element.setAttribute("disabled", "disabled"));

    init().then(() => {
        generate("");
    })

    $('#userin').on('input', function() {
        var dInput = this.value;
        generate(dInput);
    });
});

function generate(input) {
    getPHP(input)
            .then((phpOutput) => {
                $('#left').html("");
                createResults(phpOutput);
            });
}

async function getPHP(dInput) {
    var stmt = db.prepare("SELECT * FROM ADDRESSES WHERE NAME LIKE $name OR ADDRESS LIKE $name");
    stmt.bind({$name:`%${dInput}%`});

    var output = [];

    while (stmt.step()) {
        var row = stmt.getAsObject();
        output.push({
            name: row['NAME'],
            address: row['ADDRESS'],
            params: row['PARAMS'],
            type: row['CALL_TYPE']
        });
    }

    return output;

}

function switchTheme() {
    if (cookie == "Dark") {
        createCookie("theme", "Light", 1000);
    } else {
        createCookie("theme", "Dark", 1000);
    }

    document.querySelectorAll(`link[title="${cookie}"]`).forEach(element => element.setAttribute("disabled", "disabled"));
    cookie = getCookie("theme");
    document.querySelectorAll(`link[title="${cookie}"]`).forEach(element => element.removeAttribute("disabled"));

    document.getElementById('switch').innerHTML = `${cookie == "Light" ? "Dark" : "Light"} Theme`;
}

function createResults(arr) {
    arr.forEach(element => {
        displayResult(element);
    });
}

function displayResult(element) {
    $('#left').append(formatEntry(element));
}

function formatEntry(element) {
    return `<button id="${element.address}" class="left-button">${element.name} | ${element.address} | ${element.params} | ${getType(element.type)}</button><br />`
}

function getType(type) {
    switch(type) {
        case 0:
            return "__thiscall";
        case 1:
            return "__stdcall";
        case 2:
            return "__fastcall";
    }
}

function showRight(markdown) {
    var parsed = reader.parse(markdown);
    $('#right').html(writer.render(parsed));
    hljs.highlightAll();
}

$(document).on('click', function(e) {
    var btn = $(e.target);
    var className = btn.attr("class");
    if (className == "left-button") {
        $('#right').show();
        var id = btn.attr("id");
        var stmt = db.prepare("SELECT * FROM ADDRESSES WHERE ADDRESS IS $id");
        stmt.bind({$id:id});
        if (stmt.step()) {
            var row = stmt.getAsObject();
            showRight(row.MD);
        }
    } else if (!$("#right").get(0).contains(e.target)) {
        $('#right').hide();
    }
})

var createCookie = function(name, value, days) {
    var expires;
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toGMTString();
    }
    else {
        expires = "";
    }
    document.cookie = name + "=" + value + expires + "; path=/";
}

function getCookie(c_name) {
    if (document.cookie.length > 0) {
        c_start = document.cookie.indexOf(c_name + "=");
        if (c_start != -1) {
            c_start = c_start + c_name.length + 1;
            c_end = document.cookie.indexOf(";", c_start);
            if (c_end == -1) {
                c_end = document.cookie.length;
            }
            return unescape(document.cookie.substring(c_start, c_end));
        }
    }
    return "";
}