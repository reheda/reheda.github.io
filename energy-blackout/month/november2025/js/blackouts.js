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

//green color
const blackout1 = {
    dates: [2, 5, 8, 11, 14, 17, 20, 23, 26, 29],
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

//orange color
const blackout2 = {
    dates: [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31],
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
    dates: [3, 6, 9, 12, 15, 18, 21, 24, 27, 30],
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


const blackouts = [
    blackout1,
    blackout2,
    blackout3,
]

export { blackouts };