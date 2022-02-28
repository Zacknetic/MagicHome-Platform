import { IAnimationLoop } from './types';
import { Animations } from './utils/Animations';

export { ControllerGenerator } from './ControllerGenerator';
export { BaseController } from './DeviceControllers/BaseController'
export * from './types'


const thunderstruck: IAnimationLoop = {

    'name': 'ThunderStruck',
    'pattern': [
        {
            'colorStart': {
                RGB: { red: 0, green: 0, blue: 0 }, CCT: { warmWhite: 0, coldWhite: 0 },

            },
            'colorTarget': {
                RGB: { red: 0, green: 0, blue: 0 }, CCT: { warmWhite: 0, coldWhite: 255 },
            },
            'transitionTimeMS': [2000, 3000],
            'durationAtTargetMS': 100,
            'chancePercent': 10,
        },
        {
            'colorStart': {
                RGB: { red: 0, green: 255, blue: 0 }, CCT: { warmWhite: 0, coldWhite: 0 },

            },
            'colorTarget': {
                RGB: { red: 255, green: 0, blue: 0 }, CCT: { warmWhite: 0, coldWhite: 0 },
            },
            'transitionTimeMS': [2000, 3000],
            'durationAtTargetMS': 100,
            'chancePercent': 100,
        },
    ],
    'accessories': [
        'Office Light',
    ],
    'accessoryOffsetMS': 0,
};

// let animations = new Animations();

// async function runAnimation() {
//     animations.animateIndividual(null, thunderstruck)
// }

// runAnimation()