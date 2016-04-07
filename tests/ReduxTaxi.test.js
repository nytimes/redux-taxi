import {assert} from 'chai';
import {ReduxTaxi} from '../src/index';

describe('ReduxTaxi', () => {
    const actionType1 = 'test1';
    const actionType2 = 'test2';
    const promise = new Promise(() => {}, () => {});
    let reduxTaxi;

    beforeEach(() => {
        reduxTaxi = ReduxTaxi();
    });

    it('should correctly register an action', () => {
        assert.strictEqual(reduxTaxi.getRegisteredActions().size, 0);
        assert.isFalse(reduxTaxi.isRegistered(actionType1));
        assert.isFalse(reduxTaxi.isRegistered(actionType2));

        reduxTaxi.register(actionType1);
        assert.strictEqual(reduxTaxi.getRegisteredActions().size, 1);
        assert.isTrue(reduxTaxi.isRegistered(actionType1));

        reduxTaxi.register(actionType2);
        assert.strictEqual(reduxTaxi.getRegisteredActions().size, 2);
        assert.isTrue(reduxTaxi.isRegistered(actionType2));
    });

    it('should only register the same action type once', () => {
        assert.isFalse(reduxTaxi.isRegistered(actionType1));

        reduxTaxi.register(actionType1);
        reduxTaxi.register(actionType1);

        assert.strictEqual(reduxTaxi.getRegisteredActions().size, 1);
        assert.isTrue(reduxTaxi.isRegistered(actionType1));
    });

    it('should return false for an unregistered action', () => {
        assert.isFalse(reduxTaxi.isRegistered(actionType1));
    });

    it('should return true for a registered action', () => {
        reduxTaxi.register(actionType1);
        assert.isTrue(reduxTaxi.isRegistered(actionType1));
    });

    it('should be able to collect promises', () => {
        assert.isArray(reduxTaxi.getAllPromises());
        assert.strictEqual(reduxTaxi.getAllPromises().length, 0);

        reduxTaxi.collectPromise(promise);
        assert.strictEqual(reduxTaxi.getAllPromises().length, 1);

        reduxTaxi.collectPromise(promise);
        assert.strictEqual(reduxTaxi.getAllPromises().length, 2);

        reduxTaxi.collectPromise(promise);
        assert.strictEqual(reduxTaxi.getAllPromises().length, 3);
    });
});
