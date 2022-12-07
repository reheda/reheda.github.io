const allTimeSlots = [
    [
        "00:30 - 03:00",//0
        "08:00 - 10:00",//3
        "14:00 - 16:00",//6
        "20:00 - 22:00",//9
    ],
    [
        "03:00 - 05:30",//1
        "10:00 - 12:00",//4
        "16:00 - 18:00",//7
        "22:00 - 00:30",//10
    ],
    [
        "05:30 - 08:00",//2
        "12:00 - 14:00",//5
        "18:00 - 20:00",//8
    ]

];

const allGroups = [
    //0
    {
        group: 1,
        additionalGroups: [3],
    },

    //1
    {
        group: 2,
        additionalGroups: [1],
    },

    //2
    {
        group: 3,
        additionalGroups: [2],
    },
]

//orange color
const blackout1 = {
    dates: [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 30],
    groupWithTimeSlots: [
        {
            groupDetails: allGroups[0],
            timeSlotDetails: allTimeSlots[0],
        },
        {
            groupDetails: allGroups[1],
            timeSlotDetails: allTimeSlots[1],
        },
        {
            groupDetails: allGroups[2],
            timeSlotDetails: allTimeSlots[2],
        },
    ],
}

//yellow color
const blackout2 = {
    dates: [1, 4, 7, 10, 13, 16, 19, 22, 25, 28],
    groupWithTimeSlots: [
        {
            groupDetails: allGroups[1],
            timeSlotDetails: allTimeSlots[0],
        },
        {
            groupDetails: allGroups[2],
            timeSlotDetails: allTimeSlots[1],
        },
        {
            groupDetails: allGroups[0],
            timeSlotDetails: allTimeSlots[2],
        },
    ],
}

//green color
const blackout3 = {
    dates: [3, 6, 9, 12, 15, 18, 21, 24, 27, 31],
    groupWithTimeSlots: [
        {
            groupDetails: allGroups[2],
            timeSlotDetails: allTimeSlots[0],
        },
        {
            groupDetails: allGroups[0],
            timeSlotDetails: allTimeSlots[1],
        },
        {
            groupDetails: allGroups[1],
            timeSlotDetails: allTimeSlots[2],
        },
    ],
}


const blackouts = [
    blackout1,
    blackout2,
    blackout3,
]

var selectedDate = new Date();
// var selectedDate = new Date("2022-12-07T21:32:00");
console.log(selectedDate);
var selectedParams = { showEnergyBlackout: false, showAdditionalGroups: true, selectedGroup: "3", enableMergingGroups: true, showSettings: true };

populateTableData(blackouts, selectedDate, JSON.parse(localStorage.getItem("selectedParams")));

// https://stackoverflow.com/questions/51275730/populate-html-table-with-json-data
//this function appends the json data to the table 'gable'
function populateTableData(blackouts, desiredDate, params) {
    var day = desiredDate.getDate();

    var table = document.getElementById('gable');
    var tbody = table.getElementsByTagName('tbody')[0];

    // clear table
    tbody.innerHTML = '';

    // set default param values and update with passed params    
    params = { ...selectedParams, ...params }
    // if (!params.showAdditionalGroups) {
    //     params.enableMergingGroups = false;
    // }
    selectedParams = params;
    selectedDate = desiredDate;

    //save to local storage
    console.log(selectedParams);
    localStorage.setItem("selectedParams", JSON.stringify(selectedParams));


    var turnOffWording = '<span class="red-text">відключення</span>';
    var turnOnWording = '<span class="green-text">включення</span>';
    var energyBlackoutWording = params.showEnergyBlackout ? turnOffWording : turnOnWording;

    var additionalGroupsWording = params.showAdditionalGroups ? 'з урахування додаткових черг відключення' : '';


    var momentDesiredDate = moment(desiredDate).locale('uk');

    // console.log(momentDesiredDate.calendar().split(' ')[0]);
    // console.log(momentDesiredDate.add(2, 'days').calendar());

    //table caption
    document.getElementById("gableCaption").innerHTML = `Години ${energyBlackoutWording} світла у ${params.selectedGroup} черзі ${additionalGroupsWording} ${momentDesiredDate.calendar(null, {
        sameDay: '[сьогодні] (DD MMMM YYYY)',
        nextDay: '[завтра] (DD MMMM YYYY)',
        nextWeek: 'DD MMMM YYYY',
        lastDay: '[вчора] (DD MMMM YYYY)',
        lastWeek: 'DD MMMM YYYY',
        sameElse: 'DD MMMM YYYY'
    })} `;

    //update checkbox and select
    document.getElementById("enableEnergyBlackoutToggle").checked = params.showEnergyBlackout;
    document.getElementById("enableAdditionalGroupToggle").checked = params.showAdditionalGroups;
    document.getElementById("enableMergingGroupsToggle").checked = params.enableMergingGroups;
    document.getElementById("showSettingsCheckbox").checked = params.showSettings;
    document.getElementById("selectGroups").value = params.selectedGroup;


    var tableRows = [];

    blackouts.filter(blackout => blackout.dates.includes(day)).forEach(function (blackout) {

        blackout.groupWithTimeSlots.forEach(groupWithTimeSlotsElem => {
            var groupCondition;
            var durationName;
            var on;
            if (params.showEnergyBlackout) {
                durationName = 'Тривалість відключення';
                groupCondition = groupWithTimeSlotsElem.groupDetails.group === Number(params.selectedGroup);
                if (params.showAdditionalGroups) {
                    var isAdditionalGroup = groupWithTimeSlotsElem.groupDetails.additionalGroups.includes(Number(params.selectedGroup));
                    groupCondition = groupCondition || isAdditionalGroup;
                }
                on = false;
            } else {
                durationName = 'Тривалість включення';
                groupCondition = groupWithTimeSlotsElem.groupDetails.group !== Number(params.selectedGroup);
                if (params.showAdditionalGroups) {
                    var isAdditionalGroup = !groupWithTimeSlotsElem.groupDetails.additionalGroups.includes(Number(params.selectedGroup));
                    groupCondition = groupCondition && isAdditionalGroup;
                }
                on = true;
            }


            // document.getElementById("duration-name").innerText = durationName;

            // if (groupCondition) {
            var timeSlotDetails = groupWithTimeSlotsElem.timeSlotDetails;
            timeSlotDetails.forEach(timeSlot => {

                var [timeSlotStart, timeSlotEnd] = timeSlot.split(' - ');
                var momentTimeSlotStart = moment(timeSlotStart, ['H:m']);
                var momentTimeSlotEnd = moment(timeSlotEnd, ['H:m'])
                var duration = moment.duration(momentTimeSlotEnd.diff(momentTimeSlotStart))
                var durationAsHours = duration.asHours();
                var blackoutDurationAsHours = durationAsHours < 0 ? parseFloat((24 + durationAsHours).toFixed(1)) : parseFloat(durationAsHours.toFixed(1));

                tableRows.push({
                    timeSlot: timeSlot,
                    duration: blackoutDurationAsHours,
                    // group: Number(params.selectedGroup),
                    group: groupWithTimeSlotsElem.groupDetails.group,
                    display: groupCondition,
                    on: on,
                });

            });

            // }
        });
    });

    tableRows.sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));

    var processedRows = [...tableRows];
    if (params.enableMergingGroups) {
        processedRows = mergeTimeSlots(processedRows.filter(row => row.display), params);
    }

    processedRows.filter(row => row.display).forEach(row => {
        var tr = document.createElement('tr');
        var colorBgClass = "red-bg";

        if (!params.showEnergyBlackout) {
            row.group = '';
            colorBgClass = "green-bg";
        }


        tr.innerHTML = '<td data-th="Години доби">' + row.timeSlot + '</td>' +
            `<td data-th="Тривалість">` + row.duration + '</td>' +
            '<td data-th="Черга">' + row.group + '</td>';


        var rowWithCorrectTimeslot = tableRows.find(rowWithCorrectTimeslot => {

            if (isBeetweenSlots(momentDesiredDate, rowWithCorrectTimeslot.timeSlot)) {
                startCountdown(moment(rowWithCorrectTimeslot.timeSlot.split(" - ")[1], ['H:m']));
                return true;
            }
            return false;
        });

        if (rowWithCorrectTimeslot) {
            document.getElementById("headline").style.display = "block";
            document.getElementById("countdown").style.display = "block";
            var timeLeftWording = rowWithCorrectTimeslot.display ^ rowWithCorrectTimeslot.on ? turnOnWording : turnOffWording;
            document.getElementById("headline").innerHTML = `Залишилось часу до наступного ${timeLeftWording}`;
        } else {
            // should not be possible situation
            console.log("error. row not found!");
            document.getElementById("headline").style.display = "none";
            document.getElementById("countdown").style.display = "none";
        }

        if (isBeetweenSlots(momentDesiredDate, row.timeSlot)) {
            tr.classList.add(colorBgClass);
        }

        tbody.appendChild(tr);


    })

    // sortTable(table, 0, false);
}

function isBeetweenSlots(momentDate, timeSlot) {
    var [timeSlotStart, timeSlotEnd] = timeSlot.split(' - ');
    var momentTimeSlotStart = moment(timeSlotStart, ['H:m']);
    var momentTimeSlotEnd = moment(timeSlotEnd, ['H:m'])
    if (momentTimeSlotEnd.isBefore(momentTimeSlotStart)) {
        momentTimeSlotEnd.add(1, 'days');
    }

    if (momentDate.isBetween(momentTimeSlotStart, momentTimeSlotEnd, 'm')) {

        return true;
    }

    return false;
}

function mergeTimeSlots(tableRows, params) {
    var output = [];


    tableRows.forEach(function (item) {
        if (params.showAdditionalGroups) {
            item.group = [item.group, ...allGroups.filter(el => el.additionalGroups.includes(Number(params.selectedGroup))).map(el => el.group)].join('+');
        }


        var [timeSlotStart, timeSlotEnd] = item.timeSlot.split(' - ');

        var existing = output.find(function (v, i) {
            return v.timeSlot.endsWith(timeSlotStart);
        });
        if (existing) {
            var existingIndex = output.indexOf(existing);
            var [existingTimeSlotStart, existingTimeSlotEnd] = existing.timeSlot.split(' - ');
            output[existingIndex].timeSlot = `${existingTimeSlotStart} - ${timeSlotEnd}`;
            output[existingIndex].duration = existing.duration + item.duration;

        } else {
            output.push(item);
        }
    });

    // replace items in tableRows with output
    tableRows.length = 0;
    tableRows.push(...output);

    return output;

}

// https://stackoverflow.com/questions/14267781/sorting-html-table-with-javascript
// sortTable(tableNode, columId, false);
function sortTable(table, col, reverse) {
    var tb = table.tBodies[0], // use `<tbody>` to ignore `<thead>` and `<tfoot>` rows
        tr = Array.prototype.slice.call(tb.rows, 0), // put rows into array
        i;
    reverse = -((+reverse) || -1);
    tr = tr.sort(function (a, b) { // sort rows
        return reverse // `-1 *` if want opposite order
            * (a.cells[col].textContent.trim() // using `.textContent.trim()` for test
                .localeCompare(b.cells[col].textContent.trim())
            );
    });

    for (i = 0; i < tr.length; ++i) {
        tb.appendChild(tr[i]); // append each row in order
    }
}



document.getElementById('selectGroups').addEventListener("change", (e) => {
    console.log(e.target.value);
    populateTableData(blackouts, selectedDate, {
        selectedGroup: e.target.value
    })
});

document.getElementById('enableEnergyBlackoutToggle').addEventListener('change', (e) => {
    console.log(e.currentTarget.checked);
    populateTableData(blackouts, selectedDate, {
        showEnergyBlackout: e.currentTarget.checked
    })

})

document.getElementById('enableAdditionalGroupToggle').addEventListener('change', (e) => {
    console.log(e.currentTarget.checked);
    populateTableData(blackouts, selectedDate, {
        showAdditionalGroups: e.currentTarget.checked
    })

})


document.getElementById('enableMergingGroupsToggle').addEventListener("change", (e) => {
    console.log(e.currentTarget.checked);
    populateTableData(blackouts, selectedDate, {
        enableMergingGroups: e.currentTarget.checked
    })
});

document.getElementById('resetSettings').addEventListener("click", (e) => {
    console.log(e);
    localStorage.clear();
    location.reload();
});

document.getElementById('showSettingsCheckbox').addEventListener("change", (e) => {
    console.log(e.currentTarget.checked);
    populateTableData(blackouts, selectedDate, {
        showSettings: e.currentTarget.checked
    })
});


document.getElementById('todayButton').addEventListener("click", (e) => {
    console.log(e);
    document.getElementById('tomorrowButton').classList.remove('selected');
    document.getElementById('todayButton').classList.add('selected');
    document.getElementById('anyDateInput').classList.remove('selected');
    populateTableData(blackouts, moment().toDate());
});

document.getElementById('tomorrowButton').addEventListener("click", (e) => {
    console.log(e);
    document.getElementById('todayButton').classList.remove('selected');
    document.getElementById('tomorrowButton').classList.add('selected');
    document.getElementById('anyDateInput').classList.remove('selected');
    populateTableData(blackouts, moment().add(1, 'days').toDate());

});

document.getElementById('anyDateInput').addEventListener("change", (e) => {
    console.log(e.target.value);
    document.getElementById('todayButton').classList.remove('selected');
    document.getElementById('tomorrowButton').classList.remove('selected');
    document.getElementById('anyDateInput').classList.add('selected');
    var corretDateWithoutTime = moment(e.target.value);
    populateTableData(blackouts, moment().set({
        'year': corretDateWithoutTime.year(), 
        'month': corretDateWithoutTime.month(), 
        'day': corretDateWithoutTime.day(),
    }).toDate());
});



// https://codepen.io/AllThingsSmitty/pen/JJavZN
function startCountdown(momentTargetDate) {
    // Get a reference to the last interval + 1
    const interval_id = window.setInterval(function () { }, Number.MAX_SAFE_INTEGER);

    // Clear any timeout/interval up to that id
    for (let i = 1; i < interval_id; i++) {
        window.clearInterval(i);
    }

    const x = setInterval(function () {

        const myDuration = moment.duration(momentTargetDate.diff(moment()));
        document.getElementById("hours").innerText = myDuration.hours(),
            document.getElementById("minutes").innerText = myDuration.minutes(),
            document.getElementById("seconds").innerText = myDuration.seconds();

        //do something later when date is reached
        if (myDuration.seconds() < 0) {
            // document.getElementById("headline").innerText = "It's my birthday!";
            // document.getElementById("countdown").style.display = "none";
            // document.getElementById("content").style.display = "block";
            clearInterval(x);
        }
        //seconds
    }, 0)
};