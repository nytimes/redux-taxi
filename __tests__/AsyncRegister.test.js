import {assert} from 'chai';
import {AsyncRegister} from '../index';

describe('AsyncRegister', () => {
    const actionType1 = 'test1';
    const actionType2 = 'test2';
    const promise = new Promise(() => {}, () => {});
    let asyncRegister;

    beforeEach(() => {
        asyncRegister = AsyncRegister();
    });

    it('should correctly register an action', () => {
        assert.strictEqual(asyncRegister.getRegisteredActions().size, 0);
        assert.isFalse(asyncRegister.isRegistered(actionType1));
        assert.isFalse(asyncRegister.isRegistered(actionType2));

        asyncRegister.register(actionType1);
        assert.strictEqual(asyncRegister.getRegisteredActions().size, 1);
        assert.isTrue(asyncRegister.isRegistered(actionType1));

        asyncRegister.register(actionType2);
        assert.strictEqual(asyncRegister.getRegisteredActions().size, 2);
        assert.isTrue(asyncRegister.isRegistered(actionType2));
    });

    it('should only register the same action type once', () => {
        assert.isFalse(asyncRegister.isRegistered(actionType1));

        asyncRegister.register(actionType1);
        asyncRegister.register(actionType1);

        assert.strictEqual(asyncRegister.getRegisteredActions().size, 1);
        assert.isTrue(asyncRegister.isRegistered(actionType1));
    });

    it('should return false for an unregistered action', () => {
        assert.isFalse(asyncRegister.isRegistered(actionType1));
    });

    it('should return true for a registered action', () => {
        asyncRegister.register(actionType1);
        assert.isTrue(asyncRegister.isRegistered(actionType1));
    });

    it('should be able to collect promises', () => {
        assert.isArray(asyncRegister.getAllPromises());
        assert.strictEqual(asyncRegister.getAllPromises().length, 0);

        asyncRegister.collectPromise(promise);
        assert.strictEqual(asyncRegister.getAllPromises().length, 1);

        asyncRegister.collectPromise(promise);
        assert.strictEqual(asyncRegister.getAllPromises().length, 2);

        asyncRegister.collectPromise(promise);
        assert.strictEqual(asyncRegister.getAllPromises().length, 3);
    });
});
