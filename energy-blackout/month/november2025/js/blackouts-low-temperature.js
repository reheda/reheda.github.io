
// ------- blackouts for low temperatures ---------

const allTimeSlots = [
    [
        "00:00 - 01:30",
        "04:30 - 06:00",
        "09:00 - 10:30",
        "13:30 - 15:00",
        "18:00 - 19:30",
        "22:30 - 00:00",
    ],
    [
        "01:30 - 03:00",
        "06:00 - 07:30",
        "10:30 - 12:00",
        "15:00 - 16:30",
        "19:30 - 21:00",
    ],
    [
        "03:00 - 04:30",
        "07:30 - 09:00",
        "12:00 - 13:30",
        "16:30 - 18:00",
        "21:00 - 22:30",
    ]

];

const allGroups = [
    //0
    {
        group: 1,
        additionalGroups: [],
    },

    //1
    {
        group: 2,
        additionalGroups: [],
    },

    //2
    {
        group: 3,
        additionalGroups: [],
    },
]

//green color
const blackout1 = {
    dates: [11, 14, 17, 20, 23, 26, 29],
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

//orange color
const blackout2 = {
    dates: [10, 13, 16, 19, 22, 25, 28, 31],
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
const blackout3 = {
    dates: [9, 12, 15, 18, 21, 24, 27, 30],
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


const blackoutsForLowTemp = [
    blackout1,
    blackout2,
    blackout3,
]

// ----------------------------------------------

export { blackoutsForLowTemp };