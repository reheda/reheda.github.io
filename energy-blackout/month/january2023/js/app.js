import { blackouts } from "./blackouts.js";
import { blackoutsForLowTemp } from "./blackouts-low-temperature.js";

var selectedDate = new Date();
// var selectedDate = new Date("2022-12-09T21:59:00");
var selectedParams = { showPowerFor: "all", showAdditionalGroups: true, selectedGroup: "3", enableMergingGroups: true, showSettings: true, showLowTempBlackouts: false };

populateTableData(selectedDate, JSON.parse(localStorage.getItem("selectedParams")));

// https://stackoverflow.com/questions/51275730/populate-html-table-with-json-data
//this function appends the json data to the table 'gable'
function populateTableData(currentDate, params) {
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

    var lowTempWording = params.showLowTempBlackouts ? 'для температур нижче -10°C' : '';

    var additionalGroupsWording = params.showAdditionalGroups ? 'з урахуванням додаткових черг відключення' : '';

    var momentCurrentDate = moment(currentDate).locale('uk');
    console.log(momentCurrentDate.format());

    if (!momentCurrentDate.isSame(new Date(), "month")) {
        document.getElementById("gableCaption").innerHTML = `<span class="red-text">Виберіть, будь ласка, коректну дату у поточному місяці!</span>`;
        return;
    }


    //table caption
    document.getElementById("gableCaption").innerHTML = `Години ${powerWording} світла у ${params.selectedGroup} черзі ${additionalGroupsWording} ${lowTempWording} ${momentCurrentDate.calendar(null, {
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
    document.getElementById("lowTempBlackoutsToggle").checked = params.showLowTempBlackouts;

    // hide refresh button
    document.getElementById("content").style.display = "none";

    var powerData = [];

    var blackoutsToUse = blackouts;
    if (params.showLowTempBlackouts) {
        blackoutsToUse = blackoutsForLowTemp;
    }

    blackoutsToUse.filter(blackout => blackout.dates.includes(day)).forEach(function (blackout) {

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
                    // take end date of the last same power element as desired time for countdown
                    console.log("NO nextPowerChangeElem");
                    var lastSamePowerElem = getLastSamePowerElement(mergedPowerData, index, elem);
                    timeLeftWording = lastSamePowerElem.powerEnabled ? turnOffWording : turnOnWording;
                    startCountdown(moment(lastSamePowerElem.timeSlot.split(" - ")[1], ['H:m']), momentCurrentDate);
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
                `<td data-th="Вкл/відкл" style="display: flex;"><span class="circle ${elem.powerEnabled ? 'green-bg' : 'red-bg'}"></span></td>`;

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

function getLastSamePowerElement(powerData, index, elem) {
    for (let i = powerData.length - 1; i >= index; i++) {
        if (powerData[i].powerEnabled == elem.powerEnabled) {
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
            document.getElementById("headline").innerText = "Оновіть, будь ласка, сторінку!";
            document.getElementById("countdown").style.display = "none";
            document.getElementById("content").style.display = "block";
            clearInterval(x);
        }
        //seconds
    }, 200)
};



document.getElementById('groupDropdown').addEventListener("change", (e) => {
    console.log(e.target.value);
    populateTableData(selectedDate, {
        selectedGroup: e.target.value
    })
});

document.getElementById('showPowerForDropdown').addEventListener('change', (e) => {
    console.log(e.target.value);
    populateTableData(selectedDate, {
        showPowerFor: e.target.value
    })

})

document.getElementById('additionalGroupToggle').addEventListener('change', (e) => {
    console.log(e.currentTarget.checked);
    populateTableData(selectedDate, {
        showAdditionalGroups: e.currentTarget.checked
    })

})

document.getElementById('mergingGroupsToggle').addEventListener("change", (e) => {
    console.log(e.currentTarget.checked);
    populateTableData(selectedDate, {
        enableMergingGroups: e.currentTarget.checked
    })
});

document.getElementById('lowTempBlackoutsToggle').addEventListener("change", (e) => {
    console.log(e.currentTarget.checked);
    populateTableData(selectedDate, {
        showLowTempBlackouts: e.currentTarget.checked
    })
});

document.getElementById('resetSettingsButton').addEventListener("click", (e) => {
    console.log(e);
    localStorage.clear();
    location.reload();
});

document.getElementById('showSettingsToggle').addEventListener("change", (e) => {
    console.log(e.currentTarget.checked);
    populateTableData(selectedDate, {
        showSettings: e.currentTarget.checked
    })
});

document.getElementById('todayButton').addEventListener("click", (e) => {
    console.log(e);
    document.getElementById('tomorrowButton').classList.remove('selected');
    document.getElementById('todayButton').classList.add('selected');
    document.getElementById('anyDateInput').classList.remove('selected');
    populateTableData(moment().toDate());
});

document.getElementById('tomorrowButton').addEventListener("click", (e) => {
    console.log(e);
    document.getElementById('todayButton').classList.remove('selected');
    document.getElementById('tomorrowButton').classList.add('selected');
    document.getElementById('anyDateInput').classList.remove('selected');
    populateTableData(moment().add(1, 'days').toDate());

});

['change', 'click'].forEach(evt =>
    document.getElementById('anyDateInput').addEventListener(evt, (e) => {
        console.log(e.target.value);
        document.getElementById('todayButton').classList.remove('selected');
        document.getElementById('tomorrowButton').classList.remove('selected');
        document.getElementById('anyDateInput').classList.add('selected');
        var corretDateWithoutTime = moment(e.target.value);
        populateTableData(moment().set({
            'year': corretDateWithoutTime.year(),
            'month': corretDateWithoutTime.month(),
            'date': corretDateWithoutTime.date(),
        }).toDate());
    })
);



// Gets today's date and corrects for timezone. Use in the date picker input for default value (today)
Date.prototype.toDateInputValue = (function () {
    var local = new Date(this);
    local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
    return local.toJSON().slice(0, 10);
});

// Set today date for date picker.
if (moment("2023-01").isSame(new Date(), "month")) {
    document.getElementById('anyDateInput').value = new Date().toDateInputValue();
}