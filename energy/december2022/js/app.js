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
// var selectedDate = new Date("2022-12-08T18:00:03");
var selectedParams = { showPowerFor: "all", showAdditionalGroups: true, selectedGroup: "3", enableMergingGroups: true, showSettings: true };

populateTableData(blackouts, selectedDate, JSON.parse(localStorage.getItem("selectedParams")));

// https://stackoverflow.com/questions/51275730/populate-html-table-with-json-data
//this function appends the json data to the table 'gable'
function populateTableData(blackouts, currentDate, params) {
    var day = currentDate.getDate();

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
    selectedDate = currentDate;

    //save to local storage
    console.log(selectedParams);
    localStorage.setItem("selectedParams", JSON.stringify(selectedParams));


    var turnOffWording = '<span class="red-text">відключення</span>';
    var turnOnWording = '<span class="green-text">включення</span>';

    var powerWording = '';
    if (params.showPowerFor == "all") {
        powerWording = `${turnOnWording} / ${turnOffWording}`;
    } else if (params.showPowerFor == "on") {
        powerWording = turnOnWording;
    } else if (params.showPowerFor == "off") {
        powerWording = turnOffWording;
    }

    var additionalGroupsWording = params.showAdditionalGroups ? 'з урахування додаткових черг відключення' : '';

    var momentCurrentDate = moment(currentDate).locale('uk');
    console.log(momentCurrentDate.format());

    //table caption
    document.getElementById("gableCaption").innerHTML = `Години ${powerWording} світла у ${params.selectedGroup} черзі ${additionalGroupsWording} ${momentCurrentDate.calendar(null, {
        sameDay: '[сьогодні] (DD MMMM YYYY)',
        nextDay: '[завтра] (DD MMMM YYYY)',
        nextWeek: 'DD MMMM YYYY',
        lastDay: '[вчора] (DD MMMM YYYY)',
        lastWeek: 'DD MMMM YYYY',
        sameElse: 'DD MMMM YYYY'
    })} `;

    //update checkbox and select
    document.getElementById("showPowerForDropdown").value = params.showPowerFor;
    document.getElementById("additionalGroupToggle").checked = params.showAdditionalGroups;
    document.getElementById("mergingGroupsToggle").checked = params.enableMergingGroups;
    document.getElementById("showSettingsToggle").checked = params.showSettings;
    document.getElementById("groupDropdown").value = params.selectedGroup;

    var powerData = [];

    blackouts.filter(blackout => blackout.dates.includes(day)).forEach(function (blackout) {

        blackout.groupWithTimeSlots.forEach(groupWithTimeSlotsElem => {
            var powerEnabled = groupWithTimeSlotsElem.groupDetails.group !== Number(params.selectedGroup);
            if (params.showAdditionalGroups) {
                var isAdditionalGroup = !groupWithTimeSlotsElem.groupDetails.additionalGroups.includes(Number(params.selectedGroup));
                powerEnabled = powerEnabled && isAdditionalGroup;
            }

            var timeSlotDetails = groupWithTimeSlotsElem.timeSlotDetails;
            timeSlotDetails.forEach(timeSlot => {

                var [timeSlotStart, timeSlotEnd] = timeSlot.split(' - ');
                var momentTimeSlotStart = moment(timeSlotStart, ['H:m']);
                var momentTimeSlotEnd = moment(timeSlotEnd, ['H:m'])
                var duration = moment.duration(momentTimeSlotEnd.diff(momentTimeSlotStart))
                var durationAsHours = duration.asHours();
                var durationAsHoursWihtCorrectDayOverlapping = durationAsHours < 0 ? parseFloat((24 + durationAsHours).toFixed(1)) : parseFloat(durationAsHours.toFixed(1));

                var isActiveSlot = isBeetweenSlots(momentCurrentDate, timeSlot);

                powerData.push({
                    timeSlot: timeSlot,
                    duration: durationAsHoursWihtCorrectDayOverlapping,
                    group: groupWithTimeSlotsElem.groupDetails.group,
                    powerEnabled: powerEnabled,
                    isActiveSlot: isActiveSlot,
                });

            });

        });

    });

    powerData.sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));

    var mergedPowerData = [...powerData];
    if (params.enableMergingGroups) {
        mergedPowerData = mergeTimeSlots(mergedPowerData, params);
    }

    // populate table
    mergedPowerData.forEach((elem, index) => {
        var shouldProcessElement = false;
        if (params.showPowerFor == "all") {
            shouldProcessElement = true;
        } else if (params.showPowerFor == "on") {
            shouldProcessElement = elem.powerEnabled == true;
        } else if (params.showPowerFor == "off") {
            shouldProcessElement = elem.powerEnabled == false;
        }

        if (momentCurrentDate.isSame(new Date(), "day")) {

            document.getElementById("headline").style.display = "block";
            document.getElementById("countdown").style.display = "block";

            var timeLeftWording;
            if (elem.isActiveSlot) {
                var nextPowerChangeElem = getNextChangePowerElement(mergedPowerData, index, elem);
                if (nextPowerChangeElem) {
                    // take start date of the next change power element as desired time for countdown
                    console.log("nextPowerChangeElem", nextPowerChangeElem);
                    timeLeftWording = nextPowerChangeElem.powerEnabled ? turnOnWording : turnOffWording;
                    startCountdown(moment(nextPowerChangeElem.timeSlot.split(" - ")[0], ['H:m']), momentCurrentDate);
                } else {
                    // take end date of the current element as desired time for countdown
                    console.log("NO nextPowerChangeElem");
                    timeLeftWording = elem.powerEnabled ? turnOffWording : turnOnWording;
                    startCountdown(moment(elem.timeSlot.split(" - ")[1], ['H:m']), momentCurrentDate);
                }
                document.getElementById("headline").innerHTML = `Залишилось часу до наступного ${timeLeftWording}`;

            }
        } else {
            document.getElementById("headline").style.display = "none";
            document.getElementById("countdown").style.display = "none";
        }

        if (shouldProcessElement) {
            var tr = document.createElement('tr');

            tr.innerHTML = '<td data-th="Години доби">' + elem.timeSlot + '</td>' +
                `<td data-th="Тривалість">` + elem.duration + '</td>' +
                // '<td data-th="Черга">' + elem.group + '</td>'+
                `<td data-th="Вкл/відкл"><span class="circle ${elem.powerEnabled ? 'green-bg' : 'red-bg'}"></span></td>`;

            if (momentCurrentDate.isSame(new Date(), "day") && elem.isActiveSlot) {
                tr.classList.add('active-row');
            }

            tbody.appendChild(tr);
        }
    })

    // sortTable(table, 0, false);
}

//find element with index more than current and  different powerEnabled
//error prone, because we might need to add the next day also to loop to make sure we display correct info.
function getNextChangePowerElement(powerData, index, elem) {
    // possible issue with index, as index + 1 can be greater than lengh?
    for (let i = index + 1; i < powerData.length; i++) {
        if (powerData[i].powerEnabled != elem.powerEnabled) {
            return powerData[i];
        }
    }
}

function isBeetweenSlots(momentDate, timeSlot) {
    var [timeSlotStart, timeSlotEnd] = timeSlot.split(' - ');
    var momentTimeSlotStart = moment(timeSlotStart, ['H:m']);
    var momentTimeSlotEnd = moment(timeSlotEnd, ['H:m'])
    if (momentTimeSlotEnd.isBefore(momentTimeSlotStart)) {
        momentTimeSlotEnd.add(1, 'days');
    }

    if (momentDate.isBetween(momentTimeSlotStart, momentTimeSlotEnd, 'm', '[)')) {

        return true;
    }

    return false;
}

function mergeTimeSlots(powerData, params) {
    // console.log("powerData", powerData);
    var output = [];

    powerData.forEach(function (item) {
        var modifiedItem = { ...item };

        var [timeSlotStart, timeSlotEnd] = modifiedItem.timeSlot.split(' - ');

        var existing = output.find(function (v, i) {
            return v.powerEnabled == modifiedItem.powerEnabled && v.timeSlot.endsWith(timeSlotStart);
        });
        if (existing) {
            var existingIndex = output.indexOf(existing);
            var [existingTimeSlotStart, existingTimeSlotEnd] = existing.timeSlot.split(' - ');
            output[existingIndex].timeSlot = `${existingTimeSlotStart} - ${timeSlotEnd}`;
            output[existingIndex].duration = existing.duration + modifiedItem.duration;
            // output[existingIndex].powerEnabled = existing.powerEnabled || modifiedItem.durapowerEnabledtion;
            output[existingIndex].isActiveSlot = existing.isActiveSlot || modifiedItem.isActiveSlot;
            output[existingIndex].group = `${existing.group} + ${modifiedItem.group}`;
        } else {
            output.push(modifiedItem);
        }
    });

    // replace items in powerData with output
    // powerData.length = 0;
    // powerData.push(...output);

    // console.log("merged", output);
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



// https://codepen.io/AllThingsSmitty/pen/JJavZN
function startCountdown(momentTargetDate, momentCurrentDate) {
    // Get a reference to the last interval + 1
    const interval_id = window.setInterval(function () { }, Number.MAX_SAFE_INTEGER);

    // Clear any timeout/interval up to that id
    for (let i = 1; i < interval_id; i++) {
        window.clearInterval(i);
    }

    var updatedTargetDate = moment(momentTargetDate);
    if (updatedTargetDate.isBefore(momentCurrentDate)) {
        updatedTargetDate.set({
            'hours': updatedTargetDate.hours() + 24,
        });
    }


    const x = setInterval(function () {

        var corretMomentBasedOnCurrentDate = moment().set({
            'year': momentCurrentDate.year(),
            'month': momentCurrentDate.month(),
            'day': momentCurrentDate.day(),
            // 'hours': momentCurrentDate.hours(),
            // 'minutes': momentCurrentDate.minutes(),
        });

        // console.log(corretMomentBasedOnCurrentDate.format())
        const myDuration = moment.duration(updatedTargetDate.diff(corretMomentBasedOnCurrentDate));
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
    }, 200)
};



document.getElementById('groupDropdown').addEventListener("change", (e) => {
    console.log(e.target.value);
    populateTableData(blackouts, selectedDate, {
        selectedGroup: e.target.value
    })
});

document.getElementById('showPowerForDropdown').addEventListener('change', (e) => {
    console.log(e.target.value);
    populateTableData(blackouts, selectedDate, {
        showPowerFor: e.target.value
    })

})

document.getElementById('additionalGroupToggle').addEventListener('change', (e) => {
    console.log(e.currentTarget.checked);
    populateTableData(blackouts, selectedDate, {
        showAdditionalGroups: e.currentTarget.checked
    })

})

document.getElementById('mergingGroupsToggle').addEventListener("change", (e) => {
    console.log(e.currentTarget.checked);
    populateTableData(blackouts, selectedDate, {
        enableMergingGroups: e.currentTarget.checked
    })
});

document.getElementById('resetSettingsButton').addEventListener("click", (e) => {
    console.log(e);
    localStorage.clear();
    location.reload();
});

document.getElementById('showSettingsToggle').addEventListener("change", (e) => {
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
