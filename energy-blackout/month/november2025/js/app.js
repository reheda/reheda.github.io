// Instead of importing static JS data, we will load JSON from file / API
let blackouts = [];
let blackoutsForLowTemp = [];
let rawOutageData = [];

var selectedDate = new Date();
// var selectedDate = new Date("2022-12-09T21:59:00");
var selectedParams = {
    showPowerFor: "all",
    selectedGroup: "5.2",
    showSettings: false
};

const KREMEN_API_URL = "https://withered-sunset-82e1.rovilabcom.workers.dev/api/outerage/week_2";
const KREMEN_CACHE_KEY = "kremenOutageCache_v1";
const KREMEN_MAX_AGE_MS = 20 * 60 * 1000; // 20 minutes

async function loadOutageDataWithCache() {
    const now = Date.now();

    try {
        const cachedRaw = localStorage.getItem(KREMEN_CACHE_KEY);
        if (cachedRaw) {
            const cached = JSON.parse(cachedRaw);
            if (cached.data && typeof cached.lastFetched === "number") {
                const age = now - cached.lastFetched;
                // If cached data is younger than 20 minutes, reuse it
                if (age < KREMEN_MAX_AGE_MS) {
                    console.log("Using cached outage data, age:", Math.round(age / 1000), "sec");
                    return cached.data;
                }
            }
        }
    } catch (e) {
        console.warn("Failed to read outage cache", e);
    }

    console.log("Cache expired or missing, fetching from API:", KREMEN_API_URL);

    const response = await fetch(KREMEN_API_URL, { cache: "no-cache" });
    if (!response.ok) {
        throw new Error("HTTP error " + response.status);
    }
    const data = await response.json();

    // Save to cache
    try {
        localStorage.setItem(
            KREMEN_CACHE_KEY,
            JSON.stringify({ lastFetched: now, data })
        );
    } catch (e) {
        console.warn("Failed to write outage cache", e);
    }

    return data;
}

// Load JSON and render when DOM is ready
document.addEventListener("DOMContentLoaded", init);

async function init() {
    try {
        
        const apiData = await loadOutageDataWithCache();

        rawOutageData = apiData;

        // Convert Kremen API response into blackout structure expected by the UI
        blackouts = convertKremenToBlackouts(apiData);
        // Currently no separate low-temperature data
        blackoutsForLowTemp = [];

        const storedParams = JSON.parse(localStorage.getItem("selectedParams"));
        populateTableData(selectedDate, storedParams);
    } catch (e) {
        console.error("Failed to load outage data", e);
        const caption = document.getElementById("gableCaption");
        if (caption) {
            caption.innerHTML = `<span class="red-text">Не вдалося завантажити дані відключень</span>`;
        }
    }
}

// Map Kremen JSON (with schedules[queue, schedule[48]]) to your blackout format
function convertKremenToBlackouts(apiData) {
    return apiData.map(day => {
        const dateObj = new Date(day.date);
        const dayNumber = dateObj.getDate();

        const groupWithTimeSlots = (day.schedules || []).map(schedule => {
            const groupId = String(schedule.queue); // e.g. "5.2"

            return {
                groupDetails: {
                    group: groupId,
                    area: "",
                    additionalGroups: []
                },
                // 48 half-hour values (0/1/2) -> ["HH:mm - HH:mm", ...] where value != 0
                timeSlotDetails: convertScheduleToRanges(schedule.schedule || [])
            };
        });

        return {
            dates: [dayNumber],
            groupWithTimeSlots
        };
    });
}

// Convert schedule[48] (0/1/2) to time ranges where value != 0
function convertScheduleToRanges(scheduleArray) {
    const ranges = [];
    let startIndex = null;

    for (let i = 0; i < scheduleArray.length; i++) {
        const value = scheduleArray[i];
        // 1 = on, 0 = off, 2 = maybe (treat as off for now)
        const isOff = value !== 1;

        if (isOff && startIndex === null) {
            startIndex = i;
        }

        if ((!isOff || i === scheduleArray.length - 1) && startIndex !== null) {
            let endIndex;
            if (!isOff) {
                endIndex = i;
            } else {
                endIndex = i + 1;
            }
            ranges.push(indexToTime(startIndex) + " - " + indexToTime(endIndex));
            startIndex = null;
        }
    }

    return ranges;
}

// 0..48 -> "HH:mm" (30-min steps, 00:00..23:30, then 00:00 next day)
function indexToTime(idx) {
    const hours = Math.floor(idx / 2) % 24;
    const minutes = (idx % 2) * 30;
    const hh = String(hours).padStart(2, "0");
    const mm = minutes === 0 ? "00" : "30";
    return `${hh}:${mm}`;
}

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

    var momentCurrentDate = moment(currentDate).locale('uk');
    console.log(momentCurrentDate.format());

    if (!momentCurrentDate.isSame(new Date(), "month")) {
        document.getElementById("gableCaption").innerHTML = `<span class="red-text">Виберіть, будь ласка, коректну дату у поточному місяці!</span>`;
        return;
    }


    //table caption
    document.getElementById("gableCaption").innerHTML = `Години ${powerWording} світла у ${params.selectedGroup} черзі ${momentCurrentDate.calendar(null, {
        sameDay: '[сьогодні] (DD MMMM YYYY)',
        nextDay: '[завтра] (DD MMMM YYYY)',
        nextWeek: 'DD MMMM YYYY',
        lastDay: '[вчора] (DD MMMM YYYY)',
        lastWeek: 'DD MMMM YYYY',
        sameElse: 'DD MMMM YYYY'
    })} `;

    //update checkbox and select
    document.getElementById("showPowerForDropdown").value = params.showPowerFor;
    document.getElementById("showSettingsToggle").checked = params.showSettings;
    document.getElementById("groupDropdown").value = params.selectedGroup;

    // hide refresh button
    document.getElementById("content").style.display = "none";

    var powerData = [];

    // Build power slots directly from the API schedule for the selected group (e.g. "5.2")
    const dayData = (rawOutageData || []).find(d => {
        const dDate = new Date(d.date);
        return dDate.getDate() === day &&
            dDate.getMonth() === currentDate.getMonth() &&
            dDate.getFullYear() === currentDate.getFullYear();
    });

    if (!dayData || !Array.isArray(dayData.schedules)) {
        console.warn("No outage data for this date");
    } else {
        const selectedSchedule = dayData.schedules.find(s => String(s.queue) === params.selectedGroup);
        if (!selectedSchedule || !Array.isArray(selectedSchedule.schedule)) {
            console.warn("No schedule for selected group:", params.selectedGroup);
        } else {
            const sArr = selectedSchedule.schedule;
            if (sArr.length > 0) {
                let currentState = null; // true = power ON, false = OFF
                let startIndex = 0;

                for (let i = 0; i < sArr.length; i++) {
                    // 1 = power ON, 0 = OFF, 2 = maybe (treat as OFF for now)
                    const isOn = sArr[i] === 1;
                    if (currentState === null) {
                        currentState = isOn;
                        startIndex = i;
                        continue;
                    }
                    if (isOn !== currentState) {
                        const endIndex = i;
                        const timeSlot = indexToTime(startIndex) + " - " + indexToTime(endIndex);
                        const durationHours = (endIndex - startIndex) * 0.5;
                        const isActiveSlot = isBeetweenSlots(momentCurrentDate, timeSlot);

                        powerData.push({
                            timeSlot: timeSlot,
                            duration: durationHours,
                            group: params.selectedGroup,
                            powerEnabled: currentState,
                            isActiveSlot: isActiveSlot,
                        });

                        currentState = isOn;
                        startIndex = i;
                    }
                }

                // close last segment to the end of the day (index 48 => 24:00)
                const endIndex = sArr.length;
                const timeSlot = indexToTime(startIndex) + " - " + indexToTime(endIndex);
                const durationHours = (endIndex - startIndex) * 0.5;
                const isActiveSlot = isBeetweenSlots(momentCurrentDate, timeSlot);
                powerData.push({
                    timeSlot: timeSlot,
                    duration: durationHours,
                    group: params.selectedGroup,
                    powerEnabled: currentState,
                    isActiveSlot: isActiveSlot,
                });
            }
        }
    }

    powerData.sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));

    // No need to merge by groups anymore; we already have contiguous ranges per group
    var mergedPowerData = [...powerData];
    
    // Calculate total hours ON and OFF for the selected group & date
    let totalOn = 0;
    let totalOff = 0;

    mergedPowerData.forEach(elem => {
        if (elem.powerEnabled) {
            totalOn += elem.duration;
        } else {
            totalOff += elem.duration;
        }
    });

    // Round to 0.1 hour
    totalOn = Math.round(totalOn * 10) / 10;
    totalOff = Math.round(totalOff * 10) / 10;

    // Show totals under the table
    const totalsEl = document.getElementById("powerTotals");
    if (totalsEl) {
        // Use comma as decimal separator for UA style
        const onStr = totalOn.toFixed(1).replace('.', ',');
        const offStr = totalOff.toFixed(1).replace('.', ',');

        totalsEl.innerHTML = `
            Загалом <span class="green-text bold-text">${onStr} год</span> зі світлом
            <br/>та <span class="red-text bold-text">${offStr} год</span> без світла
            у ${params.selectedGroup} черзі.
        `;
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

            tr.innerHTML = '<td data-th="Період">' + elem.timeSlot + '</td>' +
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
    for (let i = powerData.length - 1; i >= index; i--) {
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
if (moment("2025-11").isSame(new Date(), "month")) {
    document.getElementById('anyDateInput').value = new Date().toDateInputValue();
}