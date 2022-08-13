import { IAnimationLoop } from "./types";

export const thunderstruck: IAnimationLoop = {

    'name': 'ThunderStruck',
    'pattern': [
        {
            'colorStart': {
                RGB: { red: 0, green: 0, blue: 0 }, CCT: { warmWhite: 0, coldWhite: 0 },

            },
            'colorTarget': {
                RGB: { red: 255, green: 255, blue: 255 }, CCT: { warmWhite: 0, coldWhite: 0 },
            },
            'transitionTimeMS': 50,
            'durationAtTargetMS': 50,
            'chancePercent': 50,
        },
        {
            'colorStart': {
                RGB: { red: 0, green: 0, blue: 0 }, CCT: { warmWhite: 0, coldWhite: 0 },

            },
            'colorTarget': {
                RGB: { red: 0, green: 0, blue: 0 }, CCT: { warmWhite: 0, coldWhite: 0 },
            },
            'transitionTimeMS': 50,
            'durationAtTargetMS': 100,
            'chancePercent': 100,
        },
        {
            'colorStart': {
                RGB: { red: 0, green: 0, blue: 0 }, CCT: { warmWhite: 0, coldWhite: 0 },

            },
            'colorTarget': {
                RGB: { red: 255, green: 255, blue: 255 }, CCT: { warmWhite: 0, coldWhite: 0 },
            },
            'transitionTimeMS': 50,
            'durationAtTargetMS': 50,
            'chancePercent': 100,
        },
        {
            'colorStart': {
                RGB: { red: 0, green: 0, blue: 0 }, CCT: { warmWhite: 0, coldWhite: 0 },

            },
            'colorTarget': {
                RGB: { red: 0, green: 0, blue: 0 }, CCT: { warmWhite: 0, coldWhite: 0 },
            },
            'transitionTimeMS': [30000, 30000],
            'durationAtTargetMS': [200,500],
            'chancePercent': 100,
        },
    ],
    'accessoryOffsetMS': 0,
};

export const colorWave: IAnimationLoop = {

    'name': 'colorWave',
    'pattern': [
        {
            'colorStart': {
                RGB: { red: 255, green: 0, blue: 0 }, CCT: { warmWhite: 0, coldWhite: 0 },

            },
            'colorTarget': {
                RGB: { red: 127, green: 127, blue: 0 }, CCT: { warmWhite: 0, coldWhite: 0 },
            },
            'transitionTimeMS': 10000,
            'durationAtTargetMS': 1000,
            'chancePercent': 100,
        },
        {
            'colorStart': {
                RGB: { red: 127, green: 127, blue: 0 }, CCT: { warmWhite: 0, coldWhite: 0 },

            },
            'colorTarget': {
                RGB: { red: 0, green: 255, blue: 0 }, CCT: { warmWhite: 0, coldWhite: 0 },
            },
            'transitionTimeMS': 10000,
            'durationAtTargetMS': 1000,
            'chancePercent': 100,
        },
        {
            'colorStart': {
                RGB: { red: 0, green: 255, blue: 0 }, CCT: { warmWhite: 0, coldWhite: 0 },

            },
            'colorTarget': {
                RGB: { red: 0, green: 127, blue: 127 }, CCT: { warmWhite: 0, coldWhite: 0 },
            },
            'transitionTimeMS': 10000,
            'durationAtTargetMS': 1000,
            'chancePercent': 100,
        },
        {
            'colorStart': {
                RGB: { red: 0, green: 127, blue: 127 }, CCT: { warmWhite: 0, coldWhite: 0 },

            },
            'colorTarget': {
                RGB: { red: 0, green: 0, blue: 255 }, CCT: { warmWhite: 0, coldWhite: 0 },
            },
            'transitionTimeMS': 10000,
            'durationAtTargetMS': 1000,
            'chancePercent': 100,
        },
        {
            'colorStart': {
                RGB: { red: 0, green: 0, blue: 255 }, CCT: { warmWhite: 0, coldWhite: 0 },

            },
            'colorTarget': {
                RGB: { red: 127, green: 0, blue: 127 }, CCT: { warmWhite: 0, coldWhite: 0 },
            },
            'transitionTimeMS': 10000,
            'durationAtTargetMS': 1000,
            'chancePercent': 100,
        },
        {
            'colorStart': {
                RGB: { red: 127, green: 0, blue: 127 }, CCT: { warmWhite: 0, coldWhite: 0 },

            },
            'colorTarget': {
                RGB: { red: 255, green: 0, blue: 0 }, CCT: { warmWhite: 0, coldWhite: 0 },
            },
            'transitionTimeMS': 10000,
            'durationAtTargetMS': 1000,
            'chancePercent': 100,
        },
    ],
    'accessoryOffsetMS': 0,
};

const hell: IAnimationLoop = {

    'name': 'hell',
    'pattern': [
        {
            'colorTarget': {
                RGB: { red: [100, 255], green: [0, 25], blue: 0 }, CCT: { warmWhite: 0, coldWhite: 0 },
            },
            'transitionTimeMS': [100, 300],
            'durationAtTargetMS': [0, 5000],
            'chancePercent': 100,
        },
        {
            'colorStart': {
                RGB: { red: 0, green: 0, blue: 0 }, CCT: { warmWhite: 0, coldWhite: 255 },
            },
            'colorTarget': {
                RGB: { red: [100, 255], green: 0, blue: 0 }, CCT: { warmWhite: 0, coldWhite: 0 },
            },
            'transitionTimeMS': 30,
            'durationAtTargetMS': [100, 150],
            'chancePercent': 10,
        },
    ],
    'accessoryOffsetMS': 0,
};