import {assert} from 'chai';
import sinon from 'sinon';
import {ReduxTaxiMiddleware} from '../src/index';

describe('ReduxTaxiMiddleware', () => {
    const mockReduxTaxi = {
        isRegistered() {},
        collectPromise() {}
    };
    const nextHandler = ReduxTaxiMiddleware(mockReduxTaxi)();

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
                sinon.stub(mockReduxTaxi, 'isRegistered', () => false);
                try {
                    nextHandler()(asyncAction);
                } catch (err) {
                    assert.isTrue(err.message.indexOf(ASYNC_TYPE) > -1);
                    done();
                }
                mockReduxTaxi.isRegistered.restore();
            });

            it('must collect promises for registered actions', done => {
                sinon.stub(mockReduxTaxi, 'isRegistered', () => true);
                sinon.stub(mockReduxTaxi, 'collectPromise', (promise) => {
                    assert.strictEqual(testPromise, promise);
                    done();
                });

                const actionHandler = nextHandler(action => {
                    assert.strictEqual(action, asyncAction);
                });

                actionHandler(asyncAction);

                mockReduxTaxi.isRegistered.restore();
                mockReduxTaxi.collectPromise.restore();
            });
        }); // end describe('handle action')
    }); // end describe('handle next')
});
