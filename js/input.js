$(document).ready(function() {
    $('#userin').on('input', function() {
        var dInput = this.value;
        getPHP(dInput)
            .then((phpOutput) => {
                $('#output-p').text("");
                if (dInput != "") {
                    createResults(phpOutput);
                }
            });
    });
});

async function getPHP(dInput) {
    const sqlPromise = initSqlJs({
        locateFile: file => `./${file}`
    });
    const dataPromise = fetch("../data/addresses.db").then(res => res.arrayBuffer());
    const [SQL, buf] = await Promise.all([sqlPromise, dataPromise])
    const db = new SQL.Database(new Uint8Array(buf));

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

function createResults(arr) {
    arr.forEach(element => {
        displayResult(element);
    });
}

function displayResult(element) {
    var currText = $('#output-p').text();
    $('#output-p').append(`${element.name} | ${element.address} | ${element.params} | ${getType(element.type)}<br />`);
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