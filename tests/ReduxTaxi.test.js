import { ReduxTaxi } from '../src/index';

describe('ReduxTaxi', () => {
    const actionType1 = 'test1';
    const actionType2 = 'test2';
    let reduxTaxi;

    beforeEach(() => {
        reduxTaxi = ReduxTaxi();
    });

    it('should correctly register an action', () => {
        expect(reduxTaxi.getRegisteredActions().size).toEqual(0);
        expect(reduxTaxi.isRegistered(actionType1)).toBeFalsy();
        expect(reduxTaxi.isRegistered(actionType2)).toBeFalsy();

        reduxTaxi.register(actionType1);
        expect(reduxTaxi.getRegisteredActions().size).toEqual(1);
        expect(reduxTaxi.isRegistered(actionType1)).toBeTruthy();

        reduxTaxi.register(actionType2);
        expect(reduxTaxi.getRegisteredActions().size).toEqual(2);
        expect(reduxTaxi.isRegistered(actionType2)).toBeTruthy();
    });

    it('should only register the same action type once', () => {
        expect(reduxTaxi.isRegistered(actionType1)).toBeFalsy();

        reduxTaxi.register(actionType1);
        reduxTaxi.register(actionType1);

        expect(reduxTaxi.isRegistered(actionType1)).toBeTruthy();
        expect(reduxTaxi.getRegisteredActions().size).toEqual(1);
    });

    it('should return false for an unregistered action', () => {
        expect(reduxTaxi.isRegistered(actionType1)).toBeFalsy();
    });

    it('should return true for a registered action', () => {
        reduxTaxi.register(actionType1);
        expect(reduxTaxi.isRegistered(actionType1)).toBeTruthy();
    });

    it('should be able to collect promises', () => {
        const promise = new Promise(() => {}, () => {});

        expect(reduxTaxi.getAllPromises()).toBeInstanceOf(Array);
        expect(reduxTaxi.getAllPromises()).toHaveLength(0);

        reduxTaxi.collectPromise(promise);
        expect(reduxTaxi.getAllPromises()).toHaveLength(1);

        reduxTaxi.collectPromise(promise);
        expect(reduxTaxi.getAllPromises()).toHaveLength(2);

        reduxTaxi.collectPromise(promise);
        expect(reduxTaxi.getAllPromises()).toHaveLength(3);
    });
});
