import {assert} from 'chai';
import sinon from 'sinon';
import {AsyncRegisterMiddleware} from '../index';

describe('AsyncRegisterMiddleware', () => {
    const mockAsyncRegister = {
        isRegistered() {},
        collectPromise() {}
    };
    const nextHandler = AsyncRegisterMiddleware(mockAsyncRegister)();

    const SYNC_TYPE = 'SYNC_TYPE';
    const ASYNC_TYPE = 'ASYNC_TYPE';
    const testPromise = new Promise(() => {}, () => {});
    const syncAction = {
        type: SYNC_TYPE,
        payload: {}
    };
    const asyncAction = {
        type: ASYNC_TYPE,
        promise: testPromise
    };

    it('must return a function to handle next', () => {
        assert.isFunction(nextHandler);
        assert.strictEqual(nextHandler.length, 1);
    });

    describe('handle next', () => {
        it('must return a function to handle action', () => {
            const actionHandler = nextHandler();

            assert.isFunction(actionHandler);
            assert.strictEqual(actionHandler.length, 1);
        });

        describe('handle action', () => {
            it('must pass actions without promises to the next handler', done => {
                const actionHandler = nextHandler(action => {
                    assert.strictEqual(action, syncAction);
                    done();
                });

                actionHandler(syncAction);
            });

            it('must throw an error if the action is not registered', done => {
                sinon.stub(mockAsyncRegister, 'isRegistered', () => false);
                try {
                    nextHandler()(asyncAction);
                } catch (err) {
                    assert.isTrue(err.message.indexOf(ASYNC_TYPE) > -1);
                    done();
                }
                mockAsyncRegister.isRegistered.restore();
            });

            it('must collect promises for registered actions', done => {
                sinon.stub(mockAsyncRegister, 'isRegistered', () => true);
                sinon.stub(mockAsyncRegister, 'collectPromise', (promise) => {
                    assert.strictEqual(testPromise, promise);
                    done();
                });

                const actionHandler = nextHandler(action => {
                    assert.strictEqual(action, asyncAction);
                });

                actionHandler(asyncAction);

                mockAsyncRegister.isRegistered.restore();
                mockAsyncRegister.collectPromise.restore();
            });
        }); // end describe('handle action')
    }); // end describe('handle next')
});
